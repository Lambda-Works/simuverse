import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionMemoryService, ChatTurn } from './session-memory.service';
import { ConversationStateService, ConversationStateName } from './conversation-state.service';

const CHECKPOINT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export interface SessionRuntimeState {
  conversation_state: ConversationStateName;
  message_count: number;
  triggered_emails: string[];
  last_trigger_fires: Record<string, number>;
  last_checkpoint_at?: string;
  /** Preserved from practice start — not overwritten by checkpoint */
  prior_context?: string;
  /** AI-generated summary of the closed session — preserved across checkpoints */
  encore_summary?: string;
}

@Injectable()
export class SessionCheckpointService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionCheckpointService.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly lastPersistedTurn = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionMemory: SessionMemoryService,
    private readonly conversationState: ConversationStateService,
  ) {}

  onModuleDestroy() {
    for (const [id, timer] of this.timers) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  /** Start periodic checkpoint for an active session. */
  startPeriodicCheckpoint(sessionId: string): void {
    if (this.timers.has(sessionId)) return;

    const timer = setInterval(() => {
      this.checkpoint(sessionId).catch((err) => {
        this.logger.error(`Periodic checkpoint failed for ${sessionId}: ${err.message}`);
      });
    }, CHECKPOINT_INTERVAL_MS);

    // Avoid keeping the process alive solely for this timer
    if (typeof timer.unref === 'function') timer.unref();

    this.timers.set(sessionId, timer);
    this.logger.debug(`Started 2-min checkpoint timer for ${sessionId}`);
  }

  stopPeriodicCheckpoint(sessionId: string): void {
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(sessionId);
    }
  }

  /**
   * Persist new chat turns + runtime state (FSM + triggers) for a session.
   * Idempotent for already-persisted turn numbers.
   */
  async checkpoint(sessionId: string): Promise<{ turns_saved: number }> {
    const turns = await this.sessionMemory.getHistory(sessionId);
    const lastSaved = this.lastPersistedTurn.get(sessionId) ?? 0;
    const newTurns = turns.filter((t) => t.turn_number > lastSaved);

    if (newTurns.length > 0) {
      await this.persistTurnsWithRetry(sessionId, newTurns);
      const maxTurn = Math.max(...newTurns.map((t) => t.turn_number));
      this.lastPersistedTurn.set(sessionId, maxTurn);
    }

    const conv = this.conversationState.getState(sessionId);
    const memory = this.sessionMemory.getSessionSnapshot(sessionId);

    const existing = await this.prisma.simulationInstance.findUnique({
      where: { id: sessionId },
      select: { session_state: true },
    });
    const existingState = existing?.session_state as unknown as SessionRuntimeState | null;

    const runtimeState: SessionRuntimeState = {
      conversation_state: conv.state,
      message_count: conv.messageCount,
      triggered_emails: memory?.triggeredEmails ?? [],
      last_trigger_fires: memory?.lastTriggerFires ?? {},
      last_checkpoint_at: new Date().toISOString(),
      ...(existingState?.prior_context
        ? { prior_context: existingState.prior_context }
        : {}),
      ...(existingState?.encore_summary
        ? { encore_summary: existingState.encore_summary }
        : {}),
    };

    if (existing) {
      await this.prisma.simulationInstance.update({
        where: { id: sessionId },
        data: {
          session_state: runtimeState as unknown as Prisma.InputJsonValue,
          updated_at: new Date(),
        },
      });
    }

    this.logger.debug(
      `Checkpoint ${sessionId}: saved ${newTurns.length} turns, state=${conv.state}`,
    );
    return { turns_saved: newTurns.length };
  }

  /** Final flush then stop timer. */
  async checkpointAndClose(sessionId: string): Promise<{ turns_saved: number }> {
    const result = await this.checkpoint(sessionId);
    this.stopPeriodicCheckpoint(sessionId);
    return result;
  }

  /**
   * Hydrate memory + conversation state from DB for resume.
   */
  async hydrateSession(sessionId: string): Promise<void> {
    await this.sessionMemory.getHistory(sessionId);

    const instance = await this.prisma.simulationInstance.findUnique({
      where: { id: sessionId },
    });

    const state = instance?.session_state as unknown as SessionRuntimeState | null;
    if (state) {
      this.conversationState.restore(sessionId, {
        state: state.conversation_state || 'greeting',
        messageCount: state.message_count || 0,
      });
      if (state.triggered_emails?.length || state.last_trigger_fires) {
        this.sessionMemory.restoreTriggers(
          sessionId,
          state.triggered_emails || [],
          state.last_trigger_fires || {},
        );
      }
    }

    const turns = await this.sessionMemory.getHistory(sessionId);
    const maxTurn = turns.reduce((m, t) => Math.max(m, t.turn_number), 0);
    this.lastPersistedTurn.set(sessionId, maxTurn);
    this.startPeriodicCheckpoint(sessionId);
  }

  private async persistTurnsWithRetry(
    sessionId: string,
    turns: ChatTurn[],
    attempts = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        for (const turn of turns) {
          await this.prisma.simulationChatLog.create({
            data: {
              simulation_instance_id: sessionId,
              turn_number: turn.turn_number,
              speaker: turn.speaker,
              message: turn.message,
              is_correct: turn.is_correct ?? null,
              ref_number: turn.ref_number ?? null,
              metadata: turn.metadata
                ? (JSON.parse(JSON.stringify(turn.metadata)) as Prisma.InputJsonValue)
                : undefined,
            },
          });
        }
        return;
      } catch (err: any) {
        lastError = err;
        // Unique/duplicate turn — treat as success for that batch
        if (err?.code === 'P2002') {
          this.logger.warn(`Duplicate turn detected for ${sessionId}, continuing`);
          return;
        }
        this.logger.warn(
          `Checkpoint write attempt ${attempt}/${attempts} failed for ${sessionId}: ${err.message}`,
        );
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }

    throw lastError ?? new Error('Checkpoint persist failed');
  }
}

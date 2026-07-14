import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatTurn {
  turn_number: number;
  speaker: 'student' | 'ai' | 'system';
  message: string;
  is_correct?: boolean;
  ref_number?: string;
  metadata?: Record<string, unknown>;
  created_at?: Date;
}

export interface SessionMemory {
  simulationId: string;
  turns: ChatTurn[];
  hydrated: boolean;
  turnCount: number;
  triggeredEmails: string[];
  lastTriggerFires: Record<string, number>;
}

const MAX_TURNS = 50;

@Injectable()
export class SessionMemoryService {
  private readonly logger = new Logger(SessionMemoryService.name);
  private readonly cache = new Map<string, SessionMemory>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get full chat history for a simulation.
   * Returns cached data if hot path, otherwise hydrates from DB.
   */
  async getHistory(simulationId: string): Promise<ChatTurn[]> {
    let session = this.cache.get(simulationId);

    if (!session || !session.hydrated) {
      session = await this.hydrateFromDb(simulationId);
    }

    return session.turns;
  }

  /**
   * Append a new turn to the in-memory cache.
   * Does NOT persist to DB — flushed via SessionCheckpointService (2-min + close).
   */
  append(simulationId: string, turn: Omit<ChatTurn, 'turn_number'>): ChatTurn {
    let session = this.cache.get(simulationId);

    if (!session) {
      session = {
        simulationId,
        turns: [],
        hydrated: true,
        turnCount: 0,
        triggeredEmails: [],
        lastTriggerFires: {},
      };
      this.cache.set(simulationId, session);
    }

    const turnNumber = session.turnCount + 1;
    const fullTurn: ChatTurn = { ...turn, turn_number: turnNumber };
    session.turns.push(fullTurn);
    session.turnCount = turnNumber;

    // Enforce max turns — drop oldest when over limit
    if (session.turns.length > MAX_TURNS) {
      session.turns = session.turns.slice(session.turns.length - MAX_TURNS);
      this.logger.debug(
        `Trimmed session ${simulationId} to ${MAX_TURNS} turns (dropped oldest)`,
      );
    }

    return fullTurn;
  }

  /**
   * Invalidate cache for a simulation (e.g. on session end).
   */
  invalidate(simulationId: string): void {
    this.cache.delete(simulationId);
  }

  /**
   * Check if a simulation has an active session in cache.
   */
  hasSession(simulationId: string): boolean {
    return this.cache.has(simulationId);
  }

  /**
   * Get current turn count for a simulation.
   */
  getTurnCount(simulationId: string): number {
    return this.cache.get(simulationId)?.turnCount ?? 0;
  }

  /**
   * Get last fire timestamp for a specific trigger.
   */
  getLastTriggerFire(simulationId: string, triggerName: string): number | undefined {
    return this.cache.get(simulationId)?.lastTriggerFires[triggerName];
  }

  /**
   * Record that a trigger fired at the given timestamp.
   * Auto-creates session if not in cache.
   */
  recordTriggerFire(simulationId: string, triggerName: string, timestamp: number): void {
    let session = this.cache.get(simulationId);
    if (!session) {
      session = {
        simulationId,
        turns: [],
        hydrated: true,
        turnCount: 0,
        triggeredEmails: [],
        lastTriggerFires: {},
      };
      this.cache.set(simulationId, session);
    }
    session.lastTriggerFires[triggerName] = timestamp;
  }

  /**
   * Get the list of triggered email IDs for a simulation.
   */
  getTriggeredEmails(simulationId: string): string[] {
    return this.cache.get(simulationId)?.triggeredEmails ?? [];
  }

  /**
   * Mark an email as triggered for a simulation.
   * Auto-creates session if not in cache.
   */
  markEmailTriggered(simulationId: string, emailId: string): void {
    let session = this.cache.get(simulationId);
    if (!session) {
      session = {
        simulationId,
        turns: [],
        hydrated: true,
        turnCount: 0,
        triggeredEmails: [],
        lastTriggerFires: {},
      };
      this.cache.set(simulationId, session);
    }
    if (!session.triggeredEmails.includes(emailId)) {
      session.triggeredEmails.push(emailId);
    }
  }

  /**
   * Cold path: load existing turns from SimulationChatLog table.
   * Populates the cache and marks as hydrated.
   */
  private async hydrateFromDb(simulationId: string): Promise<SessionMemory> {
    this.logger.debug(`Hydrating session ${simulationId} from DB`);

    const rows = await this.prisma.simulationChatLog.findMany({
      where: { simulation_instance_id: simulationId },
      orderBy: { turn_number: 'asc' },
    });

    const turns: ChatTurn[] = rows.map((row) => ({
      turn_number: row.turn_number,
      speaker: row.speaker as ChatTurn['speaker'],
      message: row.message,
      is_correct: row.is_correct ?? undefined,
      ref_number: row.ref_number ?? undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? undefined,
      created_at: row.created_at,
    }));

    const session: SessionMemory = {
      simulationId,
      turns,
      hydrated: true,
      turnCount: turns.length > 0 ? turns[turns.length - 1].turn_number : 0,
      triggeredEmails: [],
      lastTriggerFires: {},
    };

    this.cache.set(simulationId, session);

    this.logger.debug(
      `Hydrated ${turns.length} turns for session ${simulationId}`,
    );

    return session;
  }

  /** Snapshot of in-memory session (for checkpoint). */
  getSessionSnapshot(simulationId: string): SessionMemory | undefined {
    return this.cache.get(simulationId);
  }

  /** Restore trigger state after hydrate from DB. */
  restoreTriggers(
    simulationId: string,
    triggeredEmails: string[],
    lastTriggerFires: Record<string, number>,
  ): void {
    let session = this.cache.get(simulationId);
    if (!session) {
      session = {
        simulationId,
        turns: [],
        hydrated: true,
        turnCount: 0,
        triggeredEmails: [],
        lastTriggerFires: {},
      };
      this.cache.set(simulationId, session);
    }
    session.triggeredEmails = [...triggeredEmails];
    session.lastTriggerFires = { ...lastTriggerFires };
  }
}

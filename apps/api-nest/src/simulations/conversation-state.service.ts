import { Injectable, Logger } from '@nestjs/common';

export type ConversationStateName = 'greeting' | 'development' | 'milestone' | 'closing';

export interface ConversationState {
  simulationId: string;
  state: ConversationStateName;
  messageCount: number;
}

const VALID_TRANSITIONS: Record<ConversationStateName, ConversationStateName[]> = {
  greeting: ['development'],
  development: ['milestone', 'closing'],
  milestone: ['development', 'closing'],
  closing: [],
};

const STATE_PROMPTS: Record<ConversationStateName, string> = {
  greeting:
    'Estás dando la bienvenida al estudiante. Sé cálido, presentate brevemente y explicá de qué trata la simulación. No des tareas todavía.',
  development:
    'El estudiante está trabajando en las tareas del escenario. Sé profesional, guiá sin dar respuestas directas, y orientá con preguntas. No evalúes ni califiques.',
  milestone:
    'Se alcanzó un hito importante (evento, crisis o logro). Reconocé el progreso del estudiante, hacé un breve resumen y motivá a continuar.',
  closing:
    'La simulación está por finalizar. Hacé un cierre amable, resumí los puntos clave de la práctica y agradecé la participación.',
};

@Injectable()
export class ConversationStateService {
  private readonly logger = new Logger(ConversationStateService.name);
  private readonly states = new Map<string, ConversationState>();

  /**
   * Get current state for a simulation. Returns 'greeting' if no state exists yet.
   */
  getState(simulationId: string): ConversationState {
    return (
      this.states.get(simulationId) ?? {
        simulationId,
        state: 'greeting',
        messageCount: 0,
      }
    );
  }

  /**
   * Transition to the next state. Returns the new state or null if transition is invalid.
   */
  transition(simulationId: string, to: ConversationStateName): ConversationState | null {
    const current = this.getState(simulationId);
    const allowed = VALID_TRANSITIONS[current.state];

    if (!allowed.includes(to)) {
      this.logger.warn(
        `Invalid transition for ${simulationId}: ${current.state} → ${to} (allowed: ${allowed.join(', ')})`,
      );
      return null;
    }

    const next: ConversationState = {
      ...current,
      state: to,
      messageCount: current.messageCount + 1,
    };
    this.states.set(simulationId, next);
    this.logger.debug(`State transition for ${simulationId}: ${current.state} → ${to}`);
    return next;
  }

  /**
   * Increment message count without changing state.
   */
  incrementMessage(simulationId: string): void {
    const current = this.getState(simulationId);
    const updated = { ...current, messageCount: current.messageCount + 1 };
    this.states.set(simulationId, updated);
  }

  /**
   * Get the prompt instruction for a given state.
   */
  getStatePrompt(state: ConversationStateName): string {
    return STATE_PROMPTS[state];
  }

  /**
   * Auto-determine next state based on message count and current state.
   * greeting → development on first substantive message (messageCount >= 2).
   * development → closing after 20+ messages (heuristic).
   */
  autoTransition(simulationId: string): ConversationState {
    const current = this.getState(simulationId);

    // Increment first, then check conditions
    const updated = { ...current, messageCount: current.messageCount + 1 };
    this.states.set(simulationId, updated);

    if (updated.state === 'greeting' && updated.messageCount >= 2) {
      const next = this.transition(simulationId, 'development');
      if (next) return next;
    }

    if (updated.state === 'development' && updated.messageCount >= 20) {
      const next = this.transition(simulationId, 'closing');
      if (next) return next;
    }

    return this.getState(simulationId);
  }

  /**
   * Remove state for a simulation (cleanup).
   */
  remove(simulationId: string): void {
    this.states.delete(simulationId);
  }

  /**
   * Restore persisted conversation state after hydrate.
   */
  restore(
    simulationId: string,
    data: { state: ConversationStateName; messageCount: number },
  ): void {
    this.states.set(simulationId, {
      simulationId,
      state: data.state,
      messageCount: data.messageCount,
    });
  }
}

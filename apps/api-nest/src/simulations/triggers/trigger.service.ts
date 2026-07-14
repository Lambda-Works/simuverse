import { Injectable, Logger } from '@nestjs/common';
import { Trigger, TriggerContext } from './trigger.interface';
import { SessionMemoryService } from '../session-memory.service';

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export interface TriggerResult {
  triggerName: string;
  message: string;
}

@Injectable()
export class TriggerService {
  private readonly logger = new Logger(TriggerService.name);

  constructor(
    private readonly triggers: Trigger[],
    private readonly sessionMemory: SessionMemoryService,
  ) {}

  /**
   * Check all registered triggers for a simulation.
   * Returns proactive messages from triggers that fired and are not on cooldown.
   */
  check(simulationId: string, ctx: TriggerContext): TriggerResult[] {
    const results: TriggerResult[] = [];
    const now = Date.now();

    for (const trigger of this.triggers) {
      if (!trigger.shouldFire(simulationId, ctx)) {
        continue;
      }

      const lastFired = this.sessionMemory.getLastTriggerFire(
        simulationId,
        trigger.name,
      );

      if (lastFired !== undefined && now - lastFired < DEFAULT_COOLDOWN_MS) {
        this.logger.debug(
          `Trigger "${trigger.name}" on cooldown for session ${simulationId}`,
        );
        continue;
      }

      const message = trigger.getMessage(simulationId, ctx);
      this.sessionMemory.recordTriggerFire(simulationId, trigger.name, now);

      results.push({ triggerName: trigger.name, message });
      this.logger.debug(
        `Trigger "${trigger.name}" fired for session ${simulationId}`,
      );
    }

    return results;
  }
}

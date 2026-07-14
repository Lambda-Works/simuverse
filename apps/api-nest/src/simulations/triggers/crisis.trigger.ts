import { Injectable } from '@nestjs/common';
import { Trigger, TriggerContext } from './trigger.interface';
import { CrisisEngine } from '../engines/crisis-engine.service';

@Injectable()
export class CrisisTrigger implements Trigger {
  readonly name = 'crisis';

  constructor(private readonly crisisEngine: CrisisEngine) {}

  shouldFire(simulationId: string, ctx: TriggerContext): boolean {
    // Check for an existing active crisis — do NOT create one
    const event = this.crisisEngine.getActiveCrisis(simulationId);
    return event !== null && event.status === 'active';
  }

  getMessage(simulationId: string, ctx: TriggerContext): string {
    const event = this.crisisEngine.getActiveCrisis(simulationId);
    if (!event || event.status !== 'active') return '';

    return `🚨 Crisis activa: ${event.title}\n${event.description}`;
  }
}

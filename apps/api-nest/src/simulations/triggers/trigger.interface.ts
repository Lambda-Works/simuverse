import { CourseConfig } from '@prisma/client';

export interface TriggerContext {
  scenario: any;
  config: CourseConfig | null;
  state: string;
}

export interface Trigger {
  readonly name: string;
  shouldFire(simulationId: string, ctx: TriggerContext): boolean;
  getMessage(simulationId: string, ctx: TriggerContext): string;
}

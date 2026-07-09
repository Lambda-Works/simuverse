import { Injectable } from '@nestjs/common';
import { Trigger, TriggerContext } from './trigger.interface';
import { SessionMemoryService } from '../session-memory.service';

export interface ScenarioEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  read?: boolean;
}

@Injectable()
export class EmailTrigger implements Trigger {
  readonly name = 'email';

  constructor(private readonly sessionMemory: SessionMemoryService) {}

  shouldFire(simulationId: string, ctx: TriggerContext): boolean {
    const emails = this.getEmails(ctx);
    if (emails.length === 0) return false;

    const triggered = this.sessionMemory.getTriggeredEmails(simulationId);
    const pendingUnread = emails.filter(
      (e) => !e.read && !triggered.includes(e.id),
    );

    return pendingUnread.length > 0;
  }

  getMessage(simulationId: string, ctx: TriggerContext): string {
    const emails = this.getEmails(ctx);
    const triggered = this.sessionMemory.getTriggeredEmails(simulationId);
    const pendingUnread = emails.filter(
      (e) => !e.read && !triggered.includes(e.id),
    );

    if (pendingUnread.length === 0) return '';

    const email = pendingUnread[0];
    this.sessionMemory.markEmailTriggered(simulationId, email.id);

    return `📧 Nuevo correo de ${email.from}: "${email.subject}"`;
  }

  private getEmails(ctx: TriggerContext): ScenarioEmail[] {
    return (ctx.scenario?.content as any)?.emails ?? [];
  }
}

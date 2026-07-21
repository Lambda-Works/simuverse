import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DispatchedAsset {
  type: 'email' | 'crisis';
  data: any;
}

interface PracticeSession {
  practiceId: string;
  sheetId: number;
  emails: any[];
  crisis: any[];
  timers: NodeJS.Timeout[];
  messageCount: number;
  firedAssets: Set<string>;
  pendingDispatches: DispatchedAsset[];
}

@Injectable()
export class AssetDispatcherService {
  private sessions = new Map<string, PracticeSession>();

  constructor(private prisma: PrismaService) {}

  /**
   * Called when a simulation instance starts or switches practice.
   * Loads linked assets from the tech sheet's pipeline_output,
   * filters by practice_id, and schedules time-based dispatches.
   */
  async startPractice(instanceId: string, scenarioId: string): Promise<void> {
    this.endPractice(instanceId);

    const scenario = await this.prisma.scenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) return;

    const content = (scenario.content || {}) as Record<string, any>;
    const taskId = content.tech_sheet_task_id;
    const sheetId = content.tech_sheet_id;
    if (!taskId || !sheetId) return;

    const sheet = await this.prisma.techSheet.findUnique({
      where: { id: sheetId },
    });
    if (!sheet) return;

    const po = (sheet.pipeline_output || {}) as Record<string, any>;
    const allEmails = po.step_8_emails || [];
    const allCrisis = po.step_10_crisis || [];
    const practiceEmails = allEmails.filter(
      (e: any) => e.practice_id === taskId,
    );
    const practiceCrisis = allCrisis.filter(
      (c: any) => c.practice_id === taskId,
    );

    const timers: NodeJS.Timeout[] = [];
    const firedAssets = new Set<string>();
    const pendingDispatches: DispatchedAsset[] = [];

    const session: PracticeSession = {
      practiceId: taskId,
      sheetId,
      emails: practiceEmails,
      crisis: practiceCrisis,
      timers,
      messageCount: 0,
      firedAssets,
      pendingDispatches,
    };

    // Schedule time-based assets
    practiceEmails.forEach((email: any, i: number) => {
      const mode = email.trigger_mode || 'time';
      const value = email.trigger_value ?? email.timing_minutes ?? 0;
      if (mode === 'time') {
        const key = `email-${i}`;
        if (value === 0) {
          if (!session.firedAssets.has(key)) {
            session.firedAssets.add(key);
            session.pendingDispatches.push({ type: 'email', data: email });
          }
        } else if (value > 0) {
          const timer = setTimeout(() => {
            if (!session.firedAssets.has(key)) {
              session.firedAssets.add(key);
              session.pendingDispatches.push({ type: 'email', data: email });
            }
          }, value * 60 * 1000);
          timers.push(timer);
        }
      }
    });

    practiceCrisis.forEach((crisis: any, i: number) => {
      const mode = crisis.trigger_mode || 'time';
      const value = crisis.trigger_value ?? 0;
      if (mode === 'time') {
        const key = `crisis-${i}`;
        if (value === 0) {
          if (!session.firedAssets.has(key)) {
            session.firedAssets.add(key);
            session.pendingDispatches.push({ type: 'crisis', data: crisis });
          }
        } else if (value > 0) {
          const timer = setTimeout(() => {
            if (!session.firedAssets.has(key)) {
              session.firedAssets.add(key);
              session.pendingDispatches.push({ type: 'crisis', data: crisis });
            }
          }, value * 60 * 1000);
          timers.push(timer);
        }
      }
    });

    this.sessions.set(instanceId, session);
  }

  /**
   * Called on every user message. Checks message-count-based triggers.
   */
  onMessage(instanceId: string): DispatchedAsset[] {
    const session = this.sessions.get(instanceId);
    if (!session) return [];

    session.messageCount++;

    // Check message-count triggers for emails
    session.emails.forEach((email: any, i: number) => {
      const key = `email-${i}`;
      const mode = email.trigger_mode;
      const value = email.trigger_value ?? 0;
      if (
        mode === 'messages' &&
        value > 0 &&
        session.messageCount >= value &&
        !session.firedAssets.has(key)
      ) {
        session.firedAssets.add(key);
        session.pendingDispatches.push({ type: 'email', data: email });
      }
    });

    // Check message-count triggers for crisis
    session.crisis.forEach((crisis: any, i: number) => {
      const key = `crisis-${i}`;
      const mode = crisis.trigger_mode;
      const value = crisis.trigger_value ?? 0;
      if (
        mode === 'messages' &&
        value > 0 &&
        session.messageCount >= value &&
        !session.firedAssets.has(key)
      ) {
        session.firedAssets.add(key);
        session.pendingDispatches.push({ type: 'crisis', data: crisis });
      }
    });

    const toReturn = [...session.pendingDispatches];
    session.pendingDispatches = [];
    return toReturn;
  }

  /**
   * Clean up timers when practice ends or simulation switches.
   */
  endPractice(instanceId: string): void {
    const session = this.sessions.get(instanceId);
    if (session) {
      session.timers.forEach((t) => clearTimeout(t));
      this.sessions.delete(instanceId);
    }
  }

  /**
   * Returns all emails that have been fired for a given active session.
   */
  getDispatchedEmails(instanceId: string): any[] {
    const session = this.sessions.get(instanceId);
    if (!session) return [];
    return session.emails.filter((_, i) => session.firedAssets.has(`email-${i}`));
  }

  /**
   * Active session getter for testing / diagnostics.
   */
  getSession(instanceId: string): PracticeSession | undefined {
    return this.sessions.get(instanceId);
  }
}

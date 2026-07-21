import { Test, TestingModule } from '@nestjs/testing';
import { AssetDispatcherService } from './asset-dispatcher.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AssetDispatcherService', () => {
  let service: AssetDispatcherService;
  let prisma: {
    scenario: { findUnique: jest.Mock };
    techSheet: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    prisma = {
      scenario: { findUnique: jest.fn() },
      techSheet: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetDispatcherService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AssetDispatcherService>(AssetDispatcherService);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startPractice', () => {
    it('should load linked assets and set up session', async () => {
      const scenarioId = 'scen-1';
      const instanceId = 'sim-1';
      const taskId = 'task-uuid-1';
      const sheetId = 42;

      prisma.scenario.findUnique.mockResolvedValue({
        id: scenarioId,
        content: { tech_sheet_task_id: taskId, tech_sheet_id: sheetId },
      });

      prisma.techSheet.findUnique.mockResolvedValue({
        id: sheetId,
        pipeline_output: {
          step_8_emails: [
            {
              subject: 'Mail 1',
              practice_id: taskId,
              trigger_mode: 'time',
              trigger_value: 5,
            },
            {
              subject: 'Mail 2 - unlinked',
              practice_id: 'other-task',
              trigger_mode: 'time',
              trigger_value: 1,
            },
          ],
          step_10_crisis: [
            {
              detonante: 'Crisis 1',
              practice_id: taskId,
              trigger_mode: 'messages',
              trigger_value: 2,
            },
          ],
        },
      });

      await service.startPractice(instanceId, scenarioId);

      const session = service.getSession(instanceId);
      expect(session).toBeDefined();
      expect(session?.emails).toHaveLength(1);
      expect(session?.crisis).toHaveLength(1);
      expect(session?.timers).toHaveLength(1);
    });

    it('should fire time-based dispatches when timer expires', async () => {
      const scenarioId = 'scen-1';
      const instanceId = 'sim-1';
      const taskId = 'task-uuid-1';
      const sheetId = 42;

      prisma.scenario.findUnique.mockResolvedValue({
        id: scenarioId,
        content: { tech_sheet_task_id: taskId, tech_sheet_id: sheetId },
      });

      prisma.techSheet.findUnique.mockResolvedValue({
        id: sheetId,
        pipeline_output: {
          step_8_emails: [
            {
              subject: 'Time Mail',
              practice_id: taskId,
              trigger_mode: 'time',
              trigger_value: 2, // 2 minutes
            },
          ],
        },
      });

      await service.startPractice(instanceId, scenarioId);

      // Before timer
      let dispatches = service.onMessage(instanceId);
      expect(dispatches).toHaveLength(0);

      // Advance timers by 2 minutes (120,000 ms)
      jest.advanceTimersByTime(2 * 60 * 1000);

      // Next message should collect the pending time dispatch
      dispatches = service.onMessage(instanceId);
      expect(dispatches).toHaveLength(1);
      expect(dispatches[0].type).toBe('email');
      expect(dispatches[0].data.subject).toBe('Time Mail');

      // Subsequent message should not repeat dispatch
      dispatches = service.onMessage(instanceId);
      expect(dispatches).toHaveLength(0);
    });

    it('should synchronously fire 0-minute time-based dispatches immediately', async () => {
      const scenarioId = 'scen-1';
      const instanceId = 'sim-0min';
      const taskId = 'task-uuid-1';
      const sheetId = 42;

      prisma.scenario.findUnique.mockResolvedValue({
        id: scenarioId,
        content: { tech_sheet_task_id: taskId, tech_sheet_id: sheetId },
      });

      prisma.techSheet.findUnique.mockResolvedValue({
        id: sheetId,
        pipeline_output: {
          step_8_emails: [
            {
              subject: 'Instant Mail',
              practice_id: taskId,
              trigger_mode: 'time',
              trigger_value: 0,
            },
          ],
        },
      });

      await service.startPractice(instanceId, scenarioId);

      const dispatched = service.getDispatchedEmails(instanceId);
      expect(dispatched).toHaveLength(1);
      expect(dispatched[0].subject).toBe('Instant Mail');
    });
  });

  describe('onMessage', () => {
    it('should fire message-count triggers when threshold reached', async () => {
      const scenarioId = 'scen-1';
      const instanceId = 'sim-1';
      const taskId = 'task-uuid-1';
      const sheetId = 42;

      prisma.scenario.findUnique.mockResolvedValue({
        id: scenarioId,
        content: { tech_sheet_task_id: taskId, tech_sheet_id: sheetId },
      });

      prisma.techSheet.findUnique.mockResolvedValue({
        id: sheetId,
        pipeline_output: {
          step_10_crisis: [
            {
              detonante: 'Server Down',
              practice_id: taskId,
              trigger_mode: 'messages',
              trigger_value: 2,
            },
          ],
        },
      });

      await service.startPractice(instanceId, scenarioId);

      // Message 1 (threshold is 2)
      let dispatches = service.onMessage(instanceId);
      expect(dispatches).toHaveLength(0);

      // Message 2
      dispatches = service.onMessage(instanceId);
      expect(dispatches).toHaveLength(1);
      expect(dispatches[0].type).toBe('crisis');
      expect(dispatches[0].data.detonante).toBe('Server Down');

      // Message 3 should not re-trigger
      dispatches = service.onMessage(instanceId);
      expect(dispatches).toHaveLength(0);
    });
  });

  describe('endPractice', () => {
    it('should clear timers and remove session', async () => {
      const scenarioId = 'scen-1';
      const instanceId = 'sim-1';
      const taskId = 'task-uuid-1';
      const sheetId = 42;

      prisma.scenario.findUnique.mockResolvedValue({
        id: scenarioId,
        content: { tech_sheet_task_id: taskId, tech_sheet_id: sheetId },
      });

      prisma.techSheet.findUnique.mockResolvedValue({
        id: sheetId,
        pipeline_output: {
          step_8_emails: [
            {
              subject: 'Mail',
              practice_id: taskId,
              trigger_mode: 'time',
              trigger_value: 10,
            },
          ],
        },
      });

      await service.startPractice(instanceId, scenarioId);
      expect(service.getSession(instanceId)).toBeDefined();

      service.endPractice(instanceId);
      expect(service.getSession(instanceId)).toBeUndefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SessionCheckpointService } from './session-checkpoint.service';
import { SessionMemoryService } from './session-memory.service';
import { ConversationStateService } from './conversation-state.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionCheckpointService', () => {
  let service: SessionCheckpointService;
  let prismaMock: Record<string, any>;
  let sessionMemory: SessionMemoryService;
  let conversationState: ConversationStateService;

  beforeEach(async () => {
    prismaMock = {
      simulationInstance: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      simulationChatLog: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionCheckpointService,
        SessionMemoryService,
        ConversationStateService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SessionCheckpointService);
    sessionMemory = module.get(SessionMemoryService);
    conversationState = module.get(ConversationStateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.onModuleDestroy();
  });

  describe('checkpoint', () => {
    it('persists new turns and session_state', async () => {
      prismaMock.simulationInstance.findUnique.mockResolvedValue({
        session_state: null,
      });
      prismaMock.simulationInstance.update.mockResolvedValue({});
      prismaMock.simulationChatLog.create.mockResolvedValue({});

      sessionMemory.append('inst-1', { speaker: 'student', message: 'Hola' });
      sessionMemory.append('inst-1', { speaker: 'ai', message: 'Bienvenido' });
      conversationState.restore('inst-1', { state: 'development', messageCount: 2 });

      const result = await service.checkpoint('inst-1');

      expect(result.turns_saved).toBe(2);
      expect(prismaMock.simulationChatLog.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.simulationInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inst-1' },
          data: expect.objectContaining({
            session_state: expect.objectContaining({
              conversation_state: 'development',
              message_count: 2,
            }),
          }),
        }),
      );
    });

    it('preserves prior_context in session_state', async () => {
      prismaMock.simulationInstance.findUnique.mockResolvedValue({
        session_state: { prior_context: 'Resumen práctica anterior' },
      });
      prismaMock.simulationInstance.update.mockResolvedValue({});

      await service.checkpoint('inst-1');

      expect(prismaMock.simulationInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            session_state: expect.objectContaining({
              prior_context: 'Resumen práctica anterior',
            }),
          }),
        }),
      );
    });

    it('skips already-persisted turns on second checkpoint', async () => {
      prismaMock.simulationInstance.findUnique.mockResolvedValue({ session_state: null });
      prismaMock.simulationInstance.update.mockResolvedValue({});
      prismaMock.simulationChatLog.create.mockResolvedValue({});

      sessionMemory.append('inst-1', { speaker: 'student', message: 'Uno' });
      await service.checkpoint('inst-1');

      sessionMemory.append('inst-1', { speaker: 'ai', message: 'Dos' });
      const result = await service.checkpoint('inst-1');

      expect(result.turns_saved).toBe(1);
      expect(prismaMock.simulationChatLog.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('hydrateSession', () => {
    it('restores FSM and triggers from session_state', async () => {
      prismaMock.simulationChatLog.findMany.mockResolvedValue([
        {
          turn_number: 1,
          speaker: 'student',
          message: 'Hola',
          is_correct: null,
          ref_number: null,
          metadata: null,
          created_at: new Date(),
        },
      ]);
      prismaMock.simulationInstance.findUnique.mockResolvedValue({
        session_state: {
          conversation_state: 'milestone',
          message_count: 5,
          triggered_emails: ['email-1'],
          last_trigger_fires: { crisis: 12345 },
        },
      });

      await service.hydrateSession('inst-1');

      expect(conversationState.getState('inst-1').state).toBe('milestone');
      expect(conversationState.getState('inst-1').messageCount).toBe(5);
      expect(sessionMemory.getTriggeredEmails('inst-1')).toEqual(['email-1']);
      expect(sessionMemory.getLastTriggerFire('inst-1', 'crisis')).toBe(12345);
    });
  });

  describe('checkpointAndClose', () => {
    it('flushes then stops periodic timer', async () => {
      prismaMock.simulationInstance.findUnique.mockResolvedValue({ session_state: null });
      prismaMock.simulationInstance.update.mockResolvedValue({});

      service.startPeriodicCheckpoint('inst-1');
      const result = await service.checkpointAndClose('inst-1');

      expect(result.turns_saved).toBe(0);
      // Starting again should create a new timer (no early return from existing)
      service.startPeriodicCheckpoint('inst-1');
    });
  });
});

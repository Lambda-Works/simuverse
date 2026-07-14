import { Test, TestingModule } from '@nestjs/testing';
import { SessionMemoryService } from './session-memory.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionMemoryService', () => {
  let service: SessionMemoryService;
  let prismaMock: Record<string, any>;

  beforeEach(async () => {
    prismaMock = {
      simulationChatLog: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionMemoryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SessionMemoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHistory', () => {
    it('should return empty array for new session', async () => {
      prismaMock.simulationChatLog.findMany.mockResolvedValue([]);

      const history = await service.getHistory('sim-1');
      expect(history).toEqual([]);
      expect(prismaMock.simulationChatLog.findMany).toHaveBeenCalledWith({
        where: { simulation_instance_id: 'sim-1' },
        orderBy: { turn_number: 'asc' },
      });
    });

    it('should hydrate from DB on first access (cache miss)', async () => {
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
        {
          turn_number: 2,
          speaker: 'ai',
          message: 'Hola! Como estas?',
          is_correct: null,
          ref_number: null,
          metadata: null,
          created_at: new Date(),
        },
      ]);

      const history = await service.getHistory('sim-1');
      expect(history).toHaveLength(2);
      expect(history[0].speaker).toBe('student');
      expect(history[1].speaker).toBe('ai');
    });

    it('should use cache on second access (cache hit)', async () => {
      prismaMock.simulationChatLog.findMany.mockResolvedValue([
        {
          turn_number: 1,
          speaker: 'student',
          message: 'Test',
          is_correct: null,
          ref_number: null,
          metadata: null,
          created_at: new Date(),
        },
      ]);

      await service.getHistory('sim-1');
      await service.getHistory('sim-1');

      // DB called only once — second call used cache
      expect(prismaMock.simulationChatLog.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle metadata from DB as JSON object', async () => {
      prismaMock.simulationChatLog.findMany.mockResolvedValue([
        {
          turn_number: 1,
          speaker: 'student',
          message: 'Test',
          is_correct: true,
          ref_number: 'ref-001',
          metadata: { intent: 'question', confidence: 0.95 },
          created_at: new Date(),
        },
      ]);

      const history = await service.getHistory('sim-1');
      expect(history[0].metadata).toEqual({ intent: 'question', confidence: 0.95 });
      expect(history[0].ref_number).toBe('ref-001');
      expect(history[0].is_correct).toBe(true);
    });
  });

  describe('append', () => {
    it('should append a turn and auto-increment turn_number', () => {
      const turn = service.append('sim-1', {
        speaker: 'student',
        message: 'Hola profesor',
      });

      expect(turn.turn_number).toBe(1);
      expect(turn.speaker).toBe('student');
      expect(turn.message).toBe('Hola profesor');
    });

    it('should increment turn_number across multiple appends', () => {
      service.append('sim-1', { speaker: 'student', message: 'Hola' });
      service.append('sim-1', { speaker: 'ai', message: 'Hola!' });
      const third = service.append('sim-1', { speaker: 'student', message: 'Como estas?' });

      expect(third.turn_number).toBe(3);
    });

    it('should keep history accessible after appends', async () => {
      service.append('sim-1', { speaker: 'student', message: 'Hola' });
      service.append('sim-1', { speaker: 'ai', message: 'Hola!' });

      // getHistory should now return cached data without DB call
      const history = await service.getHistory('sim-1');
      expect(history).toHaveLength(2);
      expect(prismaMock.simulationChatLog.findMany).not.toHaveBeenCalled();
    });

    it('should enforce 50-turn limit by trimming oldest', () => {
      // Append 55 turns
      for (let i = 0; i < 55; i++) {
        service.append('sim-1', { speaker: 'student', message: `Turn ${i}` });
      }

      const history = service['cache'].get('sim-1')!;
      expect(history.turns).toHaveLength(50);
      expect(history.turns[0].turn_number).toBe(6); // first 5 trimmed
      expect(history.turnCount).toBe(55);
    });
  });

  describe('invalidate', () => {
    it('should remove session from cache', async () => {
      prismaMock.simulationChatLog.findMany.mockResolvedValue([]);

      await service.getHistory('sim-1');
      expect(service.hasSession('sim-1')).toBe(true);

      service.invalidate('sim-1');
      expect(service.hasSession('sim-1')).toBe(false);
    });
  });

  describe('hasSession', () => {
    it('should return false for unknown simulation', () => {
      expect(service.hasSession('nonexistent')).toBe(false);
    });

    it('should return true after first append', () => {
      service.append('sim-1', { speaker: 'student', message: 'Hi' });
      expect(service.hasSession('sim-1')).toBe(true);
    });
  });

  describe('getTurnCount', () => {
    it('should return 0 for unknown simulation', () => {
      expect(service.getTurnCount('nonexistent')).toBe(0);
    });

    it('should return correct count after appends', () => {
      service.append('sim-1', { speaker: 'student', message: 'A' });
      service.append('sim-1', { speaker: 'ai', message: 'B' });
      expect(service.getTurnCount('sim-1')).toBe(2);
    });
  });
});

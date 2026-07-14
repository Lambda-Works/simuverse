import { Test, TestingModule } from '@nestjs/testing';
import { AsyncPersistenceService } from './async-persistence.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AsyncPersistenceService', () => {
  let service: AsyncPersistenceService;
  let prismaMock: Record<string, any>;
  let createMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn().mockResolvedValue({ id: 1 });
    prismaMock = {
      simulationChatLog: {
        create: createMock,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncPersistenceService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(AsyncPersistenceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTurn', () => {
    it('should call prisma.create with correct shape', () => {
      service.saveTurn('sim-1', {
        turn_number: 1,
        speaker: 'student',
        message: 'Hola',
      });

      expect(createMock).toHaveBeenCalledWith({
        data: {
          simulation_instance_id: 'sim-1',
          turn_number: 1,
          speaker: 'student',
          message: 'Hola',
          is_correct: null,
          ref_number: null,
          metadata: null,
        },
      });
    });

    it('should pass is_correct and ref_number when provided', () => {
      service.saveTurn('sim-2', {
        turn_number: 3,
        speaker: 'ai',
        message: 'Respuesta correcta',
        is_correct: true,
        ref_number: 'ref-003',
        metadata: { score: 95 },
      });

      expect(createMock).toHaveBeenCalledWith({
        data: {
          simulation_instance_id: 'sim-2',
          turn_number: 3,
          speaker: 'ai',
          message: 'Respuesta correcta',
          is_correct: true,
          ref_number: 'ref-003',
          metadata: { score: 95 },
        },
      });
    });

    it('should be non-blocking — does not throw on DB error', () => {
      createMock.mockRejectedValueOnce(new Error('DB connection lost'));

      // Should not throw — fire-and-forget
      expect(() => {
        service.saveTurn('sim-1', {
          turn_number: 1,
          speaker: 'student',
          message: 'Test',
        });
      }).not.toThrow();
    });

    it('should serialize metadata to JSON-safe format', () => {
      service.saveTurn('sim-1', {
        turn_number: 1,
        speaker: 'student',
        message: 'Test',
        metadata: { nested: { value: 42 } },
      });

      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: { nested: { value: 42 } },
          }),
        }),
      );
    });
  });
});

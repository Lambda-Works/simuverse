import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisPipelineService } from './analysis-pipeline.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarkitdownClient } from './markitdown-client.service';
import { DeepSeekService } from './deepseek.service';
import { BadRequestException } from '@nestjs/common';

describe('AnalysisPipelineService', () => {
  let service: AnalysisPipelineService;
  let prismaService: jest.Mocked<PrismaService>;
  let markitdownClient: jest.Mocked<MarkitdownClient>;
  let deepseekService: jest.Mocked<DeepSeekService>;

  const mockTechSheet = {
    id: 1,
    name: 'Test Tech Sheet',
    course_id: 'course-123',
    file_url: '/uploads/test.pdf',
    pipeline_status: null,
    pipeline_output: null,
    extracted_data: null,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      techSheet: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockMarkitdownClient = {
      convert: jest.fn(),
    };

    const mockDeepseekService = {
      chat: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisPipelineService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MarkitdownClient,
          useValue: mockMarkitdownClient,
        },
        {
          provide: DeepSeekService,
          useValue: mockDeepseekService,
        },
      ],
    }).compile();

    service = module.get<AnalysisPipelineService>(AnalysisPipelineService);
    prismaService = module.get(PrismaService);
    markitdownClient = module.get(MarkitdownClient);
    deepseekService = module.get(DeepSeekService);

    // Setup default mock implementations
    prismaService.techSheet.findUnique.mockResolvedValue(mockTechSheet);
    prismaService.techSheet.update.mockResolvedValue(mockTechSheet);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('run()', () => {
    it('should execute steps sequentially and update DB per step', async () => {
      // Mock markitdown response
      markitdownClient.convert.mockResolvedValue('# Documento markdown');

      // Mock DeepSeek responses for steps 2-6
      deepseekService.chat
        .mockResolvedValueOnce('VALIDADO: Documento válido') // Step 2
        .mockResolvedValueOnce('[{"name": "Competencia 1"}]') // Step 3
        .mockResolvedValueOnce('[{"name": "KPI 1"}]') // Step 4
        .mockResolvedValueOnce('Pregunta 1: ¿Qué es...?') // Step 5
        .mockResolvedValueOnce('Simulación: Escenario...'); // Step 6

      await service.run(1);

      // Verify all steps were called
      expect(markitdownClient.convert).toHaveBeenCalledWith('/uploads/test.pdf');
      expect(deepseekService.chat).toHaveBeenCalledTimes(5);

      // Verify DB updates for each step
      expect(prismaService.techSheet.update).toHaveBeenCalledTimes(7);
      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { pipeline_status: 'step_1' },
      });
      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { pipeline_status: 'step_2' },
      });
      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { pipeline_status: 'completed' },
      });
    });

    it('should stop on failure and set error status', async () => {
      // Mock markitdown to fail
      markitdownClient.convert.mockRejectedValue(new Error('Markitdown failed'));

      await service.run(1);

      // Verify error status was set
      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          pipeline_status: 'failed',
          pipeline_output: expect.objectContaining({
            error_step: 1,
            error_message: 'Markitdown failed',
          }),
        },
      });

      // DeepSeek should not be called after step 1 fails
      expect(deepseekService.chat).not.toHaveBeenCalled();
    });

    it('should stop on validation rejection', async () => {
      markitdownClient.convert.mockResolvedValue('# Documento markdown');
      deepseekService.chat.mockResolvedValueOnce('RECHAZADO: Documento no válido');

      await service.run(1);

      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          pipeline_status: 'validation_rejected',
        },
      });

      // Should not proceed to step 3
      expect(deepseekService.chat).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException if tech sheet not found', async () => {
      prismaService.techSheet.findUnique.mockResolvedValue(null);

      await expect(service.run(999)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no file_url', async () => {
      prismaService.techSheet.findUnique.mockResolvedValue({
        ...mockTechSheet,
        file_url: null,
      });

      await expect(service.run(1)).rejects.toThrow(BadRequestException);
    });

    it('should populate extracted_data.analyzed_config on completion', async () => {
      markitdownClient.convert.mockResolvedValue('# Documento markdown');
      deepseekService.chat
        .mockResolvedValueOnce('VALIDADO')
        .mockResolvedValueOnce('[{"name": "Competencia 1"}]')
        .mockResolvedValueOnce('[{"name": "KPI 1"}]')
        .mockResolvedValueOnce('Pregunta 1')
        .mockResolvedValueOnce('Simulación 1');

      await service.run(1);

      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          pipeline_status: 'completed',
          extracted_data: {
            analyzed_config: {
              competencies: '[{"name": "Competencia 1"}]',
              kpis: '[{"name": "KPI 1"}]',
              questions: 'Pregunta 1',
              simulation_prompt: 'Simulación 1',
            },
          },
        },
      });
    });
  });
});
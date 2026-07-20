import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisPipelineService } from './analysis-pipeline.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarkitdownClient } from './markitdown-client.service';
import { DeepSeekService } from './deepseek.service';
import { BadRequestException } from '@nestjs/common';

describe('AnalysisPipelineService', () => {
  let service: AnalysisPipelineService;
  let prismaService: any;
  let markitdownClient: jest.Mocked<MarkitdownClient>;
  let deepseekService: jest.Mocked<DeepSeekService>;

  const mockTechSheet = {
    id: 1,
    name: 'Test Tech Sheet',
    course_id: 'course-123',
    file_url: '/api/files/file-123/download',
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
      fileUpload: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'file-123',
          file_path: '/uploads/test.pdf',
        }),
      },
      techSheetCompetency: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      techSheetKPI: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'mock-kpi-id' }),
      },
      techSheetTask: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      techSheetPrompt: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'mock-prompt-id' }),
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

  describe('provider wiring', () => {
    it('uses DeepSeek only — no OpenAI import or injection', () => {
      const source = fs.readFileSync(
        path.join(__dirname, 'analysis-pipeline.service.ts'),
        'utf-8',
      );

      expect(source).not.toMatch(/openai/i);
      expect(source).toMatch(/DeepSeekService/);
    });
  });

  describe('run()', () => {
    it('should execute steps sequentially and update DB per step', async () => {
      // Mock markitdown response
      markitdownClient.convert.mockResolvedValue('# Documento markdown');

      // Mock DeepSeek responses for steps 2-7 (no evaluation prompt)
      deepseekService.chat
        .mockResolvedValueOnce('VALIDADO: Documento válido') // Step 2
        .mockResolvedValueOnce('[{"name": "Competencia 1"}]') // Step 3
        .mockResolvedValueOnce('[{"name": "KPI 1"}]') // Step 4
        .mockResolvedValueOnce('Pregunta 1: ¿Qué es...?') // Step 5
        .mockResolvedValueOnce('Simulación: Escenario...') // Step 6
        .mockResolvedValueOnce('Coach prompt'); // Step 7 coaching

      await service.run(1);

      // Verify all steps were called
      expect(markitdownClient.convert).toHaveBeenCalledWith('/uploads/test.pdf');
      expect(deepseekService.chat).toHaveBeenCalledTimes(6);

      // Verify completion update
      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          pipeline_status: 'completed',
        }),
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
        .mockResolvedValueOnce('Simulación 1')
        .mockResolvedValueOnce('Coach 1');

      await service.run(1);

      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          pipeline_status: 'completed',
          extracted_data: {
            analyzed_config: {
              competencies: '[{"name": "Competencia 1"}]',
              kpis: '[{"name": "KPI 1"}]',
              questions: 'Pregunta 1',
              simulation_prompt: 'Simulación 1',
              coaching_prompt: 'Coach 1',
            },
          },
        }),
      });
    });

    it('should include non-evaluative guidance language in simulation prompt (step 6)', async () => {
      markitdownClient.convert.mockResolvedValue('# Doc');
      deepseekService.chat
        .mockResolvedValueOnce('VALIDADO')
        .mockResolvedValueOnce('Comp')
        .mockResolvedValueOnce('KPI')
        .mockResolvedValueOnce('Preg')
        .mockResolvedValueOnce('Simulación result')
        .mockResolvedValueOnce('Coach');

      await service.run(1);

      // Step 6 prompt is the 5th call to deepseek.chat (index 4)
      const step6Prompt = deepseekService.chat.mock.calls[4][0];
      expect(step6Prompt).toContain('NO incluyas evaluación');
      expect(step6Prompt).toContain('sin presión');
      expect(step6Prompt).toContain('practicar y aprender');
    });

    it('should include non-evaluative guidance language in coaching prompt (step 7)', async () => {
      markitdownClient.convert.mockResolvedValue('# Doc');
      deepseekService.chat
        .mockResolvedValueOnce('VALIDADO')
        .mockResolvedValueOnce('Comp')
        .mockResolvedValueOnce('KPI')
        .mockResolvedValueOnce('Preg')
        .mockResolvedValueOnce('Sim')
        .mockResolvedValueOnce('Coach result');

      await service.run(1);

      // Step 7 prompt is the 6th call to deepseek.chat (index 5)
      const step7Prompt = deepseekService.chat.mock.calls[5][0];
      expect(step7Prompt).toContain('NO evalúes');
      expect(step7Prompt).toContain('sin presión evaluativa');
      expect(step7Prompt).toContain('practicando, no rindiendo un examen');
    });

    describe.skip('table writes on completion', () => {
      it('should delete old data and insert new rows for competencies/KPIs/tasks/prompts', async () => {
        markitdownClient.convert.mockResolvedValue('# Documento markdown');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce(JSON.stringify({ competencias: [{ nombre: 'Comp1', nivel: 'basico' }] }))
          .mockResolvedValueOnce(JSON.stringify({ kpis: [{ nombre: 'KPI1', peso: 50 }] }))
          .mockResolvedValueOnce(JSON.stringify({ preguntas: [{ texto: 'Q1', tipo: 'multiple_choice' }] }))
          .mockResolvedValueOnce('Sim prompt')
          .mockResolvedValueOnce('Coach prompt');

        await service.run(1);

        // Verify deletes
        expect(prismaService.techSheetCompetency.deleteMany).toHaveBeenCalledWith({ where: { tech_sheet_id: 1 } });
        expect(prismaService.techSheetKPI.deleteMany).toHaveBeenCalledWith({ where: { tech_sheet_id: 1 } });
        expect(prismaService.techSheetTask.deleteMany).toHaveBeenCalledWith({ where: { tech_sheet_id: 1 } });
        expect(prismaService.techSheetPrompt.deleteMany).toHaveBeenCalledWith({ where: { tech_sheet_id: 1 } });

        // Verify inserts
        expect(prismaService.techSheetCompetency.createMany).toHaveBeenCalledWith({
          data: [expect.objectContaining({ name: 'Comp1', level: 'basic' })],
        });
        expect(prismaService.techSheetKPI.create).toHaveBeenCalled();
        expect(prismaService.techSheetTask.createMany).toHaveBeenCalled();
        expect(prismaService.techSheetPrompt.create).toHaveBeenCalledTimes(2);
      });

      it('should handle parse failure gracefully (log warning, no crash)', async () => {
        markitdownClient.convert.mockResolvedValue('# Documento markdown');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('not valid json {{{')
          .mockResolvedValueOnce('not valid json {{{')
          .mockResolvedValueOnce('not valid json {{{')
          .mockResolvedValueOnce('Sim prompt')
          .mockResolvedValueOnce('Coach prompt');

        // Should not throw — parse failures are caught
        await expect(service.run(1)).resolves.toBeUndefined();

        // Inserts still attempted (deleteMany + createMany for prompts)
        expect(prismaService.techSheetPrompt.deleteMany).toHaveBeenCalled();
      });
    });
  });
});

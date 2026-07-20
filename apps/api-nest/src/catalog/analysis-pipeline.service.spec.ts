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
      courseConfig: {
        findUnique: jest.fn().mockResolvedValue(null),
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
      buildEmailsPrompt: jest.fn().mockReturnValue('mock-emails-prompt'),
      buildSpreadsheetPrompt: jest.fn().mockReturnValue('mock-spreadsheet-prompt'),
      buildCrisisPrompt: jest.fn().mockReturnValue('mock-crisis-prompt'),
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

    describe('step 8 — email generation (module gate)', () => {
      it('should skip step 8 when email_simulado is not active', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['chat_ia', 'documentos'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach');

        await service.run(1);

        // DeepSeek should only be called 6 times (steps 2-7), not 7
        expect(deepseekService.chat).toHaveBeenCalledTimes(6);
        // Last updateOutput call should not contain step_8_emails
        const lastOutputUpdate = prismaService.techSheet.update.mock.calls
          .filter((c: any) => c[0].data?.pipeline_output)
          .pop();
        expect(lastOutputUpdate[0].data.pipeline_output.step_8_emails).toBeUndefined();
      });

      it('should run step 8 when email_simulado is active', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['email_simulado'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach')
          .mockResolvedValueOnce(
            JSON.stringify([{ subject: 'Test', body: 'Body', trigger_condition: 'on_start', timing_minutes: 0 }]),
          );

        await service.run(1);

        // DeepSeek should be called 7 times (steps 2-8)
        expect(deepseekService.chat).toHaveBeenCalledTimes(7);
        const lastOutputUpdate = prismaService.techSheet.update.mock.calls
          .filter((c: any) => c[0].data?.pipeline_output)
          .pop();
        expect(lastOutputUpdate[0].data.pipeline_output.step_8_emails).toBeDefined();
      });

      it('should not fail pipeline when step 8 DeepSeek call throws', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['email_simulado'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach')
          .mockRejectedValueOnce(new Error('DeepSeek timeout'));

        await service.run(1);

        expect(prismaService.techSheet.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ pipeline_status: 'completed' }),
          }),
        );
      });
    });

    describe('normalizeActiveModules', () => {
      it('should support array-of-objects format (from frontend course config)', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: [
            { id: 'email_simulado', name: 'Email Simulado', enabled: true },
            { id: 'hoja_calculo', name: 'Hoja de Cálculo', enabled: true },
            { id: 'crisis_engine', name: 'Motor de Crisis', enabled: true },
          ],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach')
          .mockResolvedValueOnce(
            JSON.stringify([{ subject: 'Email', body: 'Body', trigger_condition: 'start', timing_minutes: 0 }]),
          )
          .mockResolvedValueOnce(
            JSON.stringify({ columnas: [{ encabezado: 'C', tipo: 'texto' }], datos_ejemplo: [] }),
          )
          .mockResolvedValueOnce(
            JSON.stringify([{ detonante: 'X', descripcion: 'Y', opciones_resolucion: ['A'] }]),
          );

        await service.run(1);

        // Should call 9 times: steps 2-7 + 3 extra for steps 8-10
        expect(deepseekService.chat).toHaveBeenCalledTimes(9);
      });

      it('should skip disabled modules in object format', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: [
            { id: 'email_simulado', name: 'Email', enabled: true },
            { id: 'hoja_calculo', name: 'Hoja', enabled: false },
            { id: 'crisis_engine', name: 'Crisis', enabled: false },
          ],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach')
          .mockResolvedValueOnce(
            JSON.stringify([{ subject: 'E', body: 'B', trigger_condition: 'start', timing_minutes: 0 }]),
          );

        await service.run(1);

        // Only step 8 should run (email_simulado enabled), steps 9-10 skipped
        expect(deepseekService.chat).toHaveBeenCalledTimes(7);
      });
    });

    describe('step 9 — spreadsheet generation (module gate + retry)', () => {
      it('should skip step 9 when hoja_calculo is not active', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['chat_ia'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach');

        await service.run(1);

        expect(deepseekService.chat).toHaveBeenCalledTimes(6);
        const lastOutputUpdate = prismaService.techSheet.update.mock.calls
          .filter((c: any) => c[0].data?.pipeline_output)
          .pop();
        expect(lastOutputUpdate[0].data.pipeline_output.step_9_spreadsheet).toBeUndefined();
      });

      it('should run step 9 when hoja_calculo is active', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['hoja_calculo'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach')
          .mockResolvedValueOnce(
            JSON.stringify({ columnas: [{ encabezado: 'A', tipo: 'texto' }], datos_ejemplo: [{ a: 1 }] }),
          );

        await service.run(1);

        expect(deepseekService.chat).toHaveBeenCalledTimes(7);
        const lastOutputUpdate = prismaService.techSheet.update.mock.calls
          .filter((c: any) => c[0].data?.pipeline_output)
          .pop();
        expect(lastOutputUpdate[0].data.pipeline_output.step_9_spreadsheet).toBeDefined();
      });

      it('should retry once on parse failure then succeed', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['hoja_calculo'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach')
          .mockResolvedValueOnce('not valid json {{{')
          .mockResolvedValueOnce(
            JSON.stringify({ columnas: [{ encabezado: 'A', tipo: 'texto' }], datos_ejemplo: [{ a: 1 }] }),
          );

        await service.run(1);

        // 8 calls: steps 2-7 + first attempt (parse fail) + retry (success)
        expect(deepseekService.chat).toHaveBeenCalledTimes(8);
        const lastOutputUpdate = prismaService.techSheet.update.mock.calls
          .filter((c: any) => c[0].data?.pipeline_output)
          .pop();
        expect(lastOutputUpdate[0].data.pipeline_output.step_9_spreadsheet).toBeDefined();
      });
    });

    describe('step 10 — crisis scenarios (module gate + timeout resilience)', () => {
      it('should skip step 10 when crisis_engine is not active', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['chat_ia'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach');

        await service.run(1);

        expect(deepseekService.chat).toHaveBeenCalledTimes(6);
        const lastOutputUpdate = prismaService.techSheet.update.mock.calls
          .filter((c: any) => c[0].data?.pipeline_output)
          .pop();
        expect(lastOutputUpdate[0].data.pipeline_output.step_10_crisis).toBeUndefined();
      });

      it('should run step 10 when crisis_engine is active', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['crisis_engine'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach')
          .mockResolvedValueOnce(
            JSON.stringify({ escenarios: [{ detonante: 'X', descripcion: 'Y', opciones_resolucion: ['A'] }] }),
          );

        await service.run(1);

        expect(deepseekService.chat).toHaveBeenCalledTimes(7);
        const lastOutputUpdate = prismaService.techSheet.update.mock.calls
          .filter((c: any) => c[0].data?.pipeline_output)
          .pop();
        expect(lastOutputUpdate[0].data.pipeline_output.step_10_crisis).toBeDefined();
      });

      it('should not fail pipeline when step 10 throws timeout error', async () => {
        prismaService.courseConfig.findUnique.mockResolvedValue({
          active_modules: ['crisis_engine'],
        });
        markitdownClient.convert.mockResolvedValue('# Doc');
        deepseekService.chat
          .mockResolvedValueOnce('VALIDADO')
          .mockResolvedValueOnce('Comp')
          .mockResolvedValueOnce('KPI')
          .mockResolvedValueOnce('Preg')
          .mockResolvedValueOnce('Sim')
          .mockResolvedValueOnce('Coach')
          .mockRejectedValueOnce(Object.assign(new Error('timeout of 60000ms exceeded'), { code: 'ECONNABORTED' }));

        await service.run(1);

        expect(prismaService.techSheet.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ pipeline_status: 'completed' }),
          }),
        );
      });
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

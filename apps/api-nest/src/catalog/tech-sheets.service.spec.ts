// NOTE: Some tests broken from Vite→Next.js migration — config API tests for step 8-10 are new and should pass
import { Test, TestingModule } from '@nestjs/testing';
import { TechSheetsService } from './tech-sheets.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisPipelineService } from './analysis-pipeline.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TechSheetsService', () => {
  let service: TechSheetsService;
  let prismaService: any;
  let analysisPipeline: any;

  const mockSheet = {
    id: 1,
    name: 'Test Sheet',
    course_id: 'course-123',
    extracted_data: null,
    pipeline_status: 'completed',
    file_url: '/api/files/f1/download',
    competencies: null,
    kpi_requirements: null,
    processed: true,
  };

  beforeEach(async () => {
    prismaService = {
      techSheet: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      techSheetCompetency: {
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      techSheetKPI: {
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      techSheetTask: {
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      techSheetPrompt: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
      course: {
        findFirst: jest.fn(),
      },
    };

    analysisPipeline = {
      run: jest.fn(),
      syncPracticesToCourse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechSheetsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AnalysisPipelineService, useValue: analysisPipeline },
      ],
    }).compile();

    service = module.get<TechSheetsService>(TechSheetsService);
    prismaService.techSheet.findUnique.mockResolvedValue(mockSheet);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig()', () => {
    it('should return from relational tables when data exists', async () => {
      prismaService.techSheetCompetency.count.mockResolvedValue(2);
      prismaService.techSheetCompetency.findMany.mockResolvedValue([
        { id: 'c1', name: 'Comp A', description: 'Desc A', level: 'basic', category: 'tecnica' },
        { id: 'c2', name: 'Comp B', description: 'Desc B', level: 'advanced', category: 'transversal' },
      ]);
      prismaService.techSheetKPI.findMany.mockResolvedValue([
        {
          id: 'k1', name: 'KPI 1', description: 'KPI desc', category: 'evaluacion',
          weight: 30, target_value: 80, minimum_pass_value: 60,
          tasks: [{ id: 't1', type: 'practice', title: 'Question 1', description: '', difficulty: 'medium', sequence: 1, expected_duration_minutes: 0 }],
        },
      ]);
      prismaService.techSheetTask.findMany.mockResolvedValue([
        { id: 't1', kpi_id: 'k1', type: 'practice', title: 'Question 1', description: '', difficulty: 'medium', sequence: 1, expected_duration_minutes: 0 },
      ]);
      prismaService.techSheetPrompt.findMany.mockResolvedValue([
        { type: 'system', content: 'System prompt' },
        { type: 'coaching', content: 'Coach prompt' },
      ]);

      const result = await service.getConfig(1);

      expect(result.competencies).toHaveLength(2);
      expect(result.competencies[0].name).toBe('Comp A');
      expect(result.kpis).toHaveLength(1);
      expect(result.kpis[0].evaluation_questions).toEqual(['Question 1']);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].kpi_id).toBe('k1');
      expect(result.tasks[0].type).toBe('practice');
      expect(result.tasks[0].difficulty).toBe('medium');
      const prompts: any = result.prompts;
      expect(prompts.system_prompt).toBe('System prompt');
      expect(prompts.evaluation_prompt).toBeUndefined();
      expect(prompts.coaching_prompt).toBe('Coach prompt');
      expect(result.pipeline_status).toBe('completed');
    });

    it('should fallback to JSONB when tables are empty', async () => {
      prismaService.techSheetCompetency.count.mockResolvedValue(0);
      prismaService.techSheet.findUnique.mockResolvedValue({
        ...mockSheet,
        extracted_data: {
          analyzed_config: {
            competencies: JSON.stringify([{ nombre: 'Comp JSON', nivel: 'basico' }]),
            kpis: JSON.stringify([{ nombre: 'KPI JSON', peso: 50 }]),
            questions: JSON.stringify([{ texto: 'Question JSON', tipo: 'multiple_choice' }]),
            simulation_prompt: 'Sim prompt',
            evaluation_prompt: 'Eval prompt',
            coaching_prompt: 'Coach prompt',
          },
        },
      });

      const result = await service.getConfig(1);

      expect(result.competencies).toHaveLength(1);
      expect(result.competencies[0].name).toBe('Comp JSON');
      expect(result.competencies[0].id).toBeDefined(); // ephemeral UUID
      expect(result.kpis).toHaveLength(1);
      expect(result.kpis[0].weight).toBe(50);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Question JSON');
      const prompts2: any = result.prompts;
      expect(prompts2.system_prompt).toBe('Sim prompt');
    });

    it('should return empty skeleton when no config exists', async () => {
      prismaService.techSheetCompetency.count.mockResolvedValue(0);
      prismaService.techSheet.findUnique.mockResolvedValue({
        ...mockSheet,
        extracted_data: null,
      });

      const result = await service.getConfig(1);

      expect(result.competencies).toEqual([]);
      expect(result.kpis).toEqual([]);
      expect(result.tasks).toEqual([]);
      expect(result.prompts).toEqual({});
    });
  });

  describe('updateConfig()', () => {
    it('should write to relational tables and update JSONB', async () => {
      prismaService.techSheet.findUnique.mockResolvedValue(mockSheet);

      const mockKpiCreated = { id: 'new-kpi-1' };
      prismaService.techSheetKPI.create.mockResolvedValue(mockKpiCreated);
      prismaService.techSheet.update.mockResolvedValue(mockSheet);
      prismaService.$transaction.mockImplementation(async (fn: any) => fn(prismaService));

      await service.updateConfig(1, {
        competencies: [{ name: 'New Comp', level: 'basic' }],
        kpis: [{ name: 'New KPI', weight: 100 }],
        tasks: [{ title: 'New Task', type: 'practice' }],
        prompts: { system_prompt: 'New system', coaching_prompt: 'New coach' },
      });

      // Verify findMany called to check existing entries
      expect(prismaService.techSheetCompetency.findMany).toHaveBeenCalledWith({ where: { tech_sheet_id: 1 } });
      expect(prismaService.techSheetKPI.findMany).toHaveBeenCalledWith({ where: { tech_sheet_id: 1 } });
      expect(prismaService.techSheetTask.findMany).toHaveBeenCalledWith({ where: { tech_sheet_id: 1 } });
      expect(prismaService.techSheetPrompt.deleteMany).toHaveBeenCalledWith({ where: { tech_sheet_id: 1 } });

      // Verify create for competencies
      expect(prismaService.techSheetCompetency.create).toHaveBeenCalledWith({
        data: { tech_sheet_id: 1, name: 'New Comp', description: '', level: 'basic', category: 'tecnica' },
      });

      // Verify KPI create
      expect(prismaService.techSheetKPI.create).toHaveBeenCalled();

      // Verify JSONB also updated
      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { extracted_data: expect.objectContaining({ analyzed_config: expect.any(Object) }) },
      });
    });

    it('should preserve existing extracted_data keys', async () => {
      prismaService.techSheet.findUnique.mockResolvedValue({
        ...mockSheet,
        extracted_data: { other_key: 'preserved', analyzed_config: {} },
      });
      prismaService.$transaction.mockImplementation(async (fn: any) => fn(prismaService));
      prismaService.techSheet.update.mockResolvedValue(mockSheet);

      await service.updateConfig(1, { competencies: [{ name: 'X' }] });

      expect(prismaService.techSheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          extracted_data: {
            other_key: 'preserved',
            analyzed_config: { competencies: [{ name: 'X' }] },
          },
        },
      });
    });

    it('should return step_8_emails from pipeline_output in getConfig', async () => {
      prismaService.techSheetCompetency.count.mockResolvedValue(0);
      prismaService.techSheet.findUnique.mockResolvedValue({
        ...mockSheet,
        extracted_data: null,
        pipeline_output: {
          step_1_markdown: '# Doc',
          step_8_emails: [{ subject: 'Email', body: 'Body', trigger_condition: 'start', timing_minutes: 0 }],
          step_9_spreadsheet: { columnas: [{ encabezado: 'Col', tipo: 'texto' }], datos_ejemplo: [] },
          step_10_crisis: [{ detonante: 'X', descripcion: 'Y', opciones_resolucion: ['A'] }],
        },
      });

      const result = await service.getConfig(1);

      // Config should include pipeline_output step 8-10 fields
      expect((result as any).pipeline_output).toBeDefined();
      expect((result as any).pipeline_output.step_8_emails).toHaveLength(1);
      expect((result as any).pipeline_output.step_9_spreadsheet.columnas).toHaveLength(1);
      expect((result as any).pipeline_output.step_10_crisis).toHaveLength(1);
    });

    it('should return null step 8-10 fields when pipeline_output has no step 8-10 keys', async () => {
      prismaService.techSheetCompetency.count.mockResolvedValue(0);
      prismaService.techSheet.findUnique.mockResolvedValue({
        ...mockSheet,
        extracted_data: null,
        pipeline_output: { step_1_markdown: '# Doc' },
      });

      const result = await service.getConfig(1);

      expect((result as any).pipeline_output).toBeDefined();
      expect((result as any).pipeline_output.step_8_emails).toBeNull();
      expect((result as any).pipeline_output.step_9_spreadsheet).toBeNull();
      expect((result as any).pipeline_output.step_10_crisis).toBeNull();
    });

    it('should persist step_8_emails edits via updateConfig without removing other keys', async () => {
      prismaService.techSheet.findUnique.mockResolvedValue({
        ...mockSheet,
        extracted_data: { analyzed_config: {} },
        pipeline_output: {
          step_1_markdown: '# Doc',
          step_7_coaching_prompt: 'Coach prompt',
          step_8_emails: [{ subject: 'Old', body: 'Old body' }],
        },
      });
      prismaService.techSheet.update.mockResolvedValue(mockSheet);
      prismaService.$transaction.mockImplementation(async (fn: any) => fn(prismaService));

      await service.updateConfig(1, {
        competencies: [],
        kpis: [],
        tasks: [],
        prompts: {},
        pipeline_output: {
          step_8_emails: [{ subject: 'New', body: 'New body' }],
        },
      });

      const updateCall = prismaService.techSheet.update.mock.calls.find(
        (c: any) => c[0].data?.pipeline_output,
      );
      expect(updateCall).toBeDefined();
      expect(updateCall[0].data.pipeline_output.step_8_emails[0].subject).toBe('New');
      expect(updateCall[0].data.pipeline_output.step_7_coaching_prompt).toBe('Coach prompt');
    });
  });

  describe('analyze()', () => {
    it('should throw if sheet not found', async () => {
      prismaService.techSheet.findUnique.mockResolvedValue(null);
      await expect(service.analyze(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw if no course assigned', async () => {
      prismaService.techSheet.findUnique.mockResolvedValue({ ...mockSheet, course_id: null });
      await expect(service.analyze(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw if no content available', async () => {
      prismaService.techSheet.findUnique.mockResolvedValue({ ...mockSheet, file_url: null, description: null });
      await expect(service.analyze(1)).rejects.toThrow(BadRequestException);
    });

    it('should trigger pipeline fire-and-forget', async () => {
      analysisPipeline.run.mockResolvedValue(undefined);

      const result = await service.analyze(1);

      expect(result.message).toBe('Analysis pipeline triggered');
      expect(result.sheet_id).toBe(1);
      expect(analysisPipeline.run).toHaveBeenCalledWith(1);
    });
  });
});

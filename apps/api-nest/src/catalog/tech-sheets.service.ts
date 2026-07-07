import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechSheetDto } from './dto/create-tech-sheet.dto';
import { UpdateTechSheetDto } from './dto/update-tech-sheet.dto';
import { UpdateTechSheetConfigDto } from './dto/update-tech-sheet-config.dto';
import { AnalysisPipelineService } from './analysis-pipeline.service';

@Injectable()
export class TechSheetsService {
  constructor(
    private prisma: PrismaService,
    private analysisPipeline: AnalysisPipelineService,
  ) {}

  async findAll() {
    return this.prisma.techSheet.findMany({ orderBy: { created_at: 'desc' } });
  }

  async findValid() {
    const sheets = await this.prisma.techSheet.findMany({
      orderBy: { created_at: 'desc' },
    });
    return sheets
      .filter((s) => s.name && (s.competencies || s.kpi_requirements))
      .map((s) => ({
        id: s.id,
        name: s.name,
        processed: s.processed,
        has_competencies: !!s.competencies,
        has_kpis: !!s.kpi_requirements,
      }));
  }

  async findOne(id: number) {
    const sheet = await this.prisma.techSheet.findUnique({ where: { id } });
    if (!sheet) {
      throw new NotFoundException('Tech sheet not found');
    }
    return sheet;
  }

  async create(dto: CreateTechSheetDto) {
    // Validate course exists
    const course = await this.prisma.course.findFirst({
      where: { id: dto.course_id },
    });
    if (!course) {
      throw new BadRequestException(
        `Course with ID "${dto.course_id}" does not exist`,
      );
    }

    return this.prisma.techSheet.create({
      data: {
        name: dto.name,
        course_id: dto.course_id,
        ministry_code: dto.ministry_code,
        description: dto.description,
        competencies: dto.competencies,
        kpi_requirements: dto.kpi_requirements,
        context_scenario: dto.context_scenario,
        file_url: dto.file_url,
        uploaded_by: dto.uploaded_by || 'system',
      },
    });
  }

  async update(id: number, dto: UpdateTechSheetDto) {
    await this.findOne(id);
    return this.prisma.techSheet.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.techSheet.delete({ where: { id } });
    return { message: 'Tech sheet deleted successfully' };
  }

  async process(id: number) {
    const sheet = await this.findOne(id);
    return this.prisma.techSheet.update({
      where: { id },
      data: {
        processed: true,
        processed_at: new Date(),
        extracted_data: {
          kpis: sheet.kpi_requirements || [],
          competencies: sheet.competencies || [],
          processed_at: new Date(),
          note: 'Processed manually',
        },
      },
    });
  }

  async analyze(id: number) {
    const sheet = await this.findOne(id);
    if (!sheet.course_id) {
      throw new BadRequestException(
        'Tech sheet must have a course assigned',
      );
    }

    const hasContent = sheet.file_url || sheet.description;
    if (!hasContent) {
      throw new BadRequestException(
        'Tech sheet must have at least one of: attached file, URL, or description',
      );
    }

    // Guard against concurrent pipeline runs
    const activeStatuses = ['step_1', 'step_2', 'step_3', 'step_4', 'step_5', 'step_6', 'step_7', 'step_8'];
    if (sheet.pipeline_status && activeStatuses.includes(sheet.pipeline_status)) {
      throw new BadRequestException('El análisis ya está en progreso');
    }

    // Reset processed flags so re-analysis starts clean
    await (this.prisma as any).techSheet.update({
      where: { id },
      data: { processed: false, processed_at: null },
    });

    // Fire-and-forget: trigger pipeline without awaiting
    this.analysisPipeline.run(id).catch((error) => {
      console.error(`Pipeline failed for tech sheet ${id}:`, error);
    });

    return {
      message: 'Analysis pipeline triggered',
      sheet_id: id,
      status: 'processing',
    };
  }

  async getConfig(id: number) {
    const sheet = await this.findOne(id);
    const extractedData = sheet.extracted_data as Record<string, any> | null;
    const config = extractedData?.analyzed_config;

    if (config) {
      const competencies = this.parseCompetencies(config.competencies);
      const kpis = this.parseKpis(config.kpis);
      const tasks = this.parseQuestions(config.questions);
      // Use saved prompts if the user edited them; otherwise generate defaults
      const savedPrompts = config.prompts || {};
      const prompts = {
        system_prompt:
          savedPrompts.system_prompt || config.simulation_prompt || '',
        evaluation_prompt:
          savedPrompts.evaluation_prompt ||
          config.evaluation_prompt ||
          this.buildEvaluationPrompt(kpis, competencies) ||
          '',
        coaching_prompt:
          savedPrompts.coaching_prompt ||
          config.coaching_prompt ||
          this.buildCoachingPrompt(competencies, kpis) ||
          '',
      };

      // Link tasks to the first KPI so they appear in the UI
      // (AI generates tasks independently, not linked to specific KPIs)
      if (tasks.length > 0 && kpis.length > 0) {
        const firstKpiId = kpis[0].id;
        for (const task of tasks) {
          task.kpi_id = firstKpiId;
        }
        // Also populate evaluation_questions on the first KPI
        kpis[0].evaluation_questions = tasks.map((t) => t.title);
      }

      // Distribute weights by KPI category priority
      if (kpis.length > 0) {
        const categoryWeights: Record<string, number> = {
          evaluacion: 3,
          desempeño: 2,
          asistencia: 1.5,
          participacion: 1,
        };
        let totalUnits = 0;
        for (const kpi of kpis) {
          if (!kpi.weight || kpi.weight === 0) {
            const cat = (kpi.category || '').toLowerCase();
            const unit = categoryWeights[cat] || 1;
            (kpi as any)._weightUnit = unit;
            totalUnits += unit;
          }
        }
        if (totalUnits > 0) {
          for (const kpi of kpis) {
            if ((kpi as any)._weightUnit) {
              kpi.weight =
                Math.round(((kpi as any)._weightUnit / totalUnits) * 1000) /
                10;
              delete (kpi as any)._weightUnit;
            }
          }
        }
      }

      return {
        competencies,
        kpis,
        tasks,
        prompts,
        pipeline_status: sheet.pipeline_status,
      };
    }

    // Return empty skeleton when no config exists yet
    return {
      competencies: [],
      kpis: [],
      tasks: [],
      prompts: {},
      pipeline_status: sheet.pipeline_status,
    };
  }

  private safeParseJson(value: any): any {
    if (!value) return null;
    if (typeof value === 'string') {
      // Strip markdown code fences (```json / ```) that AI responses wrap JSON in
      let cleaned = value.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
      cleaned = cleaned.replace(/\n?\s*```$/, '');
      try {
        return JSON.parse(cleaned);
      } catch {
        return null;
      }
    }
    return value;
  }

  private uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private parseCompetencies(raw: any): any[] {
    const parsed = this.safeParseJson(raw);
    if (!parsed) return [];

    // Handle { competencias: [...] } wrapper
    const items = Array.isArray(parsed) ? parsed : parsed.competencias || parsed.competencies || [];
    if (!Array.isArray(items)) return [];

    return items.map((c: any) => ({
      id: this.uuid(),
      name: c.nombre || c.name || '',
      description: c.descripcion || c.description || '',
      level: this.mapLevel(c.nivel || c.level),
    }));
  }

  private mapLevel(raw: string): 'basic' | 'intermediate' | 'advanced' {
    const map: Record<string, 'basic' | 'intermediate' | 'advanced'> = {
      basico: 'basic',
      basica: 'basic',
      intermedio: 'intermediate',
      intermedia: 'intermediate',
      avanzado: 'advanced',
      avanzada: 'advanced',
      basic: 'basic',
      intermediate: 'intermediate',
      advanced: 'advanced',
    };
    return map[String(raw).toLowerCase()] || 'basic';
  }

  private parseKpis(raw: any): any[] {
    const parsed = this.safeParseJson(raw);
    if (!parsed) return [];

    const items = Array.isArray(parsed) ? parsed : parsed.kpis || [];
    if (!Array.isArray(items)) return [];

    return items.map((k: any) => ({
      id: this.uuid(),
      name: k.nombre || k.name || '',
      description: k.descripcion || k.description || '',
      category: k.categoria || k.category || 'desempeño',
      weight: this.toNumber(k.weight || k.peso),
      target_value: this.toNumber(k.valor_objetivo || k.target_value),
      minimum_pass_value: this.extractPercentage(k.criterio_aprobacion) || this.toNumber(k.minimum_pass_value),
      competencies_required: Array.isArray(k.competencias_required) ? k.competencias_required : [],
      evaluation_questions: Array.isArray(k.evaluation_questions) ? k.evaluation_questions : [],
    }));
  }

  private extractPercentage(text: string): number {
    if (!text) return 0;
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (match) return parseFloat(match[1].replace(',', '.'));
    return 0;
  }

  private toNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Extract first number from strings like "80%", "6 puntos", "120 horas cátedra", "18 años"
    const str = String(val);
    const match = str.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return 0;
  }

  private parseQuestions(raw: any): any[] {
    const parsed = this.safeParseJson(raw);
    if (!parsed) return [];

    // Handle { preguntas: [...] } wrapper
    const items = Array.isArray(parsed) ? parsed : parsed.preguntas || parsed.questions || [];
    if (!Array.isArray(items)) return [];

    return items.map((q: any, i: number) => ({
      id: this.uuid(),
      kpi_id: '',
      type: this.mapTaskType(q.tipo || q.type),
      title: q.texto || q.text || q.titulo || '',
      description: q.descripcion || q.description || '',
      difficulty: this.mapDifficulty(q.dificultad || q.difficulty),
      sequence: i + 1,
      expected_duration_minutes: 0,
    }));
  }

  private mapTaskType(raw: string): 'practice' | 'evaluation' {
    const map: Record<string, 'practice' | 'evaluation'> = {
      multiple_choice: 'evaluation',
      verdadero_falso: 'evaluation',
      abierta: 'practice',
      practice: 'practice',
      evaluation: 'evaluation',
    };
    return map[String(raw).toLowerCase()] || 'evaluation';
  }

  private mapDifficulty(raw: string): 'easy' | 'medium' | 'hard' {
    const map: Record<string, 'easy' | 'medium' | 'hard'> = {
      basica: 'easy',
      basico: 'easy',
      easy: 'easy',
      intermedia: 'medium',
      intermedio: 'medium',
      medium: 'medium',
      avanzada: 'hard',
      avanzado: 'hard',
      hard: 'hard',
    };
    return map[String(raw).toLowerCase()] || 'easy';
  }

  /**
   * Build a default evaluation prompt from parsed KPIs and competencies.
   * Used as fallback when the user hasn't saved their own evaluation prompt yet.
   */
  private buildEvaluationPrompt(kpis: any[], competencies: any[]): string {
    if (!kpis.length && !competencies.length) return '';

    const criteria = kpis
      .map(
        (k) =>
          `- ${k.name}: objetivo ${k.target_value}%, mínimo ${k.minimum_pass_value}%`,
      )
      .filter(Boolean)
      .join('\n');

    const compNames = competencies
      .map((c) => `- ${c.name} (${c.level})`)
      .filter(Boolean)
      .join('\n');

    return [
      'Evalúa el desempeño del estudiante según los siguientes criterios:',
      '',
      compNames ? 'Competencias a evaluar:' : '',
      compNames || '',
      '',
      criteria ? 'Indicadores de rendimiento (KPIs):' : '',
      criteria,
      '',
      'Para cada interacción del estudiante, determina:',
      '- ¿Aplicó correctamente la competencia? (Sí/No/parcialmente)',
      '- ¿Cumple con el valor mínimo del KPI? (Sí/No)',
      '- Justificación breve de la evaluación.',
      'Responde en español, en formato estructurado.',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  /**
   * Build a default coaching prompt from parsed competencies and KPIs.
   * Used as fallback when the user hasn't saved their own coaching prompt yet.
   */
  private buildCoachingPrompt(
    competencies: any[],
    kpis: any[],
  ): string {
    if (!competencies.length && !kpis.length) return '';

    const compNames = competencies
      .map((c) => `- ${c.name} (${c.level})`)
      .filter(Boolean)
      .join('\n');

    const kpiNames = kpis
      .map((k) => `- ${k.name}`)
      .filter(Boolean)
      .join('\n');

    return [
      'Actúa como coach del estudiante. Tu rol es guiar, no dar respuestas directas.',
      '',
      compNames ? 'Competencias que el estudiante debe desarrollar:' : '',
      compNames || '',
      '',
      kpiNames ? 'Indicadores que el estudiante debe alcanzar:' : '',
      kpiNames || '',
      '',
      'Reglas de coaching:',
      '- Da pistas, no soluciones completas.',
      '- Haz preguntas que lleven al estudiante a reflexionar.',
      '- Reconoce aciertos antes de señalar errores.',
      '- Si el estudiante se bloquea, ofrece un ejemplo relacionado.',
      '- Mantén un tono alentador y constructivo.',
      'Responde en español.',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  async updateConfig(id: number, dto: UpdateTechSheetConfigDto) {
    const sheet = await this.findOne(id);
    const extractedData = (sheet.extracted_data as Record<string, any>) || {};

    // Merge config into extracted_data.analyzed_config, preserving other keys
    const mergedConfig = {
      ...extractedData.analyzed_config,
      ...(dto.competencies !== undefined && { competencies: dto.competencies }),
      ...(dto.kpis !== undefined && { kpis: dto.kpis }),
      ...(dto.tasks !== undefined && { tasks: dto.tasks }),
      ...(dto.prompts !== undefined && { prompts: dto.prompts }),
    };

    const updatedExtractedData = {
      ...extractedData,
      analyzed_config: mergedConfig,
    };

    return (this.prisma as any).techSheet.update({
      where: { id },
      data: { extracted_data: updatedExtractedData },
    });
  }
}

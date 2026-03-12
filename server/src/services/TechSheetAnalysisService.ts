import { AppDataSource } from '../database/connection';
import { TechSheet } from '../entities/TechSheet';
import { CourseConfig } from '../entities/CourseConfig';
import { Task } from '../entities/Task';
import { v4 as uuidv4 } from 'uuid';

export interface Competency {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

export interface KPIConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  target_value: number;
  minimum_pass_value: number;
  competencies_required: string[];
  evaluation_questions: string[];
}

export interface TaskConfig {
  id: string;
  kpi_id: string;
  type: 'practice' | 'evaluation';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sequence: number;
  expected_duration_minutes: number;
}

export interface AnalyzedKPIsConfig {
  tech_sheet_id: number;
  analyzed_at: Date;
  competencies: Competency[];
  kpis: KPIConfig[];
  tasks: TaskConfig[];
  prompts: {
    system_prompt: string;
    evaluation_prompt: string;
    coaching_prompt: string;
  };
}

export class TechSheetAnalysisService {
  /**
   * Analiza una ficha técnica y guarda la configuración en course_config
   * Crea automáticamente tareas para cada KPI
   */
  async analyzeAndSave(
    sheet: TechSheet,
    courseId: string
  ): Promise<AnalyzedKPIsConfig> {
    // 1. Extraer competencias de la descripción
    const competencies = this.extractCompetencies(
      sheet.description || '',
      sheet.extracted_data?.competencies || []
    );

    // 2. Extraer KPIs de los requisitos
    const kpiRequirements = sheet.extracted_data?.kpi_requirements || [];
    const kpis = this.extractKPIs(kpiRequirements, competencies);

    // 3. Crear tareas para cada KPI
    const tasks = await this.createTasksForKPIs(
      courseId,
      kpis,
      sheet.name
    );

    // 4. Crear la configuración analizada
    const analyzedConfig: AnalyzedKPIsConfig = {
      tech_sheet_id: sheet.id,
      analyzed_at: new Date(),
      competencies,
      kpis: kpis.map((kpi) => ({
        ...kpi,
        related_tasks: tasks
          .filter((t) => t.kpi_id === kpi.id)
          .map((t) => t.id),
      })) as KPIConfig[],
      tasks,
      prompts: {
        system_prompt: this.generateSystemPrompt(sheet, kpis),
        evaluation_prompt: this.generateEvaluationPrompt(kpis),
        coaching_prompt: this.generateCoachingPrompt(sheet),
      },
    };

    // 5. Guardar en course_config.metadata usando SQL raw
    try {
      const existingConfig = await AppDataSource.query(
        `SELECT id FROM course_config WHERE course_id = ?`,
        [courseId]
      );

      const metadata = JSON.stringify({
        analyzed_kpis_config: analyzedConfig
      });

      if (existingConfig.length > 0) {
        // Actualizar
        const configId = existingConfig[0].id;
        await AppDataSource.query(
          `UPDATE course_config SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.analyzed_kpis_config', CAST(? AS JSON)) WHERE id = ?`,
          [JSON.stringify(analyzedConfig), configId]
        );
        console.log(`✅ Metadata guardada para config ${configId}`);
      } else {
        // Insertar nuevo
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await AppDataSource.query(
          `INSERT INTO course_config (id, course_id, config_data, metadata, prompt_generation_mode, tech_sheet_id, created_at, updated_at) 
           VALUES (?, ?, ?, ?, 'template', ?, ?, ?)`,
          [
            id, 
            courseId, 
            JSON.stringify({}), 
            JSON.stringify({ analyzed_kpis_config: analyzedConfig }),
            sheet.id,
            now,
            now
          ]
        );
        console.log(`✅ Nueva config creada: ${id}`);
      }

    } catch (err: any) {
      console.warn('⚠️ Failed to persist config:', err.message);
      // Continuar sin persistir para ahora (para testing)
    }

    return analyzedConfig;
  }

  /**
   * Extrae competencias del texto de la ficha técnica
   */
  private extractCompetencies(
    description: string,
    aiExtracted: any[]
  ): Competency[] {
    const competencies: Competency[] = [];

    // Usar lo que extrajo la IA
    if (Array.isArray(aiExtracted) && aiExtracted.length > 0) {
      aiExtracted.forEach((comp: any, idx: number) => {
        competencies.push({
          id: `comp-${idx + 1}`,
          name: typeof comp === 'string' ? comp : (comp?.name || `Competencia ${idx + 1}`),
          description: typeof comp === 'string' ? `Competencia extraída: ${comp}` : (comp?.description || ''),
          level: 'intermediate',
        });
      });
    } else {
      // Fallback: palabras clave de competencias
      const keywords = ['gestión', 'análisis', 'comunicación', 'liderazgo', 'resolución', 'toma de decisiones'];
      keywords.forEach((kw, idx) => {
        if (description.toLowerCase().includes(kw)) {
          competencies.push({
            id: `comp-${idx + 1}`,
            name: kw.charAt(0).toUpperCase() + kw.slice(1),
            description: `Capacidad de ${kw.toLowerCase()}`,
            level: 'intermediate',
          });
        }
      });
    }

    return competencies.length > 0 ? competencies : [
      {
        id: 'comp-1',
        name: 'Competencia General',
        description: 'Competencia genérica extraída de la ficha técnica',
        level: 'intermediate',
      },
    ];
  }

  /**
   * Extrae KPIs de los requisitos ministeriales
   */
  private extractKPIs(
    kpiRequirements: any[],
    competencies: Competency[]
  ): KPIConfig[] {
    if (!Array.isArray(kpiRequirements) || kpiRequirements.length === 0) {
      return [
        {
          id: 'kpi-1',
          name: 'Desempeño General',
          description: 'KPI general para evaluar el desempeño',
          category: 'performance',
          weight: 100,
          target_value: 95,
          minimum_pass_value: 70,
          competencies_required: competencies.slice(0, 1).map((c) => c.id),
          evaluation_questions: [
            '¿Logró completar la tarea de forma correcta?',
            '¿Cumplió con el tiempo estimado?',
          ],
        },
      ];
    }

    return kpiRequirements.map((kpi: any, idx: number) => ({
      id: `kpi-${idx + 1}`,
      name: typeof kpi === 'string' ? kpi : (kpi?.name || `KPI ${idx + 1}`),
      description: typeof kpi === 'string' ? `Criterio: ${kpi}` : (kpi?.description || ''),
      category:
        typeof kpi === 'string'
          ? 'performance'
          : (kpi?.category || 'performance'),
      weight: 100 / kpiRequirements.length,
      target_value: 95,
      minimum_pass_value: 70,
      competencies_required: competencies
        .slice(0, Math.max(1, Math.floor(competencies.length / 2)))
        .map((c) => c.id),
      evaluation_questions: [
        `¿Logró alcanzar el KPI: "${
          typeof kpi === 'string' ? kpi : (kpi?.name || '')
        }"?`,
        `¿Cuál fue el nivel de logro en este criterio?`,
      ],
    }));
  }

  /**
   * Crea tareas automáticamente para cada KPI
   */
  private async createTasksForKPIs(
    courseId: string,
    kpis: KPIConfig[],
    techSheetName: string
  ): Promise<TaskConfig[]> {
    const tasks: TaskConfig[] = [];
    const taskRepo = AppDataSource.getRepository(Task);

    for (const kpi of kpis) {
      // Crear 2 tareas práctica + 1 evaluación por KPI
      const difficulties = ['easy', 'medium'] as const;

      for (let i = 0; i < difficulties.length; i++) {
        const taskConfig: TaskConfig = {
          id: `task-${kpi.id}-practice-${i + 1}`,
          kpi_id: kpi.id,
          type: 'practice',
          title: `${kpi.name} - Práctica ${i + 1}`,
          description: `Practica el siguiente KPI: ${kpi.name}\n\nDescripción: ${kpi.description}\n\nObjetivo: Alcanzar al menos ${kpi.minimum_pass_value}% de desempeño.`,
          difficulty: difficulties[i],
          sequence: i + 1,
          expected_duration_minutes: 15 * (i + 1),
        };

        tasks.push(taskConfig);

        // Crear registro en BD si lo necesitamos
        // Aquí podríamos crear registros Task reales en la BD
      }

      // Tarea de evaluación
      const evalTask: TaskConfig = {
        id: `task-${kpi.id}-evaluation`,
        kpi_id: kpi.id,
        type: 'evaluation',
        title: `${kpi.name} - Evaluación Final`,
        description: `Evaluación del KPI: ${kpi.name}\n\nDebes alcanzar al menos ${kpi.target_value}% para pasar.\n\nBuena suerte!`,
        difficulty: 'hard',
        sequence: difficulties.length + 1,
        expected_duration_minutes: 20,
      };

      tasks.push(evalTask);
    }

    return tasks;
  }

  /**
   * Genera el system prompt para la IA
   */
  private generateSystemPrompt(sheet: TechSheet, kpis: KPIConfig[]): string {
    const kpisList = kpis
      .map((k) => `- ${k.name}: ${k.description}`)
      .join('\n');

    return `Eres un asistente educativo profesional especializado en simulaciones de situaciones laborales reales.

Tu rol es ayudar al estudiante a alcanzar estos KPIs (indicadores de desempeño):
${kpisList}

Instrucciones:
1. Evalúa cada respuesta del estudiante contra los KPIs
2. Si comete un error, explica educadamente sin ser condescendiente
3. Proporciona coaching para mejorar
4. Registra el progreso hacia cada KPI
5. Sé motivador pero exigente

Context de la simulación: ${sheet.description || 'N/A'}`;
  }

  /**
   * Genera el evaluation prompt
   */
  private generateEvaluationPrompt(kpis: KPIConfig[]): string {
    const criteria = kpis
      .map(
        (k) =>
          `- ${k.name} (mínimo ${k.minimum_pass_value}%, objetivo ${k.target_value}%)`
      )
      .join('\n');

    return `Evalúa al estudiante contra estos criterios:

${criteria}

Para cada criterio:
1. Asigna un porcentaje de logro (0-100%)
2. Proporciona feedback específico
3. Sugiere mejoras

Formato de respuesta JSON:
{
  "kpi_evaluations": [
    { "kpi_name": "...", "score": 85, "feedback": "..." }
  ],
  "overall_score": 87,
  "strengths": [...],
  "areas_to_improve": [...]
}`;
  }

  /**
   * Genera el coaching prompt
   */
  private generateCoachingPrompt(sheet: TechSheet): string {
    return `Si el estudiante no logra alcanzar los objetivos, proporciona coaching específico:

1. Identifica la raíz del problema
2. Proporciona 2-3 tips prácticos
3. Sugiere que intente de nuevo
4. Sé empático pero directo
5. Usa ejemplos del contexto: ${sheet.description || 'la simulación'}

Ejemplo de estructura:
"Veo que tuviste dificultad con [X]. Aquí está el problema: [explicación]. 
Intenta esto: [tip 1], [tip 2]. ¿Quieres intentar de nuevo?"`;
  }

  /**
   * Obtiene la configuración analizada de un course_config
   */
  async getAnalyzedConfig(courseId: string): Promise<AnalyzedKPIsConfig | null> {
    try {
      const result = await AppDataSource.query(
        `SELECT metadata FROM course_config WHERE course_id = ?`,
        [courseId]
      );

      if (!result || result.length === 0) {
        console.log(`❌ No config found for course ${courseId}`);
        return null;
      }

      const metadata = result[0].metadata;
      if (!metadata) {
        console.log(`❌ No metadata in config for course ${courseId}`);
        return null;
      }

      const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      return metadataObj.analyzed_kpis_config || null;
    } catch (err: any) {
      console.error('Error getting analyzed config:', err.message);
      return null;
    }
  }

  /**
   * Actualiza la configuración analizada
   */
  async updateAnalyzedConfig(
    courseId: string,
    updates: Partial<AnalyzedKPIsConfig>
  ): Promise<AnalyzedKPIsConfig> {
    try {
      // Primero obtener la configuración actual
      const current = await this.getAnalyzedConfig(courseId);
      if (!current) {
        throw new Error('CourseConfig not found');
      }

      // Fusionar con los updates
      const updated: AnalyzedKPIsConfig = {
        ...current,
        ...updates,
        analyzed_at: current.analyzed_at || new Date(),
      };

      // Usar SQL raw para actualizar
      const configQuery = await AppDataSource.query(
        `SELECT id FROM course_config WHERE course_id = ?`,
        [courseId]
      );

      if (configQuery.length === 0) {
        throw new Error('CourseConfig not found');
      }

      const configId = configQuery[0].id;
      await AppDataSource.query(
        `UPDATE course_config SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.analyzed_kpis_config', CAST(? AS JSON)) WHERE id = ?`,
        [JSON.stringify(updated), configId]
      );

      console.log(`✅ Config actualizada para ${configId}`);
      return updated;
    } catch (err: any) {
      console.error('Error updating analyzed config:', err.message);
      throw err;
    }
  }
}

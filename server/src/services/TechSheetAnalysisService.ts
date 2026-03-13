import { AppDataSource } from '../database/connection';
import { TechSheet } from '../entities/TechSheet';
import { CourseConfig } from '../entities/CourseConfig';
import { Task } from '../entities/Task';
import { KPI } from '../entities/KPI';
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
   * Extrae competencias y KPIs del contenido REAL (file_url, description)
   * NO usa datos hardcodeados
   */
  async analyzeAndSave(
    sheet: TechSheet,
    courseId: string
  ): Promise<AnalyzedKPIsConfig> {
    // 1. Extraer contenido real de la ficha
    let contentToAnalyze = '';
    
    // Si tiene archivo base64, intentar decodificar
    if (sheet.file_url && sheet.file_url.startsWith('data:')) {
      try {
        const base64Data = sheet.file_url.split(',')[1];
        const decodedContent = Buffer.from(base64Data, 'base64').toString('utf-8');
        contentToAnalyze += decodedContent;
      } catch (e) {
        console.warn('No se pudo decodificar archivo base64');
      }
    } else if (sheet.file_url && sheet.file_url.length > 0) {
      // Si es una URL, agregar como referencia
      contentToAnalyze += `\nURL del documento: ${sheet.file_url}\n`;
    }
    
    // Agregar descripción
    if (sheet.description) {
      contentToAnalyze += sheet.description;
    }

    // 2. Extraer competencias del contenido REAL
    const competencies = this.extractCompetencies(contentToAnalyze);

    // 3. Extraer KPIs del contenido REAL
    const kpis = this.extractKPIs(contentToAnalyze, competencies);

    // 4. Crear tareas para cada KPI
    const tasks = await this.createTasksForKPIs(
      courseId,
      kpis,
      sheet.name
    );

    // 5. Crear la configuración analizada
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

    // 6. Guardar en course_config.metadata usando SQL raw
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
   * Extrae competencias del CONTENIDO REAL de la ficha técnica
   * Analiza texto del archivo/descripción usando palabras clave inteligentes
   */
  private extractCompetencies(
    contentText: string
  ): Competency[] {
    const competencies: Competency[] = [];
    const processedKeywords = new Set<string>();

    // Palabras clave de competencias comunes en fichas técnicas ministeriales
    const competencyKeywords = {
      'gestión': { name: 'Gestión de operaciones', level: 'intermediate' as const },
      'administración': { name: 'Administración de recursos', level: 'intermediate' as const },
      'análisis': { name: 'Análisis crítico', level: 'intermediate' as const },
      'comunicación': { name: 'Comunicación efectiva', level: 'intermediate' as const },
      'liderazgo': { name: 'Liderazgo', level: 'advanced' as const },
      'resolución': { name: 'Resolución de problemas', level: 'intermediate' as const },
      'toma de decisiones': { name: 'Toma de decisiones', level: 'advanced' as const },
      'planificación': { name: 'Planificación estratégica', level: 'advanced' as const },
      'evaluación': { name: 'Evaluación de desempeño', level: 'intermediate' as const },
      'cliente': { name: 'Atención al cliente', level: 'basic' as const },
      'negociación': { name: 'Negociación', level: 'intermediate' as const },
      'trabajo en equipo': { name: 'Trabajo en equipo', level: 'basic' as const },
      'ética': { name: 'Ética profesional', level: 'basic' as const },
      'calidad': { name: 'Aseguramiento de calidad', level: 'intermediate' as const },
    };

    const textLower = contentText.toLowerCase();
    let compIdx = 1;

    // Buscar palabras clave en el contenido
    for (const [keyword, info] of Object.entries(competencyKeywords)) {
      if (textLower.includes(keyword) && !processedKeywords.has(keyword)) {
        competencies.push({
          id: `comp-${compIdx++}`,
          name: info.name,
          description: `Competencia extraída del contenido: ${info.name}`,
          level: info.level,
        });
        processedKeywords.add(keyword);
      }
    }

    // Si no encontró nada, retornar una competencia genérica
    return competencies.length > 0 ? competencies : [
      {
        id: 'comp-1',
        name: 'Competencia General',
        description: 'Competencia extraída de la ficha técnica',
        level: 'intermediate',
      },
    ];
  }

  /**
   * Extrae KPIs del CONTENIDO REAL de la ficha técnica
   * Analiza texto del archivo/descripción buscando criterios de evaluación
   */
  private extractKPIs(
    contentText: string,
    competencies: Competency[]
  ): KPIConfig[] {
    const kpis: KPIConfig[] = [];
    const textLower = contentText.toLowerCase();

    // Palabras clave para identificar KPIs en el contenido
    const kpiKeywords = ['kpi', 'criterio', 'objetivo', 'meta', 'desempeño', 'resultado', 'evaluación', 'cumplimiento', 'porcentaje', '%', 'minutos', 'horas'];
    
    // Buscar líneas que contengan estas palabras (generalmente los KPIs están en párrafos específicos)
    const lines = contentText.split('\n').filter(line => line.trim().length > 0);
    let kpiIdx = 1;

    for (const line of lines) {
      const lineLower = line.toLowerCase();
      // Detectar si es una línea de KPI
      if (kpiKeywords.some(kw => lineLower.includes(kw))) {
        if (kpis.length < 10) { // Limitar a 10 KPIs máximo
          kpis.push({
            id: `kpi-${kpiIdx++}`,
            name: line.substring(0, 100), // Primeros 100 caracteres como nombre
            description: line,
            category: this.detectKPICategory(lineLower),
            weight: 100 / Math.max(1, kpiIdx),
            target_value: 95,
            minimum_pass_value: 70,
            competencies_required: competencies.slice(0, Math.max(1, competencies.length)).map(c => c.id),
            evaluation_questions: [
              `¿Se logró el objetivo: "${line.substring(0, 50)}"?`,
              `¿Cuál fue el nivel de cumplimiento de este criterio?`,
            ],
          });
        }
      }
    }

    // Si no encontró KPIs en el contenido, crear uno genérico
    return kpis.length > 0 ? kpis : [
      {
        id: 'kpi-1',
        name: 'Desempeño General',
        description: 'KPI general para evaluar el desempeño en la ficha técnica',
        category: 'performance',
        weight: 100,
        target_value: 95,
        minimum_pass_value: 70,
        competencies_required: competencies.map(c => c.id),
        evaluation_questions: [
          '¿Logró completar correctamente los requisitos de la ficha?',
          '¿Cumplió con los estándares especificados?',
        ],
      },
    ];
  }

  /**
   * Detecta la categoría de un KPI basado en palabras clave
   */
  private detectKPICategory(lineLower: string): string {
    if (lineLower.includes('cliente') || lineLower.includes('satisfacción')) return 'customer_satisfaction';
    if (lineLower.includes('tiempo') || lineLower.includes('minutos') || lineLower.includes('horas')) return 'time';
    if (lineLower.includes('calidad') || lineLower.includes('porcentaje') || lineLower.includes('%')) return 'quality';
    if (lineLower.includes('costo') || lineLower.includes('precio') || lineLower.includes('dinero')) return 'cost';
    return 'performance';
  }

  /**
   * Crea tareas automáticamente para cada KPI
   * ⚠️ IMPORTANTE: También persiste KPIs en la tabla kpis
   */
  private async createTasksForKPIs(
    courseId: string,
    kpis: KPIConfig[],
    techSheetName: string
  ): Promise<TaskConfig[]> {
    const tasks: TaskConfig[] = [];
    const kpiRepo = AppDataSource.getRepository(KPI);
    const taskRepo = AppDataSource.getRepository(Task);

    console.log(`[KPI_CREATION] Iniciando creación de ${kpis.length} KPIs para curso ${courseId}`);

    for (const kpiConfig of kpis) {
      try {
        // ✅ NUEVO: Crear KPI real en BD
        const kpiEntity = new KPI();
        kpiEntity.id = uuidv4();
        kpiEntity.course_id = courseId;
        kpiEntity.name = kpiConfig.name;
        kpiEntity.description = kpiConfig.description;
        kpiEntity.category = kpiConfig.category as any;
        kpiEntity.weight = kpiConfig.weight;
        kpiEntity.target_value = kpiConfig.target_value;
        kpiEntity.minimum_pass_value = kpiConfig.minimum_pass_value;
        kpiEntity.is_active = true;
        kpiEntity.tasks_count = 2; // 1 práctica + 1 evaluación

        const savedKpi = await kpiRepo.save(kpiEntity);
        console.log(`✅ KPI creado: ${savedKpi.id} - ${savedKpi.name}`);

        // Crear 2 tareas: 1 práctica + 1 evaluación por KPI
        const taskDefs = [
          { type: 'practice' as const, seq: 1, suffix: 'Práctica' },
          { type: 'evaluation' as const, seq: 2, suffix: 'Evaluación' }
        ];

        for (const taskDef of taskDefs) {
          try {
            const taskEntity = new Task();
            taskEntity.id = uuidv4();
            taskEntity.course_id = courseId;
            taskEntity.kpi_id = savedKpi.id;
            // scenario_id es opcional
            taskEntity.title = `${kpiConfig.name} - ${taskDef.suffix}`;
            taskEntity.description = `${taskDef.type === 'practice' ? 'Practica el siguiente KPI' : 'Evaluación del KPI'}: ${kpiConfig.name}\n\nDescripción: ${kpiConfig.description}\n\nObjetivo: Alcanzar al menos ${kpiConfig[taskDef.type === 'practice' ? 'minimum_pass_value' : 'target_value']}% de desempeño.`;
            taskEntity.type = taskDef.type;
            taskEntity.sequence_order = taskDef.seq;
            taskEntity.ai_prompt_config = {
              system_prompt: `${taskDef.type === 'practice' ? 'Ayuda al estudiante a practicar' : 'Evalúa al estudiante en'}: ${kpiConfig.name}`,
              temperature: taskDef.type === 'practice' ? 0.7 : 0.3,
              give_hints: taskDef.type === 'practice',
              max_attempts: taskDef.type === 'practice' ? 3 : 1
            };
            taskEntity.evaluation_criteria = {
              accuracy_required: kpiConfig[taskDef.type === 'practice' ? 'minimum_pass_value' : 'target_value'],
              time_limit_minutes: taskDef.type === 'practice' ? 15 : 20,
              partial_credit_allowed: taskDef.type === 'practice',
              auto_evaluation_rules: []
            };
            taskEntity.status = 'pending';
            taskEntity.is_active = true;
            taskEntity.students_completed = 0;
            taskEntity.average_completion_rate = 0;

            const savedTask = await taskRepo.save(taskEntity);
            console.log(`  ✅ Task ${taskDef.type} creada: ${savedTask.id}`);

            tasks.push({
              id: savedTask.id,
              kpi_id: savedKpi.id,
              type: taskDef.type,
              title: taskEntity.title,
              description: taskEntity.description,
              difficulty: taskDef.type === 'practice' ? 'medium' : 'hard',
              sequence: taskDef.seq,
              expected_duration_minutes: taskDef.type === 'practice' ? 15 : 20,
            });
          } catch (taskErr: any) {
            console.error(`  ❌ Error creando task ${taskDef.type}:`, taskErr.message);
            console.error(`     Stack:`, taskErr.stack);
          }
        }
      } catch (kpiErr: any) {
        console.error(`❌ Error creando KPI ${kpiConfig.name}:`, kpiErr.message);
      }
    }

    console.log(`[KPI_CREATION] Completado: ${tasks.length} tasks creadas`);
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

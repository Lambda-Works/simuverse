import { AppDataSource } from '../database/connection';
import { CourseConfig } from '../entities/CourseConfig';
import { PromptTemplate } from '../entities/PromptTemplate';
import { KPI } from '../entities/KPI';
import { Task } from '../entities/Task';
import { In } from 'typeorm';

export class PromptGenerationService {
  
  /**
   * Asignar plantilla a curso
   */
  async assignTemplateToConfig(courseId: string, templateId: number): Promise<CourseConfig> {
    const config = await AppDataSource.manager.findOne(CourseConfig, {
      where: { course_id: courseId }
    });

    if (!config) throw new Error('CourseConfig not found');

    const template = await AppDataSource.manager.findOne(PromptTemplate, {
      where: { id: templateId }
    });

    if (!template) throw new Error('Template not found');

    config.prompt_template_id = templateId;
    config.prompt_generation_mode = 'template';
    config.prompt_generated_at = new Date();

    // Actualizar configuración del curso con datos de la plantilla
    // Nota: estos campos pueden ya estar en course_config o agregarse según necesidad
    if (!config.metadata) config.metadata = {};
    config.metadata.base_role = template.base_role;
    config.metadata.course_context = template.course_context;
    config.metadata.personality_traits = template.personality_traits;
    config.metadata.knowledge_base_prompt = template.knowledge_base_prompt;

    return AppDataSource.manager.save(config);
  }

  /**
   * Generar prompt con IA basado en ficha técnica
   */
  async generatePromptWithAI(
    courseId: string,
    selectedKPIIds: string[],
    selectedTaskIds: string[],
    aiRole: string,
    situations: string
  ): Promise<any> {
    // 1. Obtener KPIs seleccionados
    const kpis = await AppDataSource.manager.find(KPI, {
      where: { id: In(selectedKPIIds) }
    });

    // 2. Obtener tareas seleccionadas
    const tasks = await AppDataSource.manager.find(Task, {
      where: { id: In(selectedTaskIds) }
    });

    // 3. Construir prompt para Claude/Gemini
    const generationPrompt = this.buildGenerationPrompt(
      kpis,
      tasks,
      aiRole,
      situations
    );

    // 4. Llamar a IA (implementar con Claude/Gemini)
    const generatedPrompt = await this.callAI(generationPrompt);

    return generatedPrompt;
  }

  /**
   * Guardar prompt (manual, template, o generado con IA)
   */
  async savePrompt(
    courseId: string,
    promptData: {
      base_role?: string;
      course_context?: string;
      personality_traits?: string[];
      knowledge_base_prompt?: string;
      tech_sheet_id?: number;
      template_id?: number;
      generation_mode: 'template' | 'manual' | 'guided';
      generated_by?: string;
    }
  ): Promise<CourseConfig> {
    const config = await AppDataSource.manager.findOne(CourseConfig, {
      where: { course_id: courseId }
    });

    if (!config) throw new Error('CourseConfig not found');

    // Si tiene datos de prompt, guardarlos en metadata
    if (!config.metadata) config.metadata = {};
    
    if (promptData.base_role) config.metadata.base_role = promptData.base_role;
    if (promptData.course_context) config.metadata.course_context = promptData.course_context;
    if (promptData.personality_traits) config.metadata.personality_traits = promptData.personality_traits;
    if (promptData.knowledge_base_prompt) config.metadata.knowledge_base_prompt = promptData.knowledge_base_prompt;

    config.tech_sheet_id = promptData.tech_sheet_id;
    config.prompt_template_id = promptData.template_id;
    config.prompt_generation_mode = promptData.generation_mode;
    config.prompt_generated_by = promptData.generated_by;
    config.prompt_generated_at = new Date();

    return AppDataSource.manager.save(config);
  }

  /**
   * Obtener configuración actual de prompt para un curso
   */
  async getPromptConfig(courseId: string): Promise<CourseConfig | null> {
    return AppDataSource.manager.findOne(CourseConfig, {
      where: { course_id: courseId },
      relations: ['prompt_template', 'tech_sheet']
    });
  }

  private buildGenerationPrompt(kpis: KPI[], tasks: Task[], aiRole: string, situations: string): string {
    const kpiList = kpis.map(k => `${k.name} (Objetivo: ${k.target_value || '?'}%, Mínimo: ${k.minimum_pass_value || '?'}%)`).join('\n  - ');
    const taskList = tasks.map(t => `${t.title}`).join('\n  - ');

    return `
Eres un experto en diseño de simulaciones educativas.

Basándote en la siguiente información, genera un JSON con instrucciones para la IA que simule situaciones educativas.

CONTEXTO EDUCATIVO:
- KPIs a evaluar:
  - ${kpiList}
  
- Tareas que debe practicar el alumno:
  - ${taskList}

- Rol que toma la IA en la simulación: ${aiRole}

- Situaciones que presenta: ${situations}

INSTRUCCIONES DE LA IA:
Por favor, genera un JSON con esta estructura exacta:
{
  "base_role": "Una descripción del papel que asume la IA (2-3 oraciones claras)",
  "course_context": "El contexto/rol del alumno en esta simulación (2-3 oraciones)",
  "personality_traits": ["trait1", "trait2", "trait3"],
  "knowledge_base_prompt": "Instrucciones detalladas para que la IA se comporte de forma coherente y evalue los KPIs especificados. Debe incluir cómo responder a acciones del alumno, qué evaluar, y cuándo cambiar de tácticas."
}

ASEGÚRATE QUE:
1. El rol sea consistente con la descripción
2. Las instrucciones de IA evalúen ESPECÍFICAMENTE los KPIs mencionados
3. Las situaciones requieran que el alumno practique las tareas listadas
4. El prompt sea profesional pero accesible
5. La evaluación sea clara y medible
`;
  }

  private async callAI(prompt: string): Promise<any> {
    // TODO: Implementar llamada a Claude/Gemini API
    // Por ahora, retornar placeholder para testing
    console.log('Prompt enviado a IA (TODO: implementar API real)');
    
    return {
      base_role: "Rol generado por IA - Implementar API de Claude/Gemini",
      course_context: "Contexto generado automáticamente",
      personality_traits: ["trait1", "trait2"],
      knowledge_base_prompt: "Instrucciones generadas por IA basadas en KPIs y tareas especificadas"
    };
  }
}

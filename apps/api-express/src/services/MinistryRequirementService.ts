import { AppDataSource } from '../database/connection';
import { MinistryRequirement, RequirementStatus } from '../entities/MinistryRequirement';
import { KPI } from '../entities/KPI';
import { Task } from '../entities/Task';
import { Repository } from 'typeorm';
import { kpiService } from './KPIService';
import { taskService } from './TaskService';
import * as fs from 'fs';

/**
 * Servicio para gestionar requisitos ministeriales
 * - Guardar archivos (PDF, DOCX, XLS, PNG)
 * - Extraer contenido
 * - Generar KPIs automáticamente
 * - Crear tareas de práctica y evaluación
 */
export class MinistryRequirementService {
  private minReqRepository: Repository<MinistryRequirement>;
  private kpiRepository: Repository<KPI>;
  private taskRepository: Repository<Task>;

  constructor() {
    this.minReqRepository = AppDataSource.getRepository(MinistryRequirement);
    this.kpiRepository = AppDataSource.getRepository(KPI);
    this.taskRepository = AppDataSource.getRepository(Task);
  }

  /**
   * Crear un requisito ministerial (cuando se sube un archivo)
   */
  async createRequirement(data: {
    course_id: string;
    uploaded_by_id: string;
    file_name: string;
    file_type: 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg' | 'txt';
    file_size_bytes: number;
    file_path: string;
    raw_text?: string;
  }): Promise<MinistryRequirement> {
    const requirement = this.minReqRepository.create({
      ...data,
      status: 'uploaded' as RequirementStatus
    });
    return await this.minReqRepository.save(requirement);
  }

  /**
   * Procesar requisito: extraer contenido y generar KPIs
   * Este es el método más importante - aquí ocurre la magia
   */
  async processRequirement(requirement_id: string): Promise<MinistryRequirement> {
    const requirement = await this.getRequirementById(requirement_id);
    if (!requirement) throw new Error('Requirement not found');

    try {
      // 1. Cambiar estado a "processing"
      await this.minReqRepository.update(
        { id: requirement_id },
        { status: 'processing' }
      );

      // 2. Extraer contenido del archivo
      const extracted = await this.extractFileContent(requirement.file_path);

      // 3. Guardar contenido extraído
      await this.minReqRepository.update(
        { id: requirement_id },
        {
          raw_text: extracted.text,
          extracted_content: extracted.structured
        }
      );

      // 4. Generar KPIs automáticamente
      const kpis = await this.generateKPIsFromContent(
        requirement.course_id,
        requirement_id,
        extracted.structured
      );

      // 5. Generar tareas de práctica y evaluación
      let taskCount = 0;
      for (const kpi of kpis) {
        taskCount += await this.generateTasksForKPI(requirement.course_id, kpi.id);
      }

      // 6. Actualizar estado a "extracted"
      const updated = await this.minReqRepository.findOne({ where: { id: requirement_id } });
      if (updated) {
        updated.status = 'extracted';
        updated.kpis_generated = kpis.length;
        updated.tasks_generated = taskCount;
        await this.minReqRepository.save(updated);
      }

      return updated || requirement;
    } catch (error: any) {
      // Si hay error, guardar nota
      await this.minReqRepository.update(
        { id: requirement_id },
        {
          status: 'uploaded',
          processing_notes: error.message
        }
      );
      throw error;
    }
  }

  /**
   * Extraer contenido de archivo según tipo
   */
  private async extractFileContent(
    filePath: string
  ): Promise<{
    text: string;
    structured: any;
  }> {
    try {
      // Leer archivo de texto plano (para MVP)
      const text = fs.readFileSync(filePath, 'utf-8');

      // Parsear contenido simple (en producción usar librerías como pdf-parse, mammoth, etc.)
      const structured = this.parseStructuredContent(text);

      return { text, structured };
    } catch (error: any) {
      throw new Error(`Error extracting file content: ${error.message}`);
    }
  }

  /**
   * Parsear contenido simple en estructura JSON
   * En producción, usar librerías especializadas por tipo de archivo
   */
  private parseStructuredContent(text: string): any {
    // MVP simple: buscar patrones
    const lines = text.split('\n');
    const competencies: string[] = [];
    const sections: any[] = [];
    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detectar secciones (líneas que empiezan con ###)
      if (trimmed.startsWith('###')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { name: trimmed.replace(/^###\s+/, ''), content: '' };
      } else if (trimmed.startsWith('-') && trimmed.includes('competencia')) {
        competencies.push(trimmed.substring(1).trim());
      } else if (currentSection) {
        currentSection.content += '\n' + trimmed;
      }
    }

    if (currentSection) sections.push(currentSection);

    return {
      title: 'Requisitos Ministeriales',
      description: text.substring(0, 500),
      sections,
      competencies,
      evaluation_criteria: [],
      target_profile: ''
    };
  }

  /**
   * Generar KPIs automáticamente del contenido extraído
   */
  private async generateKPIsFromContent(
    course_id: string,
    ministry_requirement_id: string,
    content: any
  ): Promise<KPI[]> {
    const kpis: KPI[] = [];
    const categories = [
      'accuracy',
      'efficiency',
      'compliance',
      'communication',
      'problem_solving'
    ];

    // Generar KPIs según competencias encontradas
    let index = 0;
    for (const competency of (content.competencies || [])) {
      const kpi = await kpiService.createKPI({
        course_id,
        ministry_requirement_id,
        name: `Competencia: ${competency.substring(0, 50)}`,
        description: competency,
        category: categories[index % categories.length],
        weight: 1 / (content.competencies.length || 1),
        target_value: 90, // 90% por defecto
        minimum_pass_value: 75,
        trigger_event: 'task_completed',
        success_criteria: `Estudiante debe demostrar ${competency}`
      });
      kpis.push(kpi);
      index++;
    }

    // Si no hay competencias, crear KPI genérico
    if (kpis.length === 0) {
      const kpi = await kpiService.createKPI({
        course_id,
        ministry_requirement_id,
        name: 'Competencia General',
        description: content.description || 'Competencia del curso',
        category: 'general',
        weight: 1.0,
        target_value: 85,
        minimum_pass_value: 70,
        trigger_event: 'simulation_completed',
        success_criteria: 'Completar simulación satisfactoriamente'
      });
      kpis.push(kpi);
    }

    return kpis;
  }

  /**
   * Generar tareas de práctica y evaluación para un KPI
   */
  private async generateTasksForKPI(course_id: string, kpi_id: string): Promise<number> {
    let taskCount = 0;

    // 1. Tarea práctica (puede equivocarse, IA enseña)
    const practiceTask = await taskService.createTask({
      course_id,
      kpi_id,
      title: `Práctica: Alcanza el objetivo`,
      description: `Práctica para alcanzar el KPI. Puedes equivocarte, el sistema te enseñará.`,
      type: 'practice',
      sequence_order: 1,
      ai_prompt_config: {
        give_hints: true,
        temperature: 0.5,
        max_attempts: 3
      },
      evaluation_criteria: {
        partial_credit_allowed: true
      }
    });
    taskCount++;

    // 2. Tarea práctica 2 (nivel intermedio)
    const practiceTask2 = await taskService.createTask({
      course_id,
      kpi_id,
      title: `Práctica Avanzada: Más desafíos`,
      description: `Práctica con casos más complejos. Aún puedes equivocarte.`,
      type: 'practice',
      sequence_order: 2,
      ai_prompt_config: {
        give_hints: false, // Menos pistas
        temperature: 0.7,
        max_attempts: 2
      },
      evaluation_criteria: {
        partial_credit_allowed: true,
        accuracy_required: 80
      }
    });
    taskCount++;

    // 3. Tarea evaluación (DEBE PASAR para certificar)
    const evalTask = await taskService.createTask({
      course_id,
      kpi_id,
      title: `Evaluación: Certifica tus conocimientos`,
      description: `Evaluación final. Debes alcanzar el 75% mínimo para certificar.`,
      type: 'evaluation',
      sequence_order: 3,
      ai_prompt_config: {
        give_hints: false,
        temperature: 0.3,
        max_attempts: 1
      },
      evaluation_criteria: {
        partial_credit_allowed: false,
        accuracy_required: 75
      }
    });
    taskCount++;

    return taskCount;
  }

  /**
   * Obtener requisito por ID
   */
  async getRequirementById(id: string): Promise<MinistryRequirement | null> {
    return await this.minReqRepository.findOne({
      where: { id },
      relations: ['course', 'uploaded_by', 'kpis']
    });
  }

  /**
   * Listar requisitos de un curso
   */
  async getRequirementsByCourse(course_id: string): Promise<MinistryRequirement[]> {
    return await this.minReqRepository.find({
      where: { course_id },
      relations: ['uploaded_by', 'kpis'],
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Activar requisito (hacer sus KPIs y tareas disponibles)
   */
  async activateRequirement(requirement_id: string): Promise<MinistryRequirement> {
    const requirement = await this.getRequirementById(requirement_id);
    if (!requirement) throw new Error('Requirement not found');
    if (requirement.status !== 'extracted') {
      throw new Error('Requirement must be extracted before activation');
    }

    // Activar todos los KPIs
    if (requirement.kpis) {
      for (const kpi of requirement.kpis) {
        await this.kpiRepository.update(
          { id: kpi.id },
          { is_active: true }
        );

        // Activar tareas
        const tasks = await this.taskRepository.find({ where: { kpi_id: kpi.id } });
        for (const task of tasks) {
          await this.taskRepository.update(
            { id: task.id },
            { is_active: true, status: 'pending' }
          );
        }
      }
    }

    // Actualizar requisito
    await this.minReqRepository.update(
      { id: requirement_id },
      { is_active: true, status: 'active', activated_at: new Date() }
    );

    return (await this.getRequirementById(requirement_id)) || requirement;
  }

  /**
   * Archivar requisito (desactivar KPIs y tareas)
   */
  async archiveRequirement(requirement_id: string): Promise<MinistryRequirement> {
    const requirement = await this.getRequirementById(requirement_id);
    if (!requirement) throw new Error('Requirement not found');

    // Desactivar KPIs y tareas
    if (requirement.kpis) {
      for (const kpi of requirement.kpis) {
        await this.kpiRepository.update(
          { id: kpi.id },
          { is_active: false }
        );

        const tasks = await this.taskRepository.find({ where: { kpi_id: kpi.id } });
        for (const task of tasks) {
          await this.taskRepository.update(
            { id: task.id },
            { is_active: false, status: 'archived' }
          );
        }
      }
    }

    await this.minReqRepository.update(
      { id: requirement_id },
      { is_active: false, status: 'archived' }
    );

    return (await this.getRequirementById(requirement_id)) || requirement;
  }

  /**
   * Obtener estadísticas de un requisito
   */
  async getRequirementStats(requirement_id: string): Promise<any> {
    const requirement = await this.getRequirementById(requirement_id);
    if (!requirement) throw new Error('Requirement not found');

    return {
      id: requirement.id,
      kpis_count: requirement.kpis_generated,
      tasks_count: requirement.tasks_generated,
      status: requirement.status,
      is_active: requirement.is_active,
      created_at: requirement.created_at,
      activated_at: requirement.activated_at
    };
  }
}

export const ministryRequirementService = new MinistryRequirementService();

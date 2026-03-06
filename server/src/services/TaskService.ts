import { AppDataSource } from '../database/connection';
import { Task, TaskType, TaskStatus } from '../entities/Task';
import { KPI } from '../entities/KPI';
import { Repository } from 'typeorm';

/**
 * Servicio para gestionar Tasks (Tareas generadas de KPIs)
 * Las tareas son simulaciones práctica y evaluación
 */
export class TaskService {
  private taskRepository: Repository<Task>;
  private kpiRepository: Repository<KPI>;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
    this.kpiRepository = AppDataSource.getRepository(KPI);
  }

  /**
   * Crear una tarea
   */
  async createTask(data: {
    course_id: string;
    kpi_id: string;
    title: string;
    description: string;
    type: TaskType;
    scenario_id?: string;
    sequence_order?: number;
    ai_prompt_config?: any;
    evaluation_criteria?: any;
  }): Promise<Task> {
    const task = this.taskRepository.create(data);
    const saved = await this.taskRepository.save(task);

    // Incrementar contador en KPI
    const kpi = await this.kpiRepository.findOne({ where: { id: data.kpi_id } });
    if (kpi) {
      await this.kpiRepository.update(
        { id: data.kpi_id },
        { tasks_count: (kpi.tasks_count || 0) + 1 }
      );
    }

    return saved;
  }

  /**
   * Obtener tarea por ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    return await this.taskRepository.findOne({
      where: { id },
      relations: ['course', 'kpi', 'scenario']
    });
  }

  /**
   * Listar tareas de un curso
   */
  async getTasksByCourse(
    course_id: string,
    type?: TaskType,
    isActive = true
  ): Promise<Task[]> {
    const query = this.taskRepository.createQueryBuilder('task')
      .where('task.course_id = :course_id', { course_id })
      .andWhere('task.is_active = :isActive', { isActive });

    if (type) {
      query.andWhere('task.type = :type', { type });
    }

    return await query
      .leftJoinAndSelect('task.kpi', 'kpi')
      .leftJoinAndSelect('task.scenario', 'scenario')
      .orderBy('task.sequence_order', 'ASC')
      .addOrderBy('task.created_at', 'ASC')
      .getMany();
  }

  /**
   * Listar tareas de un KPI
   */
  async getTasksByKPI(kpi_id: string, isActive = true): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { kpi_id, is_active: isActive },
      relations: ['scenario'],
      order: { sequence_order: 'ASC' }
    });
  }

  /**
   * Obtener tareas práctica (para aprender)
   */
  async getPracticeTasks(course_id: string): Promise<Task[]> {
    return await this.getTasksByCourse(course_id, 'practice', true);
  }

  /**
   * Obtener tareas evaluación (para certificar)
   */
  async getEvaluationTasks(course_id: string): Promise<Task[]> {
    return await this.getTasksByCourse(course_id, 'evaluation', true);
  }

  /**
   * Actualizar tarea
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await this.taskRepository.update({ id }, updates);
    const updated = await this.getTaskById(id);
    if (!updated) throw new Error('Task not found');
    return updated;
  }

  /**
   * Registrar que un estudiante completó una tarea
   */
  async recordTaskCompletion(
    task_id: string,
    completion_rate: number // 0-100
  ): Promise<void> {
    const task = await this.getTaskById(task_id);
    if (!task) throw new Error('Task not found');

    const newAvg = (
      (task.average_completion_rate * task.students_completed + completion_rate) /
      (task.students_completed + 1)
    );

    await this.taskRepository.update(
      { id: task_id },
      {
        students_completed: (task.students_completed || 0) + 1,
        average_completion_rate: Number(newAvg.toFixed(2))
      }
    );
  }

  /**
   * Obtener estadísticas de una tarea
   */
  async getTaskStats(task_id: string): Promise<{
    students_completed: number;
    average_completion_rate: number;
    pass_rate: number;
  }> {
    const task = await this.getTaskById(task_id);
    if (!task) throw new Error('Task not found');

    return {
      students_completed: task.students_completed || 0,
      average_completion_rate: task.average_completion_rate || 0,
      pass_rate: 0 // TODO: Calcular desde assessments
    };
  }

  /**
   * Activar/desactivar tarea
   */
  async toggleTaskActive(id: string, isActive: boolean): Promise<Task> {
    return await this.updateTask(id, { is_active: isActive });
  }

  /**
   * Eliminar tarea (soft delete)
   */
  async deleteTask(id: string): Promise<void> {
    await this.toggleTaskActive(id, false);
  }

  /**
   * Obtener siguiente tarea para un estudiante
   * (primera tarea práctica sin completar, luego evaluación)
   */
  async getNextTaskForStudent(
    course_id: string,
    completed_task_ids: string[]
  ): Promise<Task | null> {
    // Primero obtener tareas práctica sin completar
    const practiceTasks = await this.getPracticeTasks(course_id);
    for (const task of practiceTasks) {
      if (!completed_task_ids.includes(task.id)) {
        return task;
      }
    }

    // Luego obtener tareas evaluación sin completar
    const evalTasks = await this.getEvaluationTasks(course_id);
    for (const task of evalTasks) {
      if (!completed_task_ids.includes(task.id)) {
        return task;
      }
    }

    return null;
  }
}

export const taskService = new TaskService();

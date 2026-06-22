import { AppDataSource } from '../database/connection';
import { KPI } from '../entities/KPI';
import { MinistryRequirement } from '../entities/MinistryRequirement';
import { Task } from '../entities/Task';
import { Repository } from 'typeorm';

/**
 * Servicio para gestionar KPIs (Key Performance Indicators)
 * KPIs se extraen de requisitos ministeriales
 */
export class KPIService {
  private kpiRepository: Repository<KPI>;
  private minReqRepository: Repository<MinistryRequirement>;
  private taskRepository: Repository<Task>;

  constructor() {
    this.kpiRepository = AppDataSource.getRepository(KPI);
    this.minReqRepository = AppDataSource.getRepository(MinistryRequirement);
    this.taskRepository = AppDataSource.getRepository(Task);
  }

  /**
   * Crear un KPI (generalmente desde extracción de requisito ministerial)
   */
  async createKPI(data: {
    course_id: string;
    ministry_requirement_id: string;
    name: string;
    description: string;
    category: string;
    weight: number;
    target_value: number;
    minimum_pass_value?: number;
    trigger_event: string;
    success_criteria?: string;
  }): Promise<KPI> {
    const kpi = this.kpiRepository.create(data);
    return await this.kpiRepository.save(kpi);
  }

  /**
   * Obtener KPI por ID
   */
  async getKPIById(id: string): Promise<KPI | null> {
    return await this.kpiRepository.findOne({
      where: { id },
      relations: ['course', 'ministry_requirement', 'tasks']
    });
  }

  /**
   * Listar KPIs de un curso
   */
  async getKPIsByCourse(course_id: string, isActive = true): Promise<KPI[]> {
    return await this.kpiRepository.find({
      where: { course_id, is_active: isActive },
      relations: ['tasks'],
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Listar KPIs de un requisito ministerial
   */
  async getKPIsByRequirement(ministry_requirement_id: string): Promise<KPI[]> {
    return await this.kpiRepository.find({
      where: { ministry_requirement_id },
      relations: ['tasks'],
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Actualizar KPI
   */
  async updateKPI(id: string, updates: Partial<KPI>): Promise<KPI> {
    await this.kpiRepository.update({ id }, updates);
    const updated = await this.getKPIById(id);
    if (!updated) throw new Error('KPI not found');
    return updated;
  }

  /**
   * Activar/desactivar KPI
   */
  async toggleKPIActive(id: string, isActive: boolean): Promise<KPI> {
    return await this.updateKPI(id, { is_active: isActive });
  }

  /**
   * Registrar que un estudiante alcanzó un KPI
   */
  async recordKPIAchievement(kpi_id: string, achieved_value: number): Promise<void> {
    const kpi = await this.getKPIById(kpi_id);
    if (!kpi) throw new Error('KPI not found');

    // Incrementar contador de estudiantes que lo alcanzaron
    await this.kpiRepository.update(
      { id: kpi_id },
      { students_achieved: (kpi.students_achieved || 0) + 1 }
    );
  }

  /**
   * Obtener estadísticas de un KPI
   */
  async getKPIStats(kpi_id: string): Promise<{
    total_students: number;
    students_achieved: number;
    achievement_rate: number;
    avg_performance: number;
  }> {
    const kpi = await this.getKPIById(kpi_id);
    if (!kpi) throw new Error('KPI not found');

    // TODO: Implementar cálculo real desde assessments
    return {
      total_students: 0,
      students_achieved: kpi.students_achieved || 0,
      achievement_rate: 0,
      avg_performance: 0
    };
  }

  /**
   * Obtener estado de un KPI (excellent, good, acceptable, poor)
   */
  getKPIStatus(achievedValue: number, thresholds: any): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (achievedValue >= thresholds.excellent) return 'excellent';
    if (achievedValue >= thresholds.good) return 'good';
    if (achievedValue >= thresholds.acceptable) return 'acceptable';
    return 'poor';
  }

  /**
   * Eliminar KPI (soft delete)
   */
  async deleteKPI(id: string): Promise<void> {
    await this.toggleKPIActive(id, false);
  }
}

export const kpiService = new KPIService();

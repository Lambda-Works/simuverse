import { AppDataSource } from '../database/connection';
import { Scenario, CaseData } from '../entities/Scenario';
import { SimulationInstance } from '../entities/SimulationInstance';

export class ScenarioService {
  private static scenarioRepository = AppDataSource.getRepository(Scenario);
  private static simulationRepository = AppDataSource.getRepository(SimulationInstance);

  /**
   * Get all scenarios for a course
   */
  static async getScenariosByCourse(course_id: string): Promise<Scenario[]> {
    return this.scenarioRepository.find({
      where: { course_id, is_active: true },
      order: { sequence: 'ASC' },
    });
  }

  /**
   * Get a specific scenario
   */
  static async getScenario(id: string): Promise<Scenario | null> {
    return this.scenarioRepository.findOne({
      where: { id },
    });
  }

  /**
   * Create a new scenario for a course
   */
  static async createScenario(course_id: string, data: {
    name: string;
    description: string;
    case_data: CaseData;
    initial_state?: Record<string, any>;
    validation_rules?: Record<string, any>;
    success_criteria?: string[];
    sequence?: number;
  }): Promise<Scenario> {
    const scenario = this.scenarioRepository.create({
      course_id,
      ...data,
    });

    return await this.scenarioRepository.save(scenario);
  }

  /**
   * Update a scenario
   */
  static async updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario> {
    await this.scenarioRepository.update(id, updates);
    const scenario = await this.getScenario(id);
    if (!scenario) {
      throw new Error(`Scenario ${id} not found`);
    }
    return scenario;
  }

  /**
   * Deactivate a scenario (soft delete)
   */
  static async deactivateScenario(id: string): Promise<Scenario> {
    return this.updateScenario(id, { is_active: false });
  }

  /**
   * Get all instances of a scenario
   */
  static async getScenarioInstances(scenario_id: string): Promise<SimulationInstance[]> {
    return this.simulationRepository.find({
      where: { scenario_id },
      relations: ['student', 'course'],
      order: { started_at: 'DESC' },
    });
  }

  /**
   * Get scenario statistics (for admin dashboard)
   */
  static async getScenarioStats(scenario_id: string): Promise<{
    totalAttempts: number;
    completed_attempts: number;
    failed_attempts: number;
    averageTimeSpent: number;
    successRate: number;
  }> {
    const instances = await this.getScenarioInstances(scenario_id);

    const completedInstances = instances.filter((i) => i.status === 'completed');
    const failedInstances = instances.filter((i) => i.status === 'failed');

    const averageTimeSpent =
      instances.length > 0
        ? instances.reduce((sum, i) => {
            if (!i.completed_at || !i.started_at) return sum;
            return sum + (i.completed_at.getTime() - i.started_at.getTime());
          }, 0) / instances.length / 1000 / 60 // Convert to minutes
        : 0;

    return {
      totalAttempts: instances.length,
      completed_attempts: completedInstances.length,
      failed_attempts: failedInstances.length,
      averageTimeSpent: Math.round(averageTimeSpent),
      successRate:
        instances.length > 0 ? (completedInstances.length / instances.length) * 100 : 0,
    };
  }

  /**
   * Clone a scenario for another course
   */
  static async cloneScenario(
    sourceScenarioId: number,
    targetCourseId: string,
    newName?: string
  ): Promise<Scenario> {
    const sourceScenario = await this.getScenario(sourceScenarioId);
    if (!sourceScenario) {
      throw new Error(`Scenario ${sourceScenarioId} not found`);
    }

    const clonedScenario = this.scenarioRepository.create({
      course_id: targetCourseId,
      name: newName || `${sourceScenario.name} (Clone)`,
      description: sourceScenario.description,
      case_data: { ...sourceScenario.case_data },
      initial_state: sourceScenario.initial_state ? { ...sourceScenario.initial_state } : undefined,
      validation_rules: sourceScenario.validation_rules
        ? { ...sourceScenario.validation_rules }
        : undefined,
      success_criteria: sourceScenario.success_criteria ? [...sourceScenario.success_criteria] : undefined,
    });

    return await this.scenarioRepository.save(clonedScenario);
  }
}

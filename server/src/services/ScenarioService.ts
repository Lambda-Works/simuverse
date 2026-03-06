import { AppDataSource } from '../database/connection';
import { Scenario } from '../entities/Scenario';
import { SimulationInstance } from '../entities/SimulationInstance';

export class ScenarioService {
  private static scenarioRepository = AppDataSource.getRepository(Scenario);
  private static simulationRepository = AppDataSource.getRepository(SimulationInstance);

  /**
   * Get all scenarios for a course
   * scenario_type='practice' → múltiples intentos (practica libre)
   * scenario_type='evaluation' → instancia única evaluada
   */
  static async getScenariosByCourse(course_id: string, type?: string): Promise<Scenario[]> {
    const where: any = { course_id, is_active: true };
    if (type) where.scenario_type = type;
    return this.scenarioRepository.find({
      where,
      order: { created_at: 'ASC' },
    });
  }

  static async getScenario(id: string): Promise<Scenario | null> {
    return this.scenarioRepository.findOne({ where: { id } });
  }

  static async createScenario(course_id: string, data: {
    title: string;
    description?: string;
    scenario_type?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    content?: any;
    expected_outcomes?: any;
  }): Promise<Scenario> {
    const scenario = this.scenarioRepository.create({ course_id, ...data });
    return await this.scenarioRepository.save(scenario);
  }

  static async updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario> {
    await this.scenarioRepository.update(id, updates);
    const scenario = await this.getScenario(id);
    if (!scenario) throw new Error(`Scenario ${id} not found`);
    return scenario;
  }

  static async deactivateScenario(id: string): Promise<Scenario> {
    return this.updateScenario(id, { is_active: false });
  }

  static async getScenarioInstances(scenario_id: string): Promise<SimulationInstance[]> {
    return this.simulationRepository.find({
      where: { scenario_id },
      order: { started_at: 'DESC' },
    });
  }

  static async getScenarioStats(scenario_id: string) {
    const instances = await this.getScenarioInstances(scenario_id);
    const completedInstances = instances.filter((i) => i.status === 'completed');
    const failedInstances = instances.filter((i) => i.status === 'failed');
    const averageTimeSpent =
      instances.length > 0
        ? instances.reduce((sum, i) => {
            if (!i.completed_at || !i.started_at) return sum;
            return sum + (i.completed_at.getTime() - i.started_at.getTime());
          }, 0) / instances.length / 1000 / 60
        : 0;
    return {
      totalAttempts: instances.length,
      completed_attempts: completedInstances.length,
      failed_attempts: failedInstances.length,
      averageTimeSpent: Math.round(averageTimeSpent),
      successRate: instances.length > 0 ? (completedInstances.length / instances.length) * 100 : 0,
    };
  }

  static async cloneScenario(sourceScenarioId: string, targetCourseId: string, newTitle?: string): Promise<Scenario> {
    const sourceScenario = await this.getScenario(sourceScenarioId);
    if (!sourceScenario) throw new Error(`Scenario ${sourceScenarioId} not found`);
    const clonedScenario = this.scenarioRepository.create({
      course_id: targetCourseId,
      title: newTitle || `${sourceScenario.title} (Clone)`,
      description: sourceScenario.description,
      scenario_type: sourceScenario.scenario_type,
      difficulty: sourceScenario.difficulty,
      content: sourceScenario.content ? { ...sourceScenario.content } : undefined,
      expected_outcomes: sourceScenario.expected_outcomes ? { ...sourceScenario.expected_outcomes } : undefined,
    });
    return await this.scenarioRepository.save(clonedScenario);
  }
}

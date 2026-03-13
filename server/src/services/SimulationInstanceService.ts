import { AppDataSource } from '../database/connection';
import { SimulationInstance, SimulationStatus } from '../entities/SimulationInstance';
import { PracticeLogsService } from './PracticeLogsService';

export class SimulationInstanceService {
  private static simulationRepository = AppDataSource.getRepository(SimulationInstance);

  /**
   * Create a new simulation instance (start a scenario)
   */
  static async startSimulation(
    student_id: string,
    course_id: string,
    scenario_id: string
  ): Promise<SimulationInstance> {
    // Check if student already has active instance for this scenario
    const activeInstance = await this.simulationRepository.findOne({
      where: {
        student_id,
        scenario_id,
        status: 'in_progress',
      },
    });

    if (activeInstance) {
      return activeInstance;
    }

    const simulation = this.simulationRepository.create({
      student_id,
      course_id,
      scenario_id,
      status: 'in_progress',
      progress: 0,
      current_state: {},
    });

    const savedSimulation = await this.simulationRepository.save(simulation);

    // Log the action
    await PracticeLogsService.logAction(
      student_id,
      course_id,
      'system_event',
      `Started simulation for scenario ${scenario_id}`,
      {
        moduleName: 'SimulationInstance',
        simulation_instance_id: savedSimulation.id,
      },
      savedSimulation.id
    );

    return savedSimulation;
  }

  /**
   * Get a simulation instance
   */
  static async getSimulation(id: string): Promise<SimulationInstance | null> {
    return this.simulationRepository.findOne({
      where: { id },
      relations: ['student', 'course', 'scenario'],
    });
  }

  /**
   * Get all simulations for a student in a course
   */
  static async getStudentCourseSimulations(
    student_id: string,
    course_id: string
  ): Promise<SimulationInstance[]> {
    return this.simulationRepository.find({
      where: { student_id, course_id },
      order: { started_at: 'DESC' },
      relations: ['scenario'],
    });
  }

  /**
   * Get active simulation for a student in a course
   */
  static async getActiveSimulation(
    student_id: string,
    course_id: string
  ): Promise<SimulationInstance | null> {
    return this.simulationRepository.findOne({
      where: {
        student_id,
        course_id,
        status: 'in_progress',
      },
      relations: ['scenario'],
    });
  }

  /**
   * Update simulation state
   */
  static async updateState(
    id: string,
    newState: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<SimulationInstance> {
    const simulation = await this.getSimulation(id);
    if (!simulation) {
      throw new Error(`Simulation ${id} not found`);
    }

    simulation.current_state = { ...simulation.current_state, ...newState };
    simulation.metadata = { ...simulation.metadata, ...metadata };
    simulation.progress = Math.min(
      100,
      (simulation.progress || 0) + (metadata?.progress_delta || 0)
    );

    const updated = await this.simulationRepository.save(simulation);

    // Log state change if significant
    if (metadata?.logStateChange && simulation.course_id) {
      await PracticeLogsService.logAction(
        simulation.student_id,
        simulation.course_id,
        'decision_made',
        `Updated simulation state`,
        {
          moduleName: 'SimulationInstance',
          inputData: newState,
          simulation_instance_id: id,
        },
        id
      );
    }

    return updated;
  }

  /**
   * Pause a simulation
   */
  static async pauseSimulation(id: string): Promise<SimulationInstance> {
    const simulation = await this.getSimulation(id);
    if (!simulation) {
      throw new Error(`Simulation ${id} not found`);
    }

    simulation.status = 'paused';
    const updated = await this.simulationRepository.save(simulation);

    if (simulation.course_id) {
      await PracticeLogsService.logAction(
        simulation.student_id,
        simulation.course_id,
        'system_event',
        `Paused simulation`,
        { moduleName: 'SimulationInstance' },
        id
      );
    }

    return updated;
  }

  /**
   * Resume a simulation
   */
  static async resumeSimulation(id: string): Promise<SimulationInstance> {
    const simulation = await this.getSimulation(id);
    if (!simulation) {
      throw new Error(`Simulation ${id} not found`);
    }

    simulation.status = 'in_progress';
    simulation.updated_at = new Date();
    const updated = await this.simulationRepository.save(simulation);

    if (simulation.course_id) {
      await PracticeLogsService.logAction(
        simulation.student_id,
        simulation.course_id,
        'system_event',
        `Resumed simulation`,
        { moduleName: 'SimulationInstance' },
        id
      );
    }

    return updated;
  }

  /**
   * Complete a simulation
   */
  static async completeSimulation(
    id: string,
    performance_metrics?: {
      accuracy: number;
      time_spent: number;
      tasks_completed: number;
      tasks_total: number;
      error_count: number;
    }
  ): Promise<SimulationInstance> {
    const simulation = await this.getSimulation(id);
    if (!simulation) {
      throw new Error(`Simulation ${id} not found`);
    }

    simulation.status = 'completed';
    simulation.completed_at = new Date();
    simulation.progress = 100;
    if (performance_metrics) {
      simulation.performance_metrics = performance_metrics;
    }

    const updated = await this.simulationRepository.save(simulation);

    if (simulation.course_id) {
      await PracticeLogsService.logAction(
        simulation.student_id,
        simulation.course_id,
        'case_submitted',
        `Completed simulation with metrics`,
        {
          moduleName: 'SimulationInstance',
          outputData: performance_metrics,
          duration: simulation.completed_at.getTime() - simulation.started_at.getTime(),
        },
        id
      );
    }

    return updated;
  }

  /**
   * Submit a simulation for teacher review
   */
  static async submitForReview(id: string): Promise<SimulationInstance> {
    const simulation = await this.getSimulation(id);
    if (!simulation) {
      throw new Error(`Simulation ${id} not found`);
    }

    simulation.status = 'submitted_for_review';
    simulation.submitted_at = new Date();
    const updated = await this.simulationRepository.save(simulation);

    if (simulation.course_id) {
      await PracticeLogsService.logAction(
        simulation.student_id,
        simulation.course_id,
        'case_submitted',
        `Submitted simulation for teacher review`,
        { moduleName: 'SimulationInstance' },
        id
      );
    }

    return updated;
  }

  /**
   * Mark a simulation as failed
   */
  static async failSimulation(id: string, reason: string): Promise<SimulationInstance> {
    const simulation = await this.getSimulation(id);
    if (!simulation) {
      throw new Error(`Simulation ${id} not found`);
    }

    simulation.status = 'failed';
    simulation.metadata = {
      ...simulation.metadata,
      failure_reason: reason,
      failed_at: new Date().toISOString(),
    };

    const updated = await this.simulationRepository.save(simulation);

    if (simulation.course_id) {
      await PracticeLogsService.logAction(
        simulation.student_id,
        simulation.course_id,
        'system_event',
        `Simulation failed: ${reason}`,
        {
          moduleName: 'SimulationInstance',
          errors: [reason],
        },
        id
      );
    }

    return updated;
  }

  /**
   * Get statistics for a course (for admin dashboard)
   */
  static async getCourseStatistics(course_id: string): Promise<{
    totalSimulations: number;
    completedSimulations: number;
    activeSimulations: number;
    averageCompletionTime: number;
    averageAccuracy: number;
  }> {
    const simulations = await this.simulationRepository.find({
      where: { course_id },
    });

    const completed = simulations.filter((s) => s.status === 'completed');
    const active = simulations.filter((s) => s.status === 'in_progress');

    const completionTimes = completed
      .filter((s) => s.completed_at)
      .map((s) => (s.completed_at!.getTime() - s.started_at.getTime()) / 1000 / 60); // minutes

    const accuracies = completed
      .filter((s) => s.performance_metrics?.accuracy)
      .map((s) => s.performance_metrics!.accuracy);

    return {
      totalSimulations: simulations.length,
      completedSimulations: completed.length,
      activeSimulations: active.length,
      averageCompletionTime:
        completionTimes.length > 0
          ? Math.round(
              completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
            )
          : 0,
      averageAccuracy:
        accuracies.length > 0
          ? Math.round(
              (accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 100
            ) / 100
          : 0,
    };
  }
}

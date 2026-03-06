import { AppDataSource } from '../database/connection.js';
import { Simulation, SimulationStatus } from '../entities/Simulation.js';
import { TelemetryLog } from '../entities/TelemetryLog.js';
import crypto from 'crypto';

export class SimulationService {
  private simulationRepository = AppDataSource.getRepository(Simulation);

  async createSimulation(user_id: string, course_id: string, scenario_id?: string) {
    const simulation = this.simulationRepository.create({
      user_id,
      course_id,
      status: SimulationStatus.IN_PROGRESS,
      started_at: new Date(),
    });
    return await this.simulationRepository.save(simulation);
  }

  async getSimulation(simulation_id: string) {
    return await this.simulationRepository.findOne({
      where: { id: simulation_id },
      relations: ['course', 'user']
    });
  }

  async getActiveSimulation(user_id: string, course_id: string) {
    return await this.simulationRepository.findOne({
      where: {
        user_id,
        course_id,
        status: SimulationStatus.IN_PROGRESS,
      }
    });
  }

  async pauseSimulation(simulation_id: string) {
    await this.simulationRepository.update(
      simulation_id,
      { status: SimulationStatus.PAUSED, paused_at: new Date() }
    );
    return await this.getSimulation(simulation_id);
  }

  async resumeSimulation(simulation_id: string) {
    await this.simulationRepository.update(
      simulation_id,
      { status: SimulationStatus.IN_PROGRESS, paused_at: null }
    );
    return await this.getSimulation(simulation_id);
  }

  async completeSimulation(simulation_id: string) {
    await this.simulationRepository.update(
      simulation_id,
      {
        status: SimulationStatus.COMPLETED,
        completed_at: new Date(),
        progress_percentage: 100,
      }
    );
    return await this.getSimulation(simulation_id);
  }

  async updateSimulationState(simulation_id: string, state: Record<string, any>) {
    await this.simulationRepository.update(
      simulation_id,
      { current_state: state }
    );
    return await this.getSimulation(simulation_id);
  }
}

export class TelemetryService {
  private telemetryRepository = AppDataSource.getRepository(TelemetryLog);

  async logAction(
    simulation_id: string,
    user_id: string,
    course_id: string,
    action: string,
    action_type: string,
    metadata: Record<string, any> = {},
    responseTimeMs: number = 0
  ) {
    const integrity_hash = crypto
      .createHash('sha256')
      .update(`${simulation_id}${action}${Date.now()}`)
      .digest('hex');

    const log = this.telemetryRepository.create({
      simulation_id,
      user_id,
      course_id,
      action,
      action_type: action_type as any,
      response_time_ms: responseTimeMs,
      metadata,
      integrity_hash,
    });

    return await this.telemetryRepository.save(log);
  }

  async getSimulationLogs(simulation_id: string) {
    return await this.telemetryRepository.find({
      where: { simulation_id: simulation_id },
      order: { created_at: 'ASC' }
    });
  }

  async getUserCourseLogs(user_id: string, course_id: string) {
    return await this.telemetryRepository.find({
      where: { user_id, course_id },
      order: { created_at: 'DESC' }
    });
  }

  async getLogsInTimeRange(startDate: Date, endDate: Date) {
    return await this.telemetryRepository
      .createQueryBuilder('log')
      .where('log.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('log.created_at', 'DESC')
      .getMany();
  }
}

export const simulationService = new SimulationService();
export const telemetryService = new TelemetryService();


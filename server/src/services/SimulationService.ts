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
    try {
      // Raw insert usando solo columnas reales de la tabla
      await AppDataSource.query(
        `INSERT INTO telemetry_logs (id, simulation_id, action, metadata)
         VALUES (UUID(), ?, ?, ?)`,
        [
          simulation_id,
          action.substring(0, 100),
          JSON.stringify({ user_id, course_id, action_type, response_time_ms: responseTimeMs, ...metadata }),
        ]
      );
    } catch (err: any) {
      // Telemetría no debe interrumpir el flujo principal
      console.warn('[TelemetryService] logAction silenciado:', err.message);
    }
  }

  async getSimulationLogs(simulation_id: string) {
    try {
      return await AppDataSource.query(
        'SELECT * FROM telemetry_logs WHERE simulation_id = ? ORDER BY created_at ASC',
        [simulation_id]
      );
    } catch { return []; }
  }

  async getUserCourseLogs(user_id: string, course_id: string) {
    try {
      return await AppDataSource.query(
        `SELECT * FROM telemetry_logs WHERE simulation_id IN
         (SELECT id FROM simulations WHERE student_id = ? AND course_id = ?)
         ORDER BY created_at DESC`,
        [user_id, course_id]
      );
    } catch { return []; }
  }

  async getLogsInTimeRange(startDate: Date, endDate: Date) {
    try {
      return await AppDataSource.query(
        'SELECT * FROM telemetry_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
        [startDate, endDate]
      );
    } catch { return []; }
  }
}

export const simulationService = new SimulationService();
export const telemetryService = new TelemetryService();


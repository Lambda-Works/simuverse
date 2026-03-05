import { Simulation } from '../models/Simulation.js';
import { TelemetryLog } from '../models/TelemetryLog.js';
import crypto from 'crypto';

export class SimulationService {
  async createSimulation(userId: string, courseId: string, scenarioId?: string) {
    const simulation = new Simulation({
      user_id: userId,
      course_id: courseId,
      scenario_id: scenarioId,
      status: 'in-progress',
      started_at: new Date(),
    });
    return await simulation.save();
  }

  async getSimulation(simulationId: string) {
    return await Simulation.findById(simulationId).lean();
  }

  async getActiveSimulation(userId: string, courseId: string) {
    return await Simulation.findOne({
      user_id: userId,
      course_id: courseId,
      status: 'in-progress',
    }).lean();
  }

  async pauseSimulation(simulationId: string) {
    return await Simulation.findByIdAndUpdate(
      simulationId,
      { status: 'paused', paused_at: new Date() },
      { new: true }
    );
  }

  async resumeSimulation(simulationId: string) {
    return await Simulation.findByIdAndUpdate(
      simulationId,
      { status: 'in-progress', paused_at: null },
      { new: true }
    );
  }

  async completeSimulation(simulationId: string) {
    return await Simulation.findByIdAndUpdate(
      simulationId,
      {
        status: 'completed',
        completed_at: new Date(),
        progress: 100,
      },
      { new: true }
    );
  }

  async updateSimulationState(simulationId: string, state: Record<string, any>) {
    return await Simulation.findByIdAndUpdate(
      simulationId,
      { current_state: state },
      { new: true }
    );
  }
}

export class TelemetryService {
  async logAction(
    simulationId: string,
    userId: string,
    courseId: string,
    action: string,
    actionType: any,
    metadata: Record<string, any> = {},
    responseTimeMs: number = 0
  ) {
    const integrityHash = crypto
      .createHash('sha256')
      .update(`${simulationId}${action}${Date.now()}`)
      .digest('hex');

    const log = new TelemetryLog({
      simulation_id: simulationId,
      user_id: userId,
      course_id: courseId,
      action,
      action_type: actionType,
      timestamp: new Date(),
      response_time_ms: responseTimeMs,
      metadata,
      integrity_hash: integrityHash,
    });

    return await log.save();
  }

  async getSimulationLogs(simulationId: string) {
    return await TelemetryLog.find({ simulation_id: simulationId })
      .sort({ timestamp: 1 })
      .lean();
  }

  async getUserCourseLogs(userId: string, courseId: string) {
    return await TelemetryLog.find({ user_id: userId, course_id: courseId })
      .sort({ timestamp: -1 })
      .lean();
  }

  async getLogsInTimeRange(startDate: Date, endDate: Date) {
    return await TelemetryLog.find({
      timestamp: { $gte: startDate, $lte: endDate },
    })
      .sort({ timestamp: -1 })
      .lean();
  }
}

export const simulationService = new SimulationService();
export const telemetryService = new TelemetryService();

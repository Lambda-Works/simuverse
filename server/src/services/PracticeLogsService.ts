import { AppDataSource } from '../database/connection';
import { PracticeLogs, ActionType, ActionMetadata } from '../entities/PracticeLogs';
import { v4 as uuidv4 } from 'uuid';

export class PracticeLogsService {
  private static logsRepository = AppDataSource.getRepository(PracticeLogs);

  /**
   * Log a student action (main entry point for audit trail)
   */
  static async logAction(
    student_id: string,
    course_id: string,
    action_type: ActionType,
    description: string,
    metadata: ActionMetadata,
    simulation_instance_id?: string
  ): Promise<PracticeLogs> {
    // Get the sequence number for this student
    const lastLog = await this.logsRepository.findOne({
      where: { student_id },
      order: { sequence_number: 'DESC' },
    });

    const nextSequenceNumber = (lastLog?.sequence_number || 0) + 1;
    const previous_hash = lastLog?.integrity_hash;
    const timestamp = Date.now();

    // Compute integrity hash (ensures logs cannot be tampered with)
    const integrity_hash = PracticeLogs.computeIntegrityHash(
      previous_hash,
      student_id,
      course_id,
      action_type,
      timestamp
    );

    const log = this.logsRepository.create({
      id: uuidv4(),
      student_id,
      course_id,
      action_type,
      description,
      metadata,
      simulation_instance_id,
      sequence_number: nextSequenceNumber,
      integrity_hash,
      previous_hash,
      timestamp,
    });

    return await this.logsRepository.save(log);
  }

  /**
   * Get all logs for a student in a course
   */
  static async getLogsForStudent(
    student_id: string,
    course_id: string,
    limit = 100
  ): Promise<PracticeLogs[]> {
    return this.logsRepository.find({
      where: { student_id, course_id },
      order: { sequence_number: 'ASC' },
      take: limit,
    });
  }

  /**
   * Get all logs for a course (for teacher review)
   */
  static async getLogsForCourse(
    course_id: string,
    filters?: {
      action_type?: ActionType;
      startDate?: Date;
      endDate?: Date;
      student_id?: string;
    }
  ): Promise<PracticeLogs[]> {
    let query = this.logsRepository.createQueryBuilder('logs')
      .where('logs.course_id = :course_id', { course_id });

    if (filters?.action_type) {
      query = query.andWhere('logs.action_type = :action_type', { action_type: filters.action_type });
    }

    if (filters?.student_id) {
      query = query.andWhere('logs.student_id = :student_id', { student_id: filters.student_id });
    }

    if (filters?.startDate) {
      query = query.andWhere('logs.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query = query.andWhere('logs.created_at <= :endDate', { endDate: filters.endDate });
    }

    return query.orderBy('logs.sequence_number', 'ASC').getMany();
  }

  /**
   * Get logs for a specific simulation instance
   */
  static async getLogsForSimulation(simulation_instance_id: number): Promise<PracticeLogs[]> {
    return this.logsRepository.find({
      where: { simulation_instance_id },
      order: { sequence_number: 'ASC' },
    });
  }

  /**
   * Verify integrity of logs (cryptographic validation)
   */
  static async verifyLogIntegrity(
    student_id: string,
    course_id: string
  ): Promise<{
    isValid: boolean;
    details: {
      totalLogs: number;
      invalidLogs: string[];
      brokenChainAt?: number;
    };
  }> {
    const logs = await this.getLogsForStudent(student_id, course_id, 10000);

    const invalidLogs: string[] = [];
    let previous_hash: string | undefined;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Verify hash chain
      if (log.previous_hash !== previous_hash) {
        invalidLogs.push(`Log ${i + 1}: Chain broken (previous_hash mismatch)`);
      }

      // Recompute hash and verify
      const computedHash = PracticeLogs.computeIntegrityHash(
        previous_hash,
        parseInt(student_id),
        parseInt(course_id),
        log.action_type,
        log.timestamp
      );

      if (computedHash !== log.integrity_hash) {
        invalidLogs.push(`Log ${i + 1}: Integrity verification failed`);
      }

      previous_hash = log.integrity_hash;
    }

    return {
      isValid: invalidLogs.length === 0,
      details: {
        totalLogs: logs.length,
        invalidLogs,
        brokenChainAt: invalidLogs.length > 0 ? parseInt(invalidLogs[0].split(' ')[1]) : undefined,
      },
    };
  }

  /**
   * Get statistics for Ministry report
   */
  static async getStudentStats(
    student_id: string,
    course_id: string
  ): Promise<{
    totalActions: number;
    actionBreakdown: Record<ActionType, number>;
    time_spent: number; // minutes
    successRate: number;
    lastActionTime: Date | null;
  }> {
    const logs = await this.getLogsForStudent(student_id, course_id, 10000);

    const actionBreakdown: Record<string, number> = {};
    logs.forEach((log) => {
      actionBreakdown[log.action_type] = (actionBreakdown[log.action_type] || 0) + 1;
    });

    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const time_spent =
      firstLog && lastLog ? (lastLog.timestamp - firstLog.timestamp) / 1000 / 60 : 0;

    const successfulActions = logs.filter(
      (l) =>
        l.action_type === 'case_approved' ||
        l.action_type === 'decision_made' ||
        l.action_type === 'calculation'
    ).length;

    return {
      totalActions: logs.length,
      actionBreakdown: actionBreakdown as Record<ActionType, number>,
      time_spent: Math.round(time_spent),
      successRate: logs.length > 0 ? (successfulActions / logs.length) * 100 : 0,
      lastActionTime: lastLog?.created_at || null,
    };
  }

  /**
   * Export logs as CSV for Ministry inspection
   */
  static async exportLogsAsCSV(student_id: string, course_id: string): Promise<string> {
    const logs = await this.getLogsForStudent(student_id, course_id, 10000);

    const headers = [
      'Sequence',
      'Date',
      'Time',
      'Action Type',
      'Description',
      'Metadata',
      'Integrity Hash',
      'Verified',
    ].join(',');

    const rows = logs.map((log) => {
      const date = new Date(log.timestamp);
      const verified = PracticeLogs.computeIntegrityHash(
        log.previous_hash,
        parseInt(student_id),
        parseInt(course_id),
        log.action_type,
        log.timestamp
      ) === log.integrity_hash ? 'YES' : 'NO';

      return [
        log.sequence_number,
        date.toISOString().split('T')[0],
        date.toISOString().split('T')[1],
        log.action_type,
        `"${log.description.replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`,
        log.integrity_hash,
        verified,
      ].join(',');
    });

    return [headers, ...rows].join('\n');
  }

  /**
   * Generate student certificate data (for PDF generation)
   */
  static async generateCertificateData(
    student_id: string,
    course_id: string,
    studentName: string,
    courseName: string
  ): Promise<any> {
    const stats = await this.getStudentStats(student_id, course_id);
    const integrity = await this.verifyLogIntegrity(student_id, course_id);

    return {
      studentName,
      courseName,
      completed_at: new Date().toISOString(),
      statistics: {
        totalActions: stats.totalActions,
        time_spent: stats.time_spent,
        successRate: Math.round(stats.successRate),
      },
      logIntegrity: {
        verified: integrity.isValid,
        totalLogs: integrity.details.totalLogs,
        invalidLogs: integrity.details.invalidLogs,
      },
      qrData: {
        student_id,
        course_id,
        timestamp: Date.now(),
        verificationUrl: `https://fepei.edu.ar/verify?student_id=${student_id}&course_id=${course_id}`,
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePracticeLogDto } from './dto/create-practice-log.dto';

/** Convert BigInt fields to strings for JSON serialization */
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  ));
}

@Injectable()
export class PracticeLogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute SHA-256 integrity hash for a practice log entry.
   * Hash includes previous_hash to create a linked-list chain.
   */
  static computeIntegrityHash(params: {
    previousHash: string | undefined;
    student_id: string;
    course_id: string;
    action_type: string;
    timestamp: number;
  }): string {
    const data = `${params.previousHash || ''}${params.student_id}${params.course_id}${params.action_type}${params.timestamp}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create a new practice log with integrity hash chain.
   */
  async create(dto: CreatePracticeLogDto) {
    // Get the last log for this student to compute chain
    const lastLog = await this.prisma.practiceLogs.findFirst({
      where: { student_id: dto.student_id },
      orderBy: { sequence_number: 'desc' },
    });

    const nextSequence = (lastLog?.sequence_number ?? 0) + 1;
    const previousHash = lastLog?.integrity_hash ?? undefined;
    const timestamp = Date.now();

    const integrityHash = PracticeLogsService.computeIntegrityHash({
      previousHash,
      student_id: dto.student_id,
      course_id: dto.course_id,
      action_type: dto.action_type,
      timestamp,
    });

    const created = await this.prisma.practiceLogs.create({
      data: {
        student_id: dto.student_id,
        course_id: dto.course_id,
        simulation_instance_id: dto.simulation_instance_id,
        action_type: dto.action_type,
        description: dto.description,
        metadata: dto.metadata as any,
        sequence_number: nextSequence,
        integrity_hash: integrityHash,
        previous_hash: previousHash ?? null,
        timestamp: BigInt(timestamp),
        docenter_notes: dto.docenter_notes,
      },
    });

    return serializeBigInt(created);
  }

  /**
   * List practice logs for a student in a course.
   */
  async findAll(student_id: string, course_id: string, limit = 100) {
    const logs = await this.prisma.practiceLogs.findMany({
      where: { student_id, course_id },
      orderBy: { sequence_number: 'asc' },
      take: limit,
    });

    return serializeBigInt(logs);
  }

  /**
   * Verify integrity of the hash chain for a student+course.
   */
  async verifyIntegrity(student_id: string, course_id: string) {
    const logs = await this.prisma.practiceLogs.findMany({
      where: { student_id, course_id },
      orderBy: { sequence_number: 'asc' },
    });

    const invalidLogs: string[] = [];
    let previousHash: string | undefined;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Verify previous_hash linkage
      if (log.previous_hash !== (previousHash ?? null)) {
        invalidLogs.push(`Log ${i + 1}: Chain broken (previous_hash mismatch)`);
      }

      // Recompute and verify hash
      const computedHash = PracticeLogsService.computeIntegrityHash({
        previousHash,
        student_id,
        course_id,
        action_type: log.action_type,
        timestamp: Number(log.timestamp),
      });

      if (computedHash !== log.integrity_hash) {
        invalidLogs.push(`Log ${i + 1}: Integrity verification failed`);
      }

      previousHash = log.integrity_hash;
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
   * Export logs as CSV with verified integrity column.
   */
  async exportCSV(student_id: string, course_id: string): Promise<string> {
    const logs = await this.prisma.practiceLogs.findMany({
      where: { student_id, course_id },
      orderBy: { sequence_number: 'asc' },
    });

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
      const date = new Date(Number(log.timestamp));
      const verified = PracticeLogsService.computeIntegrityHash({
        previousHash: log.previous_hash ?? undefined,
        student_id,
        course_id,
        action_type: log.action_type,
        timestamp: Number(log.timestamp),
      }) === log.integrity_hash
        ? 'YES'
        : 'NO';

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
}

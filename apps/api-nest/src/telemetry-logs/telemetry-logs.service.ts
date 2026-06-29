import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTelemetryLogDto } from './dto/create-telemetry-log.dto';

@Injectable()
export class TelemetryLogsService {
  constructor(private prisma: PrismaService) {}

  static computeIntegrityHash(params: {
    simulation_id: string;
    action: string;
    action_type: string;
    timestamp: number;
    previous_hash: string | null;
  }): string {
    const payload = [
      params.simulation_id,
      params.action,
      params.action_type,
      params.timestamp,
      params.previous_hash || 'genesis',
    ].join('|');
    return createHash('sha256').update(payload).digest('hex');
  }

  async create(dto: CreateTelemetryLogDto) {
    const lastLog = await this.prisma.telemetryLog.findFirst({
      where: { simulation_id: dto.simulation_id },
      orderBy: { created_at: 'desc' },
    });

    const timestamp = Date.now();
    const integrityHash = TelemetryLogsService.computeIntegrityHash({
      simulation_id: dto.simulation_id,
      action: dto.action,
      action_type: dto.action_type,
      timestamp,
      previous_hash: lastLog?.integrity_hash ?? null,
    });

    const created = await this.prisma.telemetryLog.create({
      data: {
        simulation_id: dto.simulation_id,
        user_id: dto.user_id,
        course_id: dto.course_id,
        action: dto.action,
        action_type: dto.action_type,
        response_time_ms: dto.response_time_ms,
        metadata: dto.metadata as any,
        integrity_hash: integrityHash,
      },
    });

    return JSON.parse(JSON.stringify(created, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ));
  }

  async findAll(params: { simulation_id?: string; user_id?: string; course_id?: string; action_type?: string }, limit = 100) {
    const where: any = {};
    if (params.simulation_id) where.simulation_id = params.simulation_id;
    if (params.user_id) where.user_id = params.user_id;
    if (params.course_id) where.course_id = params.course_id;
    if (params.action_type) where.action_type = params.action_type;

    const logs = await this.prisma.telemetryLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return JSON.parse(JSON.stringify(logs, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ));
  }

  async findOne(id: string) {
    const log = await this.prisma.telemetryLog.findUnique({ where: { id } });
    if (!log) return null;
    return JSON.parse(JSON.stringify(log, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ));
  }
}

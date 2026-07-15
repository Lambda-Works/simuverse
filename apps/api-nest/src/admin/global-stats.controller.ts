import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('global-stats')
export class GlobalStatsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getStats() {
    const prisma = this.prisma as any;
    const users = await prisma.user.groupBy({ by: ['role'], _count: true });
    return {
      users: users.map((u: any) => ({ role: u.role, count: u._count })),
      total_evaluations: 0,
      avg_score: '0',
      avg_minutes: 0,
      approval_rate: 0,
      completed_this_week: 0,
      top_courses: [],
      top_students: [],
    };
  }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('student-assignments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'teacher')
@Permissions('assignments.read')
export class StudentAssignmentsController {
  constructor(private prisma: PrismaService) {}

  @Get(':studentId')
  async findByStudent(@Param('studentId') studentId: string) {
    const assignments = await this.prisma.simulationAssignment.findMany({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
    });

    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const simulation = await this.prisma.simulation.findFirst({
          where: { student_id: studentId, course_id: a.course_id },
          orderBy: { started_at: 'desc' },
          select: { id: true, status: true, progress_percentage: true, score: true, started_at: true, completed_at: true },
        });

        const course = await this.prisma.course.findUnique({
          where: { id: a.course_id },
          select: { title: true, category: true },
        });

        const now = new Date();

        const calendarStatus = a.end_date && new Date(a.end_date) < now && a.status !== 'completed'
          ? 'expired'
          : a.start_date && new Date(a.start_date) > now
          ? 'upcoming'
          : a.status === 'completed' ? 'completed' : 'active';

        return {
          id: a.id,
          course_id: a.course_id,
          course_title: course?.title || '',
          category: course?.category || '',
          simulation_id: simulation?.id || null,
          instance_id: simulation?.id || null,
          status: a.status,
          calendar_status: calendarStatus,
          max_attempts: a.max_attempts || 1,
          attempts_used: a.attempts_used || 0,
          attempts_remaining: (a.max_attempts || 1) - (a.attempts_used || 0),
          overall_score: simulation?.score || null,
          progress: simulation?.progress_percentage || 0,
          start_date: a.start_date || a.created_at,
          end_date: a.end_date,
          started_at: simulation?.started_at || null,
          completed_at: simulation?.completed_at || null,
        };
      })
    );

    return enriched;
  }
}

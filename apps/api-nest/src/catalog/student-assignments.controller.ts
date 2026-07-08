import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('student-assignments')
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

        return {
          assignment_id: a.id,
          course_id: a.course_id,
          course_name: course?.title || '',
          category: course?.category || '',
          simulation_id: simulation?.id || null,
          instance_id: simulation?.id || null,
          status: a.status,
          max_attempts: a.max_attempts || 1,
          attempts_used: a.attempts_used || 0,
          score: simulation?.score || null,
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

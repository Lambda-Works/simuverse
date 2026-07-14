import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher', 'admin', 'ministerio')
@Controller('teacher/sessions')
export class TeacherSessionsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List simulation instances for courses/students visible to the teacher.
   * Teachers are limited to TeacherGroup students unless admin/ministerio.
   */
  @Get()
  async list(
    @CurrentUser() user: any,
    @Query('course_id') courseId?: string,
    @Query('student_id') studentId?: string,
  ) {
    const where: any = {};
    if (courseId) where.course_id = courseId;
    if (studentId) where.student_id = studentId;

    if (user?.role === 'teacher') {
      const links = await this.prisma.teacherGroup.findMany({
        where: { teacher_id: user.id },
        select: { student_id: true },
      });
      const studentIds = links.map((l) => l.student_id);
      if (studentIds.length === 0) return [];
      where.student_id = studentId
        ? studentId
        : { in: studentIds };
      if (studentId && !studentIds.includes(studentId)) {
        throw new ForbiddenException('Student not in your group');
      }
    }

    const instances = await this.prisma.simulationInstance.findMany({
      where,
      orderBy: { started_at: 'desc' },
      take: 200,
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        scenario: {
          select: {
            id: true,
            title: true,
            scenario_type: true,
            difficulty: true,
            agent_key: true,
            sequence_index: true,
          },
        },
      },
    });

    const withStats = await Promise.all(
      instances.map(async (inst) => {
        const turnCount = await this.prisma.simulationChatLog.count({
          where: { simulation_instance_id: inst.id },
        });
        return {
          id: inst.id,
          status: inst.status,
          score: inst.score,
          started_at: inst.started_at,
          completed_at: inst.completed_at,
          progress_percentage: inst.progress_percentage,
          student_id: inst.student_id,
          student_name: inst.student?.name,
          student_email: inst.student?.email,
          course_id: inst.course_id,
          course_title: inst.course?.title,
          scenario_title: inst.scenario?.title,
          scenario_type: inst.scenario?.scenario_type,
          difficulty: inst.scenario?.difficulty,
          agent_key: inst.scenario?.agent_key,
          sequence_index: inst.scenario?.sequence_index,
          total_turns: turnCount,
        };
      }),
    );

    return withStats;
  }

  @Get(':id')
  async detail(@Param('id') id: string, @CurrentUser() user: any) {
    const instance = await this.prisma.simulationInstance.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        scenario: true,
      },
    });
    if (!instance) {
      throw new NotFoundException('Session not found');
    }

    if (user?.role === 'teacher') {
      const link = await this.prisma.teacherGroup.findFirst({
        where: { teacher_id: user.id, student_id: instance.student_id },
      });
      if (!link) {
        throw new ForbiddenException('Student not in your group');
      }
    }

    const logs = await this.prisma.simulationChatLog.findMany({
      where: { simulation_instance_id: id },
      orderBy: { turn_number: 'asc' },
    });

    // Group messages by hour for teacher view
    const byHour: Record<string, typeof logs> = {};
    for (const log of logs) {
      const hourKey = new Date(log.created_at).toISOString().slice(0, 13) + ':00';
      if (!byHour[hourKey]) byHour[hourKey] = [];
      byHour[hourKey].push(log);
    }

    return {
      instance: {
        id: instance.id,
        status: instance.status,
        score: instance.score,
        started_at: instance.started_at,
        completed_at: instance.completed_at,
        progress_percentage: instance.progress_percentage,
        practice_summary: instance.practice_summary,
        student_name: instance.student?.name,
        student_email: instance.student?.email,
        student_id: instance.student_id,
        course_title: instance.course?.title,
        scenario_title: instance.scenario?.title,
        scenario_type: instance.scenario?.scenario_type,
        difficulty: instance.scenario?.difficulty,
        agent_key: instance.scenario?.agent_key,
      },
      logs: logs.map((l) => ({
        id: l.id,
        turn_number: l.turn_number,
        speaker: l.speaker,
        message: l.message,
        message_text: l.message,
        created_at: l.created_at,
        is_correct: l.is_correct,
        ref_number: l.ref_number,
      })),
      logs_by_hour: Object.entries(byHour)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, hourLogs]) => ({
          hour,
          messages: hourLogs.map((l) => ({
            id: l.id,
            turn_number: l.turn_number,
            speaker: l.speaker,
            message: l.message,
            created_at: l.created_at,
          })),
        })),
      summary: {
        total_turns: logs.length,
        student_turns: logs.filter((l) => l.speaker === 'student').length,
      },
    };
  }
}

import { Controller, Get, Param, Query, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Students can review their OWN simulation (the Eye button in the dashboard);
// teachers/admins/ministerio can review any. No @Permissions here so students
// aren't blocked by simulations.read — ownership is enforced in the handler.
@Controller('student-review')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'teacher', 'ministerio', 'student')
export class SimulationReviewController {
  constructor(private prisma: PrismaService) {}

  @Get(':instanceId')
  async review(
    @Param('instanceId') instanceId: string,
    @Query('student_id') studentId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const instance = await this.prisma.simulationInstance.findUnique({
      where: { id: instanceId },
      include: {
        scenario: true,
        course: {
          select: {
            title: true,
            category: true,
            teachers: { include: { teacher: { select: { name: true } } } },
          },
        },
        student: { select: { name: true, email: true } },
      },
    });
    if (!instance) throw new NotFoundException('Instance not found');

    // A student may only review their own simulation.
    if (user.role === 'student' && instance.student_id !== user.id) {
      throw new ForbiddenException('Solo podés revisar tus propias simulaciones');
    }

    const logs = await this.prisma.simulationChatLog.findMany({
      where: { simulation_instance_id: instanceId },
      orderBy: { turn_number: 'asc' },
    });

    const evaluation = await this.prisma.simulationEvaluation.findFirst({
      where: { student_id: studentId },
      orderBy: { evaluated_at: 'desc' },
    });

    return {
      instance,
      logs,
      evaluation: evaluation || null,
      scenario: instance.scenario,
    };
  }
}

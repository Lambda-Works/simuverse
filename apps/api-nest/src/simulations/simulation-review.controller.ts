import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('student-review')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'teacher')
@Permissions('simulations.read')
export class SimulationReviewController {
  constructor(private prisma: PrismaService) {}

  @Get(':instanceId')
  async review(
    @Param('instanceId') instanceId: string,
    @Query('student_id') studentId: string,
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

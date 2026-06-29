import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SimulationInstanceService {
  constructor(private prisma: PrismaService) {}

  async start(studentId: string, courseId: string, scenarioId: string) {
    // Check if student already has active instance for this scenario
    const existing = await this.prisma.simulationInstance.findFirst({
      where: {
        student_id: studentId,
        scenario_id: scenarioId,
        status: 'in_progress',
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.simulationInstance.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        scenario_id: scenarioId,
        status: 'in_progress',
        progress_percentage: 0,
        started_at: new Date(),
      },
    });
  }

  async findById(id: string) {
    const instance = await this.prisma.simulationInstance.findUnique({ where: { id } });
    if (!instance) {
      throw new NotFoundException('Simulation instance not found');
    }
    return instance;
  }

  async findByStudentAndCourse(studentId: string, courseId: string) {
    return this.prisma.simulationInstance.findMany({
      where: { student_id: studentId, course_id: courseId },
      orderBy: { started_at: 'desc' },
    });
  }

  async findActive(studentId: string, courseId: string) {
    return this.prisma.simulationInstance.findFirst({
      where: {
        student_id: studentId,
        course_id: courseId,
        status: 'in_progress',
      },
    });
  }

  async updateState(id: string, progressDelta: number) {
    const instance = await this.findById(id);

    const newProgress = Math.min(100, (instance.progress_percentage || 0) + progressDelta);

    return this.prisma.simulationInstance.update({
      where: { id },
      data: {
        progress_percentage: newProgress,
        updated_at: new Date(),
      },
    });
  }

  async pause(id: string) {
    await this.findById(id);
    return this.prisma.simulationInstance.update({
      where: { id },
      data: { status: 'paused' },
    });
  }

  async resume(id: string) {
    await this.findById(id);
    return this.prisma.simulationInstance.update({
      where: { id },
      data: { status: 'in_progress', updated_at: new Date() },
    });
  }

  async complete(id: string, score?: number) {
    await this.findById(id);
    return this.prisma.simulationInstance.update({
      where: { id },
      data: {
        status: 'completed',
        completed_at: new Date(),
        progress_percentage: 100,
        score: score ?? undefined,
      },
    });
  }

  async submitForReview(id: string) {
    await this.findById(id);
    return this.prisma.simulationInstance.update({
      where: { id },
      data: { status: 'submitted_for_review' },
    });
  }

  async fail(id: string, reason: string) {
    await this.findById(id);
    return this.prisma.simulationInstance.update({
      where: { id },
      data: {
        status: 'failed',
        feedback: reason,
      },
    });
  }
}

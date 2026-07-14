import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type SimulationStatus = 'active' | 'paused' | 'completed' | 'abandoned';

const VALID_TRANSITIONS: Record<SimulationStatus, SimulationStatus[]> = {
  active: ['paused', 'completed', 'abandoned'],
  paused: ['active', 'abandoned'],
  completed: [],
  abandoned: [],
};

@Injectable()
export class SimulationsService {
  constructor(private prisma: PrismaService) {}

  async create(studentId: string, courseId: string, scenarioId?: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.simulation.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        progress_percentage: 0,
        started_at: new Date(),
      },
    });
  }

  async findAll(userId?: string, role?: string) {
    if (role && role !== 'admin' && role !== 'teacher' && role !== 'ministerio') {
      throw new ForbiddenException('Only teachers and admins can list all simulations');
    }

    return this.prisma.simulation.findMany({
      take: 500,
      orderBy: { started_at: 'desc' } as any,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true, category: true } },
      },
    });
  }

  async findById(id: string) {
    const simulation = await this.prisma.simulation.findUnique({ where: { id } });
    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }
    return simulation;
  }

  async findByUserId(userId: string) {
    return this.prisma.simulation.findMany({
      where: { student_id: userId },
      orderBy: { started_at: 'desc' } as any,
      include: {
        course: { select: { title: true, category: true } },
      },
    });
  }

  async findByCourseId(courseId: string) {
    return this.prisma.simulation.findMany({
      where: { course_id: courseId },
      orderBy: { started_at: 'desc' } as any,
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }

  async transitionStatus(id: string, newStatus: SimulationStatus) {
    const simulation = await this.findById(id);

    const allowed = VALID_TRANSITIONS[simulation.status as SimulationStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${simulation.status} to ${newStatus}`,
      );
    }

    const updateData: any = { status: newStatus };

    if (newStatus === 'paused') {
      updateData.paused_at = new Date();
    }
    if (newStatus === 'completed') {
      updateData.completed_at = new Date();
      updateData.progress_percentage = 100;
    }
    if (newStatus === 'abandoned') {
      updateData.completed_at = new Date();
    }
    if (newStatus === 'active' && simulation.status === 'paused') {
      updateData.paused_at = null;
    }

    return this.prisma.simulation.update({
      where: { id },
      data: updateData,
    });
  }

  async pause(id: string) {
    return this.transitionStatus(id, 'paused');
  }

  async resume(id: string) {
    return this.transitionStatus(id, 'active');
  }

  async complete(id: string) {
    return this.transitionStatus(id, 'completed');
  }

  async abandon(id: string) {
    return this.transitionStatus(id, 'abandoned');
  }

  async getSimulationScenario(id: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id },
      include: { course: { include: { scenarios: true } } }
    });
    if (!simulation) throw new NotFoundException('Simulation not found');
    return simulation.course?.scenarios?.[0];
  }

  async getSimulationDocuments(id: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id }
    });
    if (!simulation) throw new NotFoundException('Simulation not found');
    const docs = await this.prisma.courseDocument.findMany({
      where: { course_id: simulation.course_id }
    });
    return docs.map(d => ({
      id: d.id,
      name: d.document_name,
      type: d.document_type,
      content: d.document_content,
    }));
  }

  async getSimulationConfig(id: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id }
    });
    if (!simulation) throw new NotFoundException('Simulation not found');
    return this.prisma.courseConfig.findUnique({
      where: { course_id: simulation.course_id }
    });
  }
}

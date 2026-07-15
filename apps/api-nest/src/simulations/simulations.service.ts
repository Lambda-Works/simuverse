import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PracticesService } from './practices.service';

type SimulationStatus = 'active' | 'paused' | 'completed' | 'abandoned';

const VALID_TRANSITIONS: Record<SimulationStatus, SimulationStatus[]> = {
  active: ['paused', 'completed', 'abandoned'],
  paused: ['active', 'abandoned'],
  completed: [],
  abandoned: [],
};

@Injectable()
export class SimulationsService {
  constructor(
    private prisma: PrismaService,
    private practices: PracticesService,
  ) {}

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
    const instance = await this.prisma.simulationInstance.findUnique({
      where: { id },
      include: { scenario: true, course: { include: { scenarios: true } } },
    });
    if (instance) {
      return instance.scenario || instance.course?.scenarios?.[0];
    }

    const simulation = await this.prisma.simulation.findUnique({
      where: { id },
      include: { course: { include: { scenarios: true } } },
    });
    if (!simulation) throw new NotFoundException('Simulation not found');
    return simulation.course?.scenarios?.[0];
  }

  async getSimulationDocuments(id: string) {
    const courseId = await this.resolveCourseId(id);
    const docs = await this.prisma.courseDocument.findMany({
      where: { course_id: courseId, is_active: true },
    });
    return docs.map((d) => ({
      id: d.id,
      name: d.document_name,
      type: d.document_type,
      url: d.file_url,
    }));
  }

  async getSimulationConfig(id: string) {
    const courseId = await this.resolveCourseId(id);
    return this.prisma.courseConfig.findUnique({
      where: { course_id: courseId },
    });
  }

  private async resolveCourseId(id: string): Promise<string> {
    const instance = await this.prisma.simulationInstance.findUnique({
      where: { id },
      select: { course_id: true },
    });
    if (instance) return instance.course_id;

    const simulation = await this.prisma.simulation.findUnique({
      where: { id },
      select: { course_id: true },
    });
    if (!simulation) throw new NotFoundException('Simulation not found');
    return simulation.course_id;
  }

  /**
   * Start a practice session via sequential practices flow.
   * Also keeps a Simulation row for legacy telemetry compatibility.
   */
  async create(studentId: string, courseId: string, scenarioId?: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const { instance, practice, resumed, prior_context } =
      await this.practices.startNextPractice(studentId, courseId, scenarioId);

    const simulation = await this.prisma.simulation.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        progress_percentage: 0,
        started_at: new Date(),
      },
    });

    return {
      ...simulation,
      instance_id: instance.id,
      scenario_id: practice.id,
      agent_key: practice.agent_key,
      session_id: instance.id,
      id: instance.id,
      legacy_simulation_id: simulation.id,
      practice: {
        id: practice.id,
        title: practice.title,
        agent_key: practice.agent_key,
        sequence_index: practice.sequence_index,
        difficulty: practice.difficulty,
        prior_context,
      },
      resumed,
    };
  }
}

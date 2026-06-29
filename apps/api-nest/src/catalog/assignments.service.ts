import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { student_id?: string; course_id?: string; status?: string }) {
    const where: any = {};
    if (filters?.student_id) where.student_id = filters.student_id;
    if (filters?.course_id) where.course_id = filters.course_id;
    if (filters?.status) where.status = filters.status;

    return this.prisma.simulationAssignment.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const assignment = await this.prisma.simulationAssignment.findUnique({
      where: { id },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  async create(dto: CreateAssignmentDto) {
    return this.prisma.simulationAssignment.create({
      data: {
        simulation_id: dto.simulation_id,
        student_id: dto.student_id,
        course_id: dto.course_id,
        assigned_by: dto.assigned_by,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        max_attempts: dto.max_attempts || 1,
        status: 'pending',
        attempts_used: 0,
      },
    });
  }

  async update(id: number, dto: UpdateAssignmentDto) {
    await this.findOne(id);
    return this.prisma.simulationAssignment.update({
      where: { id },
      data: {
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
        ...(dto.max_attempts && { max_attempts: dto.max_attempts }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.simulationAssignment.delete({ where: { id } });
    return { message: 'Assignment deleted successfully' };
  }

  async findByStudent(studentId: string) {
    return this.prisma.simulationAssignment.findMany({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.simulationAssignment.findMany({
      where: { course_id: courseId },
      orderBy: { created_at: 'desc' },
    });
  }
}

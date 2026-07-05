import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(isActive?: boolean) {
    const where = isActive !== undefined ? { is_active: isActive } : {};
    return this.prisma.course.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByCourseId(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { course_id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async create(data: {
    course_id: string;
    title: string;
    description?: string;
    category: string;
    modules?: any;
    ai_config?: any;
    eval_criteria?: any;
    crisis_events?: any;
    categories?: any;
    is_active?: boolean;
    simulated_company_id?: number;
    tech_sheet_id?: number;
    created_by?: string;
  }) {
    // Check if course_id already exists
    const existing = await this.prisma.course.findUnique({
      where: { course_id: data.course_id },
    });
    if (existing) {
      throw new ConflictException('Course ID already exists');
    }

    return this.prisma.course.create({
      data: {
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        category: data.category,
        modules: data.modules || undefined,
        ai_config: data.ai_config || undefined,
        eval_criteria: data.eval_criteria || undefined,
        crisis_events: data.crisis_events || undefined,
        categories: data.categories || undefined,
        is_active: data.is_active ?? true,
        simulated_company_id: data.simulated_company_id ?? undefined,
        tech_sheet_id: data.tech_sheet_id ?? undefined,
        created_by: data.created_by || undefined,
      },
    });
  }

  async update(courseId: string, data: {
    title?: string;
    description?: string;
    category?: string;
    modules?: any;
    ai_config?: any;
    eval_criteria?: any;
    crisis_events?: any;
    categories?: any;
    is_active?: boolean;
    simulated_company_id?: number;
    tech_sheet_id?: number;
    created_by?: string;
  }) {
    // Strip created_by — never overwrite original creator on update
    const { created_by, ...updateData } = data;

    try {
      return await this.prisma.course.update({
        where: { course_id: courseId },
        data: {
          ...updateData,
          modules: updateData.modules || undefined,
          ai_config: updateData.ai_config || undefined,
          eval_criteria: updateData.eval_criteria || undefined,
          crisis_events: updateData.crisis_events || undefined,
          categories: updateData.categories || undefined,
          simulated_company_id: updateData.simulated_company_id ?? undefined,
          tech_sheet_id: updateData.tech_sheet_id ?? undefined,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Course not found');
      }
      throw error;
    }
  }

  async remove(courseId: string) {
    // Soft delete — set is_active to false
    try {
      return await this.prisma.course.update({
        where: { course_id: courseId },
        data: { is_active: false },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Course not found');
      }
      throw error;
    }
  }
}

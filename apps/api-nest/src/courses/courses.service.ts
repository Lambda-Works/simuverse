import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const ENROLL_MAX_ATTEMPTS = 5;
const ENROLL_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private stripPassword<T extends { password_hash?: string | null }>(course: T) {
    const { password_hash, ...rest } = course as any;
    return {
      ...rest,
      requires_password: !!password_hash,
    };
  }

  async findAll(isActive?: boolean) {
    const where = isActive !== undefined ? { is_active: isActive } : {};
    const courses = await this.prisma.course.findMany({
      where,
      include: {
        teachers: {
          include: {
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return courses.map((c) => this.stripPassword(c));
  }

  async findByCourseId(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { course_id: courseId },
      include: {
        teachers: {
          include: {
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.stripPassword(course);
  }

  async findById(id: string) {
    let course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teachers: {
          include: {
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!course) {
      course = await this.prisma.course.findUnique({
        where: { course_id: id },
        include: {
          teachers: {
            include: {
              teacher: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    }
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.stripPassword(course);
  }

  async catalog(q?: string) {
    const courses = await this.prisma.course.findMany({
      where: { is_active: true },
      include: {
        teachers: {
          include: {
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    const needle = (q || '').trim().toLowerCase();
    const filtered = !needle
      ? courses
      : courses.filter((c) => {
          const titleMatch = c.title.toLowerCase().includes(needle);
          const teacherMatch = c.teachers.some(
            (t) =>
              t.teacher.name.toLowerCase().includes(needle) ||
              t.teacher.email.toLowerCase().includes(needle),
          );
          return titleMatch || teacherMatch;
        });

    return filtered.map((c) => ({
      id: c.id,
      course_id: c.course_id,
      title: c.title,
      description: c.description,
      category: c.category,
      requires_password: !!c.password_hash,
      teachers: c.teachers.map((t) => ({
        id: t.teacher.id,
        name: t.teacher.name,
        email: t.teacher.email,
      })),
    }));
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
    password?: string;
    teacher_ids?: string[];
  }) {
    const existing = await this.prisma.course.findUnique({
      where: { course_id: data.course_id },
    });
    if (existing) {
      throw new ConflictException('Course ID already exists');
    }

    const password_hash = data.password
      ? await bcrypt.hash(data.password, 10)
      : null;

    const course = await this.prisma.course.create({
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
        password_hash,
      },
    });

    if (data.teacher_ids?.length) {
      await this.setTeachers(course.id, data.teacher_ids);
      return this.findById(course.id);
    }

    return this.stripPassword({ ...course, teachers: [] });
  }

  async update(
    id: string,
    data: {
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
      password?: string | null;
      clear_password?: boolean;
      teacher_ids?: string[];
    },
    actor?: { id: string; role: string },
  ) {
    const { created_by, password, clear_password, teacher_ids, ...updateData } = data;

    if (actor && actor.role === 'teacher') {
      const isTeacher = await this.prisma.courseTeacher.findFirst({
        where: { course_id: id, teacher_id: actor.id },
      });
      if (!isTeacher) {
        throw new ForbiddenException('Not a teacher of this course');
      }
    }

    const passwordUpdate: { password_hash?: string | null } = {};
    if (clear_password) {
      passwordUpdate.password_hash = null;
    } else if (typeof password === 'string' && password.length > 0) {
      passwordUpdate.password_hash = await bcrypt.hash(password, 10);
    }

    try {
      const updated = await this.prisma.course.update({
        where: { id },
        data: {
          ...updateData,
          ...passwordUpdate,
          modules: updateData.modules || undefined,
          ai_config: updateData.ai_config || undefined,
          eval_criteria: updateData.eval_criteria || undefined,
          crisis_events: updateData.crisis_events || undefined,
          categories: updateData.categories || undefined,
          simulated_company_id: updateData.simulated_company_id ?? undefined,
          tech_sheet_id: updateData.tech_sheet_id ?? undefined,
        },
      });

      if (teacher_ids) {
        await this.setTeachers(id, teacher_ids);
        return this.findById(id);
      }

      return this.stripPassword({ ...updated, teachers: [] });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Course not found');
      }
      throw error;
    }
  }

  async setTeachers(courseId: string, teacherIds: string[]) {
    await this.prisma.courseTeacher.deleteMany({ where: { course_id: courseId } });
    if (!teacherIds.length) return;
    await this.prisma.courseTeacher.createMany({
      data: teacherIds.map((teacher_id) => ({
        course_id: courseId,
        teacher_id,
      })),
      skipDuplicates: true,
    });
  }

  async enroll(courseId: string, studentId: string, password?: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { course_id: courseId }],
        is_active: true,
      },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const since = new Date(Date.now() - ENROLL_WINDOW_MS);
    const recentFails = await this.prisma.enrollmentAttempt.count({
      where: {
        student_id: studentId,
        course_id: course.id,
        success: false,
        created_at: { gte: since },
      },
    });
    if (recentFails >= ENROLL_MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many enrollment attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const existing = await this.prisma.simulationAssignment.findFirst({
      where: { student_id: studentId, course_id: course.id },
    });
    if (existing) {
      return existing;
    }

    if (course.password_hash) {
      if (!password) {
        await this.prisma.enrollmentAttempt.create({
          data: { student_id: studentId, course_id: course.id, success: false },
        });
        throw new BadRequestException('Course password is required');
      }
      const ok = await bcrypt.compare(password, course.password_hash);
      if (!ok) {
        await this.prisma.enrollmentAttempt.create({
          data: { student_id: studentId, course_id: course.id, success: false },
        });
        throw new ForbiddenException('Incorrect course password');
      }
    }

    const assignment = await this.prisma.simulationAssignment.create({
      data: {
        simulation_id: `self-${Date.now()}`,
        student_id: studentId,
        course_id: course.id,
        assigned_by: studentId,
        status: 'pending',
      },
    });

    await this.prisma.enrollmentAttempt.create({
      data: { student_id: studentId, course_id: course.id, success: true },
    });

    return assignment;
  }

  async remove(id: string) {
    try {
      return await this.prisma.course.update({
        where: { id },
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

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
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const ENROLL_MAX_ATTEMPTS = 5;
const ENROLL_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private stripPassword<T extends { password_hash?: string | null }>(
    course: T,
    extras?: { password_plain?: string },
  ) {
    const { password_hash, ...rest } = course as any;
    return {
      ...rest,
      requires_password: !!password_hash,
      ...(extras?.password_plain ? { password_plain: extras.password_plain } : {}),
    };
  }

  /** Generate a readable enrollment password (no ambiguous chars). */
  generateEnrollmentPassword(length = 10): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
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
    drive_folder_url?: string | null;
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

    const modules = Array.isArray(data.modules)
      ? data.modules.filter((m: string) => m !== 'evaluacion_auto')
      : data.modules;

    const course = await this.prisma.course.create({
      data: {
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        category: data.category,
        modules: modules || undefined,
        // IA / ficha técnica se configuran desde la ficha ministerial, no en create de curso
        eval_criteria: data.eval_criteria || undefined,
        crisis_events: data.crisis_events || undefined,
        categories: data.categories || undefined,
        is_active: data.is_active ?? true,
        simulated_company_id: data.simulated_company_id ?? undefined,
        created_by: data.created_by || undefined,
        password_hash,
        drive_folder_url: data.drive_folder_url || null,
      },
    });

    if (data.teacher_ids?.length) {
      await this.setTeachers(course.id, data.teacher_ids);
      const full = await this.findById(course.id);
      return data.password
        ? { ...full, password_plain: data.password }
        : full;
    }

    return this.stripPassword(
      { ...course, teachers: [] },
      data.password ? { password_plain: data.password } : undefined,
    );
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
      drive_folder_url?: string | null;
      teacher_ids?: string[];
    },
    actor?: { id: string; role: string },
  ) {
    const { created_by, password, clear_password, teacher_ids, ...rawUpdate } = data;
    // IA / ficha / evaluación auto no se editan desde el formulario de curso
    const {
      ai_config: _aiConfig,
      tech_sheet_id: _techSheetId,
      ...restUpdate
    } = rawUpdate as typeof rawUpdate & { ai_config?: unknown; tech_sheet_id?: unknown };
    const updateData = {
      ...restUpdate,
      modules: Array.isArray(restUpdate.modules)
        ? restUpdate.modules.filter((m: string) => m !== 'evaluacion_auto')
        : restUpdate.modules,
    };

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
          eval_criteria: updateData.eval_criteria || undefined,
          crisis_events: updateData.crisis_events || undefined,
          categories: updateData.categories || undefined,
          simulated_company_id: updateData.simulated_company_id ?? undefined,
          drive_folder_url:
            updateData.drive_folder_url === undefined
              ? undefined
              : updateData.drive_folder_url || null,
        },
      });

      if (teacher_ids) {
        await this.setTeachers(id, teacher_ids);
        const full = await this.findById(id);
        return typeof password === 'string' && password.length > 0
          ? { ...full, password_plain: password }
          : full;
      }

      return this.stripPassword(
        { ...updated, teachers: [] },
        typeof password === 'string' && password.length > 0
          ? { password_plain: password }
          : undefined,
      );
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Course not found');
      }
      throw error;
    }
  }

  async regeneratePassword(id: string, actor?: { id: string; role: string }) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (actor && actor.role === 'teacher') {
      const isTeacher = await this.prisma.courseTeacher.findFirst({
        where: { course_id: id, teacher_id: actor.id },
      });
      if (!isTeacher) {
        throw new ForbiddenException('Not a teacher of this course');
      }
    }

    const password_plain = this.generateEnrollmentPassword();
    const password_hash = await bcrypt.hash(password_plain, 10);
    const updated = await this.prisma.course.update({
      where: { id },
      data: { password_hash },
    });

    return this.stripPassword(
      { ...updated, teachers: [] },
      { password_plain },
    );
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

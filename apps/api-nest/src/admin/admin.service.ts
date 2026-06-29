import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TEACHER_PERMISSIONS = {
  can_see_ai_config: false,
  can_see_system_prompt: false,
  can_see_temperature: false,
  can_see_score_calculation: false,
};

@Injectable()
export class AdminService {
  private teacherPermissions = { ...DEFAULT_TEACHER_PERMISSIONS };

  constructor(private prisma: PrismaService) {}

  // ── Teacher Permissions ────────────────────────────────────────

  async getTeacherPermissions() {
    return this.teacherPermissions;
  }

  async updateTeacherPermissions(permissions: Record<string, boolean>) {
    const updated: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(permissions)) {
      if (
        key in DEFAULT_TEACHER_PERMISSIONS &&
        typeof value === 'boolean'
      ) {
        this.teacherPermissions[key] = value;
        updated[key] = value;
      }
    }

    return { ...this.teacherPermissions, _updated: updated };
  }

  // ── System Stats ───────────────────────────────────────────────

  async getSystemStats() {
    const [
      totalUsers,
      totalCourses,
      totalSimulations,
      totalScenarios,
      totalAssessments,
      activeSimulations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.simulation.count(),
      this.prisma.scenario.count(),
      this.prisma.assessment.count(),
      this.prisma.simulation.count({ where: { status: 'active' } }),
    ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    const coursesByCategory = await this.prisma.course.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    return {
      total_users: totalUsers,
      total_courses: totalCourses,
      total_simulations: totalSimulations,
      total_scenarios: totalScenarios,
      total_assessments: totalAssessments,
      active_simulations: activeSimulations,
      users_by_role: usersByRole.map((r) => ({ role: r.role, count: r._count.id })),
      courses_by_category: coursesByCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
    };
  }

  // ── Roles & Functionalities ────────────────────────────────────

  async getRoles() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  async createRole(data: { name: string; description?: string; color?: string }) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description || '',
        color: data.color || '#6366f1',
      },
    });
  }

  async updateRole(id: number, data: { name?: string; description?: string; color?: string; is_active?: boolean }) {
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color && { color: data.color }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });
  }

  async removeRole(id: number) {
    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  }

  async getFunctionalities() {
    return this.prisma.systemFunctionality.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });
  }

  async createFunctionality(data: {
    name: string;
    description?: string;
    module?: string;
    icon?: string;
    route?: string;
  }) {
    return this.prisma.systemFunctionality.create({
      data: {
        name: data.name,
        description: data.description || '',
        module: data.module || 'other',
        icon: data.icon || '',
        route: data.route || '',
      },
    });
  }

  async updateFunctionality(id: number, data: {
    name?: string;
    description?: string;
    module?: string;
    icon?: string;
    route?: string;
    is_active?: boolean;
  }) {
    return this.prisma.systemFunctionality.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.module && { module: data.module }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.route !== undefined && { route: data.route }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });
  }

  async removeFunctionality(id: number) {
    await this.prisma.systemFunctionality.delete({ where: { id } });
    return { message: 'Functionality deleted successfully' };
  }

  // ── Role Permissions (ON CONFLICT upsert) ─────────────────────────

  async getRolePermissions(roleName: string) {
    return (this.prisma.rolePermission as any).findMany({
      where: { role_name: roleName },
      include: { functionality: true },
    });
  }

  async upsertRolePermission(data: {
    role_name: string;
    functionality_id: number;
    enabled: boolean;
  }) {
    return this.prisma.rolePermission.upsert({
      where: {
        role_name_functionality_id: {
          role_name: data.role_name,
          functionality_id: data.functionality_id,
        },
      },
      update: { enabled: data.enabled },
      create: {
        role_name: data.role_name,
        functionality_id: data.functionality_id,
        enabled: data.enabled,
      },
    });
  }

  async bulkUpsertRolePermissions(
    roleName: string,
    permissions: Array<{ functionality_id: number; enabled: boolean }>,
  ) {
    const results: any[] = [];
    for (const perm of permissions) {
      const result = await this.prisma.rolePermission.upsert({
        where: {
          role_name_functionality_id: {
            role_name: roleName,
            functionality_id: perm.functionality_id,
          },
        },
        update: { enabled: perm.enabled },
        create: {
          role_name: roleName,
          functionality_id: perm.functionality_id,
          enabled: perm.enabled,
        },
      });
      results.push(result);
    }
    return results;
  }
}

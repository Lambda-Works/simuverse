import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

const DEFAULT_TEACHER_PERMISSIONS = {
  can_see_ai_config: false,
  can_see_system_prompt: false,
  can_see_temperature: false,
  can_see_score_calculation: false,
};

@Injectable()
export class AdminService {
  private teacherPermissions = { ...DEFAULT_TEACHER_PERMISSIONS };

  constructor(
    private prisma: PrismaService,
    private rbacService: RbacService,
  ) {}

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
  // Delegated to RbacService for single source of truth

  async getRoles() {
    return this.rbacService.listRoles();
  }

  async createRole(data: { name: string; description?: string; color?: string }) {
    return this.rbacService.createRole({
      name: data.name,
      description: data.description || '',
      color: data.color,
    });
  }

  async updateRole(id: number, data: { name?: string; description?: string; color?: string; is_active?: boolean }) {
    return this.rbacService.updateRole(id, {
      description: data.description,
      color: data.color,
      is_active: data.is_active,
    });
  }

  async removeRole(id: number) {
    return this.rbacService.deleteRole(id);
  }

  async reactivateRole(id: number) {
    return this.rbacService.updateRole(id, { is_active: true });
  }

  async getFunctionalities() {
    return this.rbacService.listFunctionalities();
  }

  async createFunctionality(data: {
    name: string;
    code?: string;
    description?: string;
    module?: string;
    icon?: string;
    route?: string;
  }) {
    return this.rbacService.createFunctionality({
      name: data.name,
      code: data.code || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, ''),
      description: data.description || '',
      module: data.module || 'other',
      icon: data.icon || '',
      route: data.route || '',
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
    return this.rbacService.updateFunctionality(id, {
      name: data.name,
      description: data.description,
      module: data.module,
      icon: data.icon,
      route: data.route,
      is_active: data.is_active,
    });
  }

  async removeFunctionality(id: number) {
    return this.rbacService.deleteFunctionality(id);
  }

  async reactivateFunctionality(id: number) {
    return this.rbacService.updateFunctionality(id, { is_active: true });
  }

  // ── Role Permissions ──────────────────────────────────────────────

  async getRolePermissions(roleName: string) {
    return this.rbacService.getRolePermissionsWithFunctionalities(roleName);
  }

  async upsertRolePermission(data: {
    role_name: string;
    functionality_id: number;
    enabled: boolean;
  }) {
    return this.rbacService.assignPermission({
      role_name: data.role_name,
      functionality_id: data.functionality_id,
      enabled: data.enabled,
    });
  }

  async bulkUpsertRolePermissions(
    roleName: string,
    permissions: Array<{ functionality_id: number; enabled: boolean }>,
  ) {
    return this.rbacService.bulkUpsertRolePermissions(roleName, permissions);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreateFunctionalityDto,
  UpdateFunctionalityDto,
  AssignPermissionDto,
} from './dto/rbac.dto';

@Injectable()
export class RbacService {
  private permissionCache = new Map<
    string,
    { enabled: boolean; timestamp: number }
  >();
  private readonly CACHE_TTL_MS = 60_000;

  constructor(private prisma: PrismaService) {}

  // ── Roles ──────────────────────────────────────────────────────────

  async createRole(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        is_active: true,
      },
    });
  }

  async listRoles() {
    return this.prisma.role.findMany({ orderBy: { created_at: 'desc' } });
  }

  async getRole(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    await this.getRole(id);
    const data: any = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    return this.prisma.role.update({ where: { id }, data });
  }

  async deleteRole(id: number) {
    await this.getRole(id);
    await this.prisma.role.update({ where: { id }, data: { is_active: false } });
    return { message: 'Role deactivated' };
  }

  // ── System Functionalities ─────────────────────────────────────────

  async createFunctionality(dto: CreateFunctionalityDto) {
    return this.prisma.systemFunctionality.create({
      data: {
        name: dto.name,
        description: dto.description,
        module: dto.module,
        icon: dto.icon,
        route: dto.route,
        is_active: true,
      },
    });
  }

  async listFunctionalities() {
    return this.prisma.systemFunctionality.findMany({ orderBy: { created_at: 'desc' } });
  }

  async getFunctionality(id: number) {
    const func = await this.prisma.systemFunctionality.findUnique({ where: { id } });
    if (!func) throw new NotFoundException('Functionality not found');
    return func;
  }

  async updateFunctionality(id: number, dto: UpdateFunctionalityDto) {
    await this.getFunctionality(id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.module !== undefined) data.module = dto.module;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.route !== undefined) data.route = dto.route;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    return this.prisma.systemFunctionality.update({ where: { id }, data });
  }

  async deleteFunctionality(id: number) {
    await this.getFunctionality(id);
    await this.prisma.systemFunctionality.update({ where: { id }, data: { is_active: false } });
    return { message: 'Functionality deactivated' };
  }

  // ── Role Permissions ───────────────────────────────────────────────

  async assignPermission(dto: AssignPermissionDto) {
    const result = await this.prisma.rolePermission.upsert({
      where: {
        role_name_functionality_id: {
          role_name: dto.role_name,
          functionality_id: dto.functionality_id,
        },
      },
      create: {
        role_name: dto.role_name,
        functionality_id: dto.functionality_id,
        enabled: dto.enabled ?? true,
      },
      update: {
        enabled: dto.enabled ?? true,
      },
    });
    this.invalidatePermissionCache(dto.role_name);
    return result;
  }

  async listPermissions(roleName?: string) {
    const where: any = {};
    if (roleName) where.role_name = roleName;
    return this.prisma.rolePermission.findMany({ where });
  }

  async revokePermission(id: number) {
    const perm = await this.prisma.rolePermission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    await this.prisma.rolePermission.delete({ where: { id } });
    this.invalidatePermissionCache(perm.role_name);
    return { message: 'Permission revoked successfully' };
  }

  // ── Permission Check ─────────────────────────────────────────────

  async hasPermission(
    roleName: string,
    functionalityName: string,
  ): Promise<boolean> {
    const cacheKey = `${roleName}:${functionalityName}`;
    const cached = this.permissionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.enabled;
    }

    // Look up functionality_id by name first, then check permission
    const func = await this.prisma.systemFunctionality.findFirst({
      where: { name: functionalityName },
      select: { id: true },
    });

    if (!func) {
      this.permissionCache.set(cacheKey, { enabled: false, timestamp: Date.now() });
      return false;
    }

    const result = await this.prisma.rolePermission.findFirst({
      where: {
        role_name: roleName,
        functionality_id: func.id,
        enabled: true,
      },
      select: { enabled: true },
    });

    const enabled = result?.enabled ?? false;
    this.permissionCache.set(cacheKey, { enabled, timestamp: Date.now() });
    return enabled;
  }

  async hasPermissions(
    roleName: string,
    codes: string[],
  ): Promise<boolean> {
    for (const code of codes) {
      if (!(await this.hasPermission(roleName, code))) {
        return false;
      }
    }
    return true;
  }

  invalidatePermissionCache(roleName?: string): void {
    if (roleName) {
      for (const key of this.permissionCache.keys()) {
        if (key.startsWith(`${roleName}:`)) {
          this.permissionCache.delete(key);
        }
      }
    } else {
      this.permissionCache.clear();
    }
  }

  // ── Catalog-compatible role permission queries ──────────────────

  async getRolePermissionsWithFunctionalities(roleName: string) {
    return (this.prisma.rolePermission as any).findMany({
      where: { role_name: roleName },
      include: { functionality: true },
    });
  }

  async getRolePermissionsFlat(roleName: string) {
    return this.prisma.$queryRaw`
      SELECT sf.id AS functionality_id, sf.name, sf.description, sf.module, sf.icon,
             COALESCE(rp.enabled, false) AS enabled
      FROM system_functionalities sf
      LEFT JOIN role_permissions rp ON rp.functionality_id = sf.id AND rp.role_name = ${roleName}
      WHERE sf.is_active = true
      ORDER BY sf.module ASC, sf.name ASC
    `;
  }

  async bulkUpsertRolePermissions(
    roleName: string,
    permissions: Array<{ functionality_id: number; enabled: boolean | number }>,
  ) {
    const results: any[] = [];
    for (const perm of permissions) {
      const isEnabled = Boolean(perm.enabled);
      const result = await this.prisma.rolePermission.upsert({
        where: {
          role_name_functionality_id: {
            role_name: roleName,
            functionality_id: perm.functionality_id,
          },
        },
        update: { enabled: isEnabled },
        create: {
          role_name: roleName,
          functionality_id: perm.functionality_id,
          enabled: isEnabled,
        },
      });
      results.push(result);
    }
    this.invalidatePermissionCache(roleName);
    return { updated: results.length };
  }
}

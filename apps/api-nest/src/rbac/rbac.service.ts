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
    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
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
    await this.prisma.systemFunctionality.delete({ where: { id } });
    return { message: 'Functionality deleted successfully' };
  }

  // ── Role Permissions ───────────────────────────────────────────────

  async assignPermission(dto: AssignPermissionDto) {
    return this.prisma.rolePermission.upsert({
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
    return { message: 'Permission revoked successfully' };
  }
}

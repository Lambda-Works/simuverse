import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreateFunctionalityDto,
  UpdateFunctionalityDto,
  AssignPermissionDto,
} from './dto/rbac.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private rbacService: RbacService) {}

  // ── Roles ──────────────────────────────────────────────────────────

  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Get('roles')
  async listRoles() {
    return this.rbacService.listRoles();
  }

  @Get('roles/:id')
  async getRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getRole(id);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.OK)
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.deleteRole(id);
  }

  // ── System Functionalities ─────────────────────────────────────────

  @Post('functionalities')
  async createFunctionality(@Body() dto: CreateFunctionalityDto) {
    return this.rbacService.createFunctionality(dto);
  }

  @Get('functionalities')
  async listFunctionalities() {
    return this.rbacService.listFunctionalities();
  }

  @Get('functionalities/:id')
  async getFunctionality(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getFunctionality(id);
  }

  @Put('functionalities/:id')
  async updateFunctionality(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFunctionalityDto,
  ) {
    return this.rbacService.updateFunctionality(id, dto);
  }

  @Delete('functionalities/:id')
  @HttpCode(HttpStatus.OK)
  async deleteFunctionality(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.deleteFunctionality(id);
  }

  // ── Role Permissions ───────────────────────────────────────────────

  @Post('permissions')
  async assignPermission(@Body() dto: AssignPermissionDto) {
    return this.rbacService.assignPermission(dto);
  }

  @Get('permissions')
  async listPermissions(@Query('role_name') role_name?: string) {
    return this.rbacService.listPermissions(role_name);
  }

  @Delete('permissions/:id')
  @HttpCode(HttpStatus.OK)
  async revokePermission(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.revokePermission(id);
  }
}

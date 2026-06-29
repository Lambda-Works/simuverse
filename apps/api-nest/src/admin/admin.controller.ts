import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Teacher Permissions ────────────────────────────────────────

  @Get('teacher-permissions')
  async getTeacherPermissions() {
    return this.adminService.getTeacherPermissions();
  }

  @Put('teacher-permissions')
  async updateTeacherPermissions(
    @Body() body: Record<string, boolean>,
  ) {
    return this.adminService.updateTeacherPermissions(body);
  }

  // ── System Stats ───────────────────────────────────────────────

  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  // ── Roles ──────────────────────────────────────────────────────

  @Get('roles')
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  async createRole(
    @Body() body: { name: string; description?: string; color?: string },
  ) {
    return this.adminService.createRole(body);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string; color?: string; is_active?: boolean },
  ) {
    return this.adminService.updateRole(id, body);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.OK)
  async removeRole(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeRole(id);
  }

  // ── Functionalities ────────────────────────────────────────────

  @Get('functionalities')
  async getFunctionalities() {
    return this.adminService.getFunctionalities();
  }

  @Post('functionalities')
  async createFunctionality(
    @Body() body: { name: string; description?: string; module?: string; icon?: string; route?: string },
  ) {
    return this.adminService.createFunctionality(body);
  }

  @Put('functionalities/:id')
  async updateFunctionality(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string; module?: string; icon?: string; route?: string; is_active?: boolean },
  ) {
    return this.adminService.updateFunctionality(id, body);
  }

  @Delete('functionalities/:id')
  @HttpCode(HttpStatus.OK)
  async removeFunctionality(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeFunctionality(id);
  }
}

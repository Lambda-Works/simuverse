import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CatalogQueryService } from './catalog-query.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller()
@UseGuards(RolesGuard, PermissionsGuard)
export class CatalogQueryController {
  constructor(private queryService: CatalogQueryService) {}

  @Get('evaluations/student/all')
  async findAllEvaluations(
    @Query('course_id') courseId?: string,
    @Query('student_id') studentId?: string,
    @CurrentUser() user?: any,
  ) {
    let resolvedStudentId = studentId;
    if (user?.role === 'student') {
      resolvedStudentId = user.id;
    }
    return this.queryService.findAllEvaluations({
      course_id: courseId,
      student_id: resolvedStudentId,
    });
  }

  @Get('evaluations/:simulationId')
  async findEvaluationsBySimulation(
    @Param('simulationId') simulationId: string,
  ) {
    return this.queryService.findEvaluationsBySimulation(simulationId);
  }

  @Get('students/:studentId/history')
  async findStudentHistory(
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    if (user?.role === 'student' && studentId !== user.id) {
      throw new ForbiddenException('You can only view your own history');
    }
    const result = await this.queryService.findStudentHistory(studentId);
    if (!result) {
      return { error: 'Student not found' };
    }
    return result;
  }

  @Get('role-permissions')
  @Roles('admin', 'teacher')
  async getRolePermissions(@Query('role_name') roleName: string) {
    return this.queryService.getRolePermissions(roleName);
  }

  @Put('role-permissions')
  @Roles('admin')
  @Permissions('rbac.manage')
  async upsertRolePermissions(
    @Body() body: { role_name: string; permissions: { functionality_id: number; enabled: boolean | number }[] },
  ) {
    return this.queryService.upsertRolePermissions(body.role_name, body.permissions);
  }
}

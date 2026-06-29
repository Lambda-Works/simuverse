import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CatalogQueryService } from './catalog-query.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CatalogQueryController {
  constructor(private queryService: CatalogQueryService) {}

  @Get('evaluations/student/all')
  async findAllEvaluations(
    @Query('course_id') courseId?: string,
    @Query('student_id') studentId?: string,
  ) {
    return this.queryService.findAllEvaluations({
      course_id: courseId,
      student_id: studentId,
    });
  }

  @Get('evaluations/:simulationId')
  async findEvaluationsBySimulation(
    @Param('simulationId') simulationId: string,
  ) {
    return this.queryService.findEvaluationsBySimulation(simulationId);
  }

  @Get('students/:studentId/history')
  async findStudentHistory(@Param('studentId') studentId: string) {
    const result = await this.queryService.findStudentHistory(studentId);
    if (!result) {
      return { error: 'Student not found' };
    }
    return result;
  }

  @Get('role-permissions')
  async getRolePermissions(@Query('role_name') roleName: string) {
    return this.queryService.getRolePermissions(roleName);
  }

  @Put('role-permissions')
  async upsertRolePermissions(
    @Body() body: { role_name: string; permissions: { functionality_id: number; enabled: boolean }[] },
  ) {
    return this.queryService.upsertRolePermissions(body.role_name, body.permissions);
  }
}

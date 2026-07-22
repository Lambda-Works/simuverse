import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('scenarios')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'teacher')
@Permissions('scenarios.read')
export class ScenariosController {
  constructor(private scenariosService: ScenariosService) {}

  @Get()
  async findAll(
    @Query('course_id') courseId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('scenario_type') scenarioType?: string,
    @Query('active') active?: string,
  ) {
    return this.scenariosService.findAll({
      course_id: courseId,
      difficulty,
      scenario_type: scenarioType,
      active: active === undefined ? undefined : active === 'true',
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.scenariosService.findById(id);
  }

  @Post()
  @Permissions('scenarios.manage')
  async create(@Body() dto: CreateScenarioDto) {
    return this.scenariosService.create(dto);
  }

  @Put(':id')
  @Permissions('scenarios.manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    return this.scenariosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('scenarios.manage')
  async remove(@Param('id') id: string) {
    await this.scenariosService.remove(id);
    return { message: 'Scenario deactivated successfully' };
  }
}

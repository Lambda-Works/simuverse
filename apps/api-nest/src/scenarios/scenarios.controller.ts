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

@Controller('scenarios')
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
  async create(@Body() dto: CreateScenarioDto) {
    return this.scenariosService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    return this.scenariosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.scenariosService.remove(id);
    return { message: 'Scenario deactivated successfully' };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TelemetryLogsService } from './telemetry-logs.service';
import { CreateTelemetryLogDto } from './dto/create-telemetry-log.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('telemetry-logs')
@UseGuards(JwtAuthGuard)
export class TelemetryLogsController {
  constructor(private telemetryLogsService: TelemetryLogsService) {}

  @Post()
  async create(@Body() dto: CreateTelemetryLogDto) {
    return this.telemetryLogsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('simulation_id') simulation_id?: string,
    @Query('user_id') user_id?: string,
    @Query('course_id') course_id?: string,
    @Query('action_type') action_type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.telemetryLogsService.findAll(
      { simulation_id, user_id, course_id, action_type },
      limit ? parseInt(limit) : 100,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.telemetryLogsService.findOne(id);
  }
}

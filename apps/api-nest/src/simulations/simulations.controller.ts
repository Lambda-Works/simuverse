import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { SimulationInstanceService } from './simulation-instance.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('simulations')
export class SimulationsController {
  constructor(
    private simulationsService: SimulationsService,
    private instanceService: SimulationInstanceService,
  ) {}

  // ─── Lifecycle endpoints ───────────────────────────────────────────────

  @Post('start')
  async start(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSimulationDto,
  ) {
    return this.simulationsService.create(userId, dto.course_id, dto.scenario_id);
  }

  @Get()
  async findAll(@CurrentUser() user?: any) {
    return this.simulationsService.findAll(user?.sub, user?.role);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.simulationsService.findByUserId(userId);
  }

  @Get('course/:courseId')
  async findByCourseId(@Param('courseId') courseId: string) {
    return this.simulationsService.findByCourseId(courseId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.simulationsService.findById(id);
  }

  @Put(':id/pause')
  @HttpCode(HttpStatus.OK)
  async pause(@Param('id') id: string) {
    return this.simulationsService.pause(id);
  }

  @Put(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(@Param('id') id: string) {
    return this.simulationsService.resume(id);
  }

  @Put(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Param('id') id: string) {
    return this.simulationsService.complete(id);
  }

  @Put(':id/abandon')
  @HttpCode(HttpStatus.OK)
  async abandon(@Param('id') id: string) {
    return this.simulationsService.abandon(id);
  }

  // ─── Instance endpoints ────────────────────────────────────────────────

  @Post('instances/start')
  async startInstance(
    @CurrentUser('sub') userId: string,
    @Body() body: { course_id: string; scenario_id: string },
  ) {
    return this.instanceService.start(userId, body.course_id, body.scenario_id);
  }

  // ─── Simulation detail endpoints (Express compat) ──────────────────────

  @Get(':id/emails')
  async getEmails(@Param('id') id: string) { return []; }

  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) { return []; }

  @Get(':id/spreadsheet')
  async getSpreadsheet(@Param('id') id: string) { return {}; }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) { return []; }

  @Post(':id/message')
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return { id, message: dto.message, response: 'OK' };
  }

  @Post(':id/evaluate')
  async evaluate(@Param('id') id: string) {
    return { score: 0, passed: false };
  }
}

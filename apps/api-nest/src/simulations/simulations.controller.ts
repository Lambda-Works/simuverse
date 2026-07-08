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

import { AIService } from './ai/ai.service';
import { CrisisEngine } from './engines/crisis-engine.service';

@UseGuards(JwtAuthGuard)
@Controller('simulations')
export class SimulationsController {
  constructor(
    private simulationsService: SimulationsService,
    private instanceService: SimulationInstanceService,
    private aiService: AIService,
    private crisisEngine: CrisisEngine,
  ) {}

  // ─── Lifecycle endpoints ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('start')
  async start(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSimulationDto,
  ) {
    return this.simulationsService.create(userId, dto.course_id, dto.scenario_id);
  }

  @Get()
  async findAll(@CurrentUser() user?: any) {
    return this.simulationsService.findAll(user?.id, user?.role);
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
    @CurrentUser('id') userId: string,
    @Body() body: { course_id: string; scenario_id: string },
  ) {
    return this.instanceService.start(userId, body.course_id, body.scenario_id);
  }

  // ─── Simulation detail endpoints (Express compat) ──────────────────────

  @Get(':id/emails')
  async getEmails(@Param('id') id: string) { 
    const scenario = await this.simulationsService.getSimulationScenario(id);
    return (scenario?.content as any)?.emails || [];
  }

  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) { 
    return this.simulationsService.getSimulationDocuments(id);
  }

  @Get(':id/spreadsheet')
  async getSpreadsheet(@Param('id') id: string) { 
    const scenario = await this.simulationsService.getSimulationScenario(id);
    return (scenario?.content as any)?.spreadsheet || {};
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) { return []; }

  @Post(':id/message')
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    const config = await this.simulationsService.getSimulationConfig(id);
    const scenario = await this.simulationsService.getSimulationScenario(id);

    const systemPrompt = this.aiService.buildSystemPrompt({
      base_role: config?.base_role || 'Eres un asistente.',
      course_context: config?.course_context || '',
      knowledge_base: config?.knowledge_base_prompt || '',
      personality_traits: (config?.personality_traits as string[]) || [],
      student_history: [],
    });

    const fallbackCtx = {
      scenarioContext: scenario?.description || '',
      base_role: config?.base_role || '',
      course_context: config?.course_context || ''
    };

    const aiResponse = await this.aiService.sendMessageToGemini(
      dto.message,
      systemPrompt,
      [],
      fallbackCtx
    );

    return { id, message: dto.message, response: aiResponse.response };
  }
  
  @Post(':id/crisis/get')
  async getCrisis(@Param('id') id: string) {
    const config = await this.simulationsService.getSimulationConfig(id);
    const familyType = config?.family_type || 'administracion';
    return this.crisisEngine.getOrCreateCrisis(id, familyType);
  }

  @Post(':id/crisis/resolve')
  async resolveCrisis(@Param('id') id: string, @Body('optionId') optionId: string) {
    return this.crisisEngine.resolveCrisis(id, optionId);
  }

  @Post(':id/evaluate')
  async evaluate(@Param('id') id: string) {
    return { score: 0, passed: false };
  }
}

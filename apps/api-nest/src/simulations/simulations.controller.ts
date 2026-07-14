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
  ForbiddenException,
} from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { SimulationInstanceService } from './simulation-instance.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { AIService } from './ai/ai.service';
import { CrisisEngine } from './engines/crisis-engine.service';
import { SessionMemoryService } from './session-memory.service';
import { AsyncPersistenceService } from './async-persistence.service';
import { TriggerService } from './triggers/trigger.service';
import { ConversationStateService } from './conversation-state.service';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('simulations')
export class SimulationsController {
  constructor(
    private simulationsService: SimulationsService,
    private instanceService: SimulationInstanceService,
    private aiService: AIService,
    private crisisEngine: CrisisEngine,
    private sessionMemory: SessionMemoryService,
    private asyncPersistence: AsyncPersistenceService,
    private triggerService: TriggerService,
    private conversationState: ConversationStateService,
    private prisma: PrismaService,
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
  async findByUserId(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    if (user?.role === 'student' && userId !== user.id) {
      throw new ForbiddenException('You can only view your own simulations');
    }
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

    // ─── Feature flag gate ──────────────────────────────────────────────
    if (!config?.chatbot_humano_enabled) {
      // Legacy flow — unchanged
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
        course_context: config?.course_context || '',
      };

      const aiResponse = await this.aiService.sendMessageToGemini(
        dto.message,
        systemPrompt,
        [],
        fallbackCtx,
      );

      return { id, message: dto.message, response: aiResponse.response };
    }

    // ─── New chatbot humano flow ────────────────────────────────────────

    // 1. Get session memory (RAM → DB hydrate if needed)
    await this.sessionMemory.getHistory(id);

    // 2. Check triggers → prepend proactive messages if any fire
    const triggerCtx = {
      scenario: scenario?.content || {},
      config,
      state: this.conversationState.getState(id).state,
    };
    const triggerResults = this.triggerService.check(id, triggerCtx);

    // 3. Get conversation state
    const convState = this.conversationState.autoTransition(id);

    // 4. Build history array for AI
    const history = this.sessionMemory
      .getHistory(id)
      .then((turns) =>
        turns.map((t) => ({
          role: t.speaker === 'student' ? 'user' : 'assistant',
          content: t.message,
        })),
      );

    const resolvedHistory = await history;

    // 5. Build system prompt with extended data
    const systemPrompt = this.aiService.buildSystemPrompt({
      base_role: config?.base_role || 'Eres un asistente.',
      course_context: config?.course_context || '',
      knowledge_base: config?.knowledge_base_prompt || '',
      personality_traits: (config?.personality_traits as string[]) || [],
      student_history: resolvedHistory.map((h) => `${h.role}: ${h.content}`),
      tone: config?.tone || undefined,
      language: config?.language || undefined,
      role_behavior: config?.role_behavior || undefined,
      chatbot_humano_enabled: true,
      current_state: this.conversationState.getStatePrompt(convState.state),
    });

    const fallbackCtx = {
      scenarioContext: scenario?.description || '',
      base_role: config?.base_role || '',
      course_context: config?.course_context || '',
    };

    // 6. Prepend trigger messages to response
    const proactiveMessages: string[] = triggerResults.map((r) => r.message);

    // 7. Send to DeepSeek via sendMessageToGemini
    const aiResponse = await this.aiService.sendMessageToGemini(
      dto.message,
      systemPrompt,
      resolvedHistory,
      fallbackCtx,
    );

    // 8. Append user + AI turns to session memory
    const userTurn = this.sessionMemory.append(id, {
      speaker: 'student',
      message: dto.message,
    });
    const aiTurn = this.sessionMemory.append(id, {
      speaker: 'ai',
      message: aiResponse.response,
    });

    // 9. Async persist to SimulationChatLog
    this.asyncPersistence.saveTurn(id, userTurn);
    this.asyncPersistence.saveTurn(id, aiTurn);

    // 10. Return response (with proactive messages if any)
    const combinedResponse = proactiveMessages.length > 0
      ? proactiveMessages.join('\n\n') + '\n\n' + aiResponse.response
      : aiResponse.response;

    return {
      id,
      message: dto.message,
      response: combinedResponse,
      state: convState.state,
      triggers: triggerResults.map((r) => r.triggerName),
    };
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

  // ─── Task 4.3: Admin history endpoint (MUST be before :id routes) ──

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @Get('admin/:instanceId/history')
  async getAdminHistory(@Param('instanceId') instanceId: string) {
    const rows = await this.prisma.simulationChatLog.findMany({
      where: { simulation_instance_id: instanceId },
      orderBy: { turn_number: 'asc' },
    });
    return { simulationId: instanceId, turns: rows };
  }

  // ─── Task 4.2: Message history endpoint ─────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    const history = await this.sessionMemory.getHistory(id);
    return { simulationId: id, messages: history };
  }
}

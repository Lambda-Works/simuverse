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
import { SessionCheckpointService } from './session-checkpoint.service';
import { TriggerService } from './triggers/trigger.service';
import { ConversationStateService } from './conversation-state.service';
import { PracticesService } from './practices.service';
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
    private checkpoint: SessionCheckpointService,
    private triggerService: TriggerService,
    private conversationState: ConversationStateService,
    private practices: PracticesService,
    private prisma: PrismaService,
  ) {}

  // ─── Lifecycle endpoints ───────────────────────────────────────────────

  @Post('start')
  async start(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSimulationDto,
  ) {
    const result = await this.simulationsService.create(
      userId,
      dto.course_id,
      dto.scenario_id,
    );
    await this.checkpoint.hydrateSession(result.session_id || result.id);
    return result;
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

  @Post(':id/checkpoint')
  @HttpCode(HttpStatus.OK)
  async checkpointSession(@Param('id') id: string) {
    return this.checkpoint.checkpoint(id);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const instance = await this.prisma.simulationInstance.findUnique({
      where: { id },
    });
    if (instance) return instance;
    return this.simulationsService.findById(id);
  }

  @Put(':id/pause')
  @HttpCode(HttpStatus.OK)
  async pause(@Param('id') id: string) {
    await this.checkpoint.checkpointAndClose(id);
    const instance = await this.prisma.simulationInstance.findUnique({ where: { id } });
    if (instance) return this.instanceService.pause(id);
    return this.simulationsService.pause(id);
  }

  @Put(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(@Param('id') id: string) {
    await this.checkpoint.hydrateSession(id);
    const instance = await this.prisma.simulationInstance.findUnique({ where: { id } });
    if (instance) return this.instanceService.resume(id);
    return this.simulationsService.resume(id);
  }

  @Put(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const instance = await this.prisma.simulationInstance.findUnique({ where: { id } });
    if (instance) {
      return this.practices.completePractice(userId, id);
    }
    await this.checkpoint.checkpointAndClose(id);
    return this.simulationsService.complete(id);
  }

  @Put(':id/abandon')
  @HttpCode(HttpStatus.OK)
  async abandon(@Param('id') id: string) {
    await this.checkpoint.checkpointAndClose(id);
    const instance = await this.prisma.simulationInstance.findUnique({ where: { id } });
    if (instance) {
      return this.prisma.simulationInstance.update({
        where: { id },
        data: { status: 'failed', feedback: 'abandoned' },
      });
    }
    return this.simulationsService.abandon(id);
  }

  @Post('instances/start')
  async startInstance(
    @CurrentUser('id') userId: string,
    @Body() body: { course_id: string; scenario_id: string },
  ) {
    const result = await this.practices.startNextPractice(
      userId,
      body.course_id,
      body.scenario_id,
    );
    await this.checkpoint.hydrateSession(result.instance.id);
    return result.instance;
  }

  @Get(':id/emails')
  async getEmails(@Param('id') id: string) {
    const scenario = await this.simulationsService.getSimulationScenario(id);
    const content = (scenario?.content as any) || {};
    // ScenariosABM historically saved as initial_emails; runtime/seeds use emails
    return content.emails || content.initial_emails || [];
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
  async getLogs(@Param('id') id: string) {
    const rows = await this.prisma.simulationChatLog.findMany({
      where: { simulation_instance_id: id },
      orderBy: { turn_number: 'asc' },
    });
    return rows;
  }

  @Post(':id/message')
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    const config = await this.simulationsService.getSimulationConfig(id);
    const scenario = await this.simulationsService.getSimulationScenario(id);
    const practiceExtras = await this.practices.getPracticePromptExtras(id);

    // Ensure session is warm + periodic checkpoint running
    this.checkpoint.startPeriodicCheckpoint(id);

    if (!config?.chatbot_humano_enabled) {
      const systemPrompt = this.aiService.buildSystemPrompt({
        base_role: config?.base_role || 'Eres un asistente.',
        course_context: config?.course_context || '',
        knowledge_base: config?.knowledge_base_prompt || '',
        personality_traits: (config?.personality_traits as string[]) || [],
        student_history: [],
        ...practiceExtras,
      });

      const fallbackCtx = {
        scenarioContext: scenario?.description || '',
        base_role: config?.base_role || '',
        course_context: config?.course_context || '',
      };

      const aiResponse = await this.aiService.sendMessage(
        dto.message,
        systemPrompt,
        [],
        fallbackCtx,
      );

      this.sessionMemory.append(id, { speaker: 'student', message: dto.message });
      this.sessionMemory.append(id, { speaker: 'ai', message: aiResponse.response });

      return { id, message: dto.message, response: aiResponse.response };
    }

    await this.sessionMemory.getHistory(id);

    const triggerCtx = {
      scenario: scenario?.content || {},
      config,
      state: this.conversationState.getState(id).state,
    };
    const triggerResults = this.triggerService.check(id, triggerCtx);
    const convState = this.conversationState.autoTransition(id);

    const turns = await this.sessionMemory.getHistory(id);
    const resolvedHistory = turns.map((t) => ({
      role: t.speaker === 'student' ? 'user' : 'assistant',
      content: t.message,
    }));

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
      ...practiceExtras,
    });

    const fallbackCtx = {
      scenarioContext: scenario?.description || '',
      base_role: config?.base_role || '',
      course_context: config?.course_context || '',
    };

    const proactiveMessages: string[] = triggerResults.map((r) => r.message);

    const aiResponse = await this.aiService.sendMessage(
      dto.message,
      systemPrompt,
      resolvedHistory,
      fallbackCtx,
    );

    // Buffer in memory only — DB flush via 2-min checkpoint / close
    this.sessionMemory.append(id, { speaker: 'student', message: dto.message });
    this.sessionMemory.append(id, { speaker: 'ai', message: aiResponse.response });

    const combinedResponse =
      proactiveMessages.length > 0
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
    return {
      disabled: true,
      message:
        'Las evaluaciones están deshabilitadas. El simulador solo realiza prácticas y tareas.',
      simulationId: id,
    };
  }

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

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    const history = await this.sessionMemory.getHistory(id);
    return { simulationId: id, messages: history };
  }
}

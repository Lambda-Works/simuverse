import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromptConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig(courseId: string) {
    const config = await this.prisma.courseConfig.findUnique({
      where: { course_id: courseId },
    });
    if (!config) return null;
    return {
      prompt_template_id: config.prompt_template_id,
      prompt_generation_mode: config.prompt_generation_mode,
      prompt_generated_by: config.prompt_generated_by,
      prompt_generated_at: config.prompt_generated_at,
      base_role: config.base_role,
      course_context: config.course_context,
      personality_traits: config.personality_traits,
      knowledge_base_prompt: config.knowledge_base_prompt,
    };
  }

  async assignTemplate(courseId: string, templateId: number) {
    // Verify template exists
    const template = await this.prisma.promptTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Prompt template not found');
    }

    // Upsert course config
    const config = await this.prisma.courseConfig.upsert({
      where: { course_id: courseId },
      update: {
        prompt_template_id: templateId,
        prompt_generation_mode: 'template',
        base_role: template.base_role,
        course_context: template.course_context,
        personality_traits: template.personality_traits as any,
        knowledge_base_prompt: template.knowledge_base_prompt,
      },
      create: {
        course_id: courseId,
        config_data: {} as any,
        prompt_template_id: templateId,
        prompt_generation_mode: 'template',
        base_role: template.base_role,
        course_context: template.course_context,
        personality_traits: template.personality_traits as any,
        knowledge_base_prompt: template.knowledge_base_prompt,
      },
    });

    return config;
  }

  async savePrompt(courseId: string, promptData: {
    generation_mode: string;
    base_role?: string;
    course_context?: string;
    personality_traits?: any;
    knowledge_base_prompt?: string;
  }) {
    if (!promptData.generation_mode) {
      throw new Error('generation_mode is required');
    }

    const config = await this.prisma.courseConfig.upsert({
      where: { course_id: courseId },
      update: {
        prompt_generation_mode: promptData.generation_mode as any,
        prompt_generated_at: new Date(),
        ...(promptData.base_role && { base_role: promptData.base_role }),
        ...(promptData.course_context && { course_context: promptData.course_context }),
        ...(promptData.personality_traits && { personality_traits: promptData.personality_traits }),
        ...(promptData.knowledge_base_prompt && { knowledge_base_prompt: promptData.knowledge_base_prompt }),
      },
      create: {
        course_id: courseId,
        config_data: {},
        prompt_generation_mode: promptData.generation_mode as any,
        prompt_generated_at: new Date(),
        base_role: promptData.base_role,
        course_context: promptData.course_context,
        personality_traits: promptData.personality_traits,
        knowledge_base_prompt: promptData.knowledge_base_prompt,
      },
    });

    return { success: true, config };
  }
}

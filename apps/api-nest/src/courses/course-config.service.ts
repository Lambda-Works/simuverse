import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseConfigService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConfig(courseId: string) {
    const config = await this.prisma.courseConfig.findUnique({
      where: { course_id: courseId },
    });

    if (config) {
      return config;
    }

    // Find the course to determine family_type from category
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.createDefaultConfig(courseId, course.category);
  }

  async getConfig(courseId: string) {
    const config = await this.prisma.courseConfig.findUnique({
      where: { course_id: courseId },
    });
    if (!config) {
      throw new NotFoundException('Course config not found');
    }
    return config;
  }

  async updateConfig(courseId: string, data: {
    config_data?: any;
    base_role?: string;
    course_context?: string;
    personality_traits?: any;
    knowledge_base_prompt?: string;
    active_modules?: any;
    ui_config?: any;
    ia_config?: any;
    family_type?: string;
    calculator_config?: any;
    inbox_config?: any;
    validation_rules?: any;
    metadata?: any;
    prompt_generation_mode?: string;
  }) {
    // Upsert — create if not exists
    const existing = await this.prisma.courseConfig.findUnique({
      where: { course_id: courseId },
    });

    if (existing) {
      return this.prisma.courseConfig.update({
        where: { course_id: courseId },
        data: {
          ...data,
          family_type: data.family_type as any || undefined,
          prompt_generation_mode: data.prompt_generation_mode as any || undefined,
        },
      });
    }

    // Create new config with provided data
    return this.prisma.courseConfig.create({
      data: {
        course_id: courseId,
        config_data: data.config_data || {},
        base_role: data.base_role,
        course_context: data.course_context,
        personality_traits: data.personality_traits,
        knowledge_base_prompt: data.knowledge_base_prompt,
        active_modules: data.active_modules,
        ui_config: data.ui_config,
        ia_config: data.ia_config,
        family_type: data.family_type as any || undefined,
        calculator_config: data.calculator_config,
        inbox_config: data.inbox_config,
        validation_rules: data.validation_rules,
        metadata: data.metadata,
        prompt_generation_mode: (data.prompt_generation_mode as any) || 'template',
      },
    });
  }

  private async createDefaultConfig(courseId: string, category: string) {
    const familyTypeMap: Record<string, string> = {
      administracion: 'administration',
      rrhh: 'rrhh',
      tecnologia: 'it',
      emprendimiento: 'entrepreneurship',
    };

    const familyType = familyTypeMap[category] || 'administration';

    return this.prisma.courseConfig.create({
      data: {
        course_id: courseId,
        config_data: {},
        family_type: familyType as any,
        prompt_generation_mode: 'template',
      },
    });
  }
}

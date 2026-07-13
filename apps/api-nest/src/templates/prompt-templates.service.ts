import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';

@Injectable()
export class PromptTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, active?: boolean) {
    const where: any = {};
    if (active !== undefined) where.is_active = active;
    else where.is_active = true;
    if (category) where.category = category;

    return this.prisma.promptTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findByCategory(category: string) {
    return this.prisma.promptTemplate.findMany({
      where: { category, is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const template = await this.prisma.promptTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException('Prompt template not found');
    }
    return template;
  }

  async create(dto: CreatePromptTemplateDto) {
    return this.prisma.promptTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        base_role: dto.base_role,
        course_context: dto.course_context,
        personality_traits: dto.personality_traits,
        knowledge_base_prompt: dto.knowledge_base_prompt,
        is_active: true,
        created_by: dto.created_by,
      },
    });
  }

  async update(id: number, dto: UpdatePromptTemplateDto) {
    await this.findOne(id);
    return this.prisma.promptTemplate.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.promptTemplate.update({
      where: { id },
      data: { is_active: false },
    });
    return { success: true, message: 'Template deactivated' };
  }

  async duplicate(id: number, name: string, createdBy?: string) {
    const original = await this.findOne(id);

    return this.prisma.promptTemplate.create({
      data: {
        name,
        description: original.description,
        category: original.category,
        base_role: original.base_role,
        course_context: original.course_context,
        personality_traits: original.personality_traits as any,
        knowledge_base_prompt: original.knowledge_base_prompt,
        is_active: true,
        created_by: createdBy,
      },
    });
  }
}

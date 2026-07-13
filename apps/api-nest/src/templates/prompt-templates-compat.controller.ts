import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PromptTemplatesService } from './prompt-templates.service';
import { PromptConfigService } from './prompt-config.service';

@Controller('prompt-templates')
export class PromptTemplatesCompatController {
  constructor(
    private promptTemplates: PromptTemplatesService,
    private promptConfig: PromptConfigService,
  ) {}

  @Get()
  findAll(@Query('category') category?: string, @Query('active') active?: string) {
    const svc = this.promptTemplates as any;
    const activeFlag = active === undefined ? undefined : active === 'true';
    if (category) return svc.findByCategory ? svc.findByCategory(category) : svc.findAll(category, activeFlag);
    return svc.findAll(undefined as any, activeFlag);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return (this.promptTemplates as any).findOne(Number(id) || id);
  }

  @Post()
  create(@Body() dto: any) {
    return (this.promptTemplates as any).create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return (this.promptTemplates as any).update(Number(id) || id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return (this.promptTemplates as any).remove(Number(id) || id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @Body() body?: any) {
    return (this.promptTemplates as any).duplicate(Number(id) || id, body?.name || body?.created_by);
  }
}

@Controller('prompt-config')
export class PromptConfigCompatController {
  constructor(private promptConfig: PromptConfigService) {}

  @Get(':courseId')
  getConfig(@Param('courseId') courseId: string) {
    return this.promptConfig.getConfig(courseId);
  }

  @Post(':courseId/generate')
  generate(@Param('courseId') courseId: string) {
    return (this.promptConfig as any).savePrompt(courseId, { generation_mode: 'ai', base_role: '', course_context: '', knowledge_base_prompt: '' });
  }

  @Post(':courseId/save')
  save(@Param('courseId') courseId: string, @Body() body: any) {
    return (this.promptConfig as any).savePrompt(courseId, body);
  }
}

import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { FlowTemplatesService } from './flow-templates.service';
import { PromptTemplatesService } from './prompt-templates.service';
import { PromptConfigService } from './prompt-config.service';

@Module({
  controllers: [TemplatesController],
  providers: [FlowTemplatesService, PromptTemplatesService, PromptConfigService],
  exports: [FlowTemplatesService, PromptTemplatesService, PromptConfigService],
})
export class TemplatesModule {}

import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { PromptTemplatesCompatController, PromptConfigCompatController } from './prompt-templates-compat.controller';
import { FlowTemplatesService } from './flow-templates.service';
import { PromptTemplatesService } from './prompt-templates.service';
import { PromptConfigService } from './prompt-config.service';

@Module({
  controllers: [TemplatesController, PromptTemplatesCompatController, PromptConfigCompatController],
  providers: [FlowTemplatesService, PromptTemplatesService, PromptConfigService],
  exports: [FlowTemplatesService, PromptTemplatesService, PromptConfigService],
})
export class TemplatesModule {}

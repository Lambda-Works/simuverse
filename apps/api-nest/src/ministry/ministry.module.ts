import { Module } from '@nestjs/common';
import { MinistryController } from './ministry.controller';
import { MinistryService } from './ministry.service';
import { AIService } from '../simulations/ai/ai.service';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [MinistryController],
  providers: [MinistryService, AIService],
  exports: [MinistryService],
})
export class MinistryModule {}

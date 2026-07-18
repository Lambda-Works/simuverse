import { Module } from '@nestjs/common';
import { MinistryController } from './ministry.controller';
import { MinistryService } from './ministry.service';
import { AIService } from '../simulations/ai/ai.service';
import { CatalogModule } from '../catalog/catalog.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [CatalogModule, RbacModule],
  controllers: [MinistryController],
  providers: [MinistryService, AIService],
  exports: [MinistryService],
})
export class MinistryModule {}

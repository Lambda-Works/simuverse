import { Module } from '@nestjs/common';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';
import { SimulationInstanceService } from './simulation-instance.service';
import { AIService } from './ai/ai.service';
import { CrisisEngine } from './engines/crisis-engine.service';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [SimulationsController],
  providers: [SimulationsService, SimulationInstanceService, AIService, CrisisEngine],
  exports: [SimulationsService, SimulationInstanceService, AIService, CrisisEngine],
})
export class SimulationsModule {}

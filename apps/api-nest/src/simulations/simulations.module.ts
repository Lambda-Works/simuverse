import { Module } from '@nestjs/common';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';
import { SimulationInstanceService } from './simulation-instance.service';

@Module({
  controllers: [SimulationsController],
  providers: [SimulationsService, SimulationInstanceService],
  exports: [SimulationsService, SimulationInstanceService],
})
export class SimulationsModule {}

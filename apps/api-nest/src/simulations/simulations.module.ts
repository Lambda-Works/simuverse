import { Module } from '@nestjs/common';
import { SimulationsController } from './simulations.controller';
import { SimulationReviewController } from './simulation-review.controller';
import { SimulationsService } from './simulations.service';
import { SimulationInstanceService } from './simulation-instance.service';
import { AIService } from './ai/ai.service';
import { CrisisEngine } from './engines/crisis-engine.service';
import { CatalogModule } from '../catalog/catalog.module';
import { SessionMemoryService } from './session-memory.service';
import { AsyncPersistenceService } from './async-persistence.service';
import { TriggerService } from './triggers/trigger.service';
import { EmailTrigger } from './triggers/email.trigger';
import { CrisisTrigger } from './triggers/crisis.trigger';
import { Trigger } from './triggers/trigger.interface';
import { ConversationStateService } from './conversation-state.service';

@Module({
  imports: [CatalogModule],
  controllers: [SimulationsController, SimulationReviewController],
  providers: [
    SimulationsService,
    SimulationInstanceService,
    AIService,
    CrisisEngine,
    SessionMemoryService,
    AsyncPersistenceService,
    ConversationStateService,
    EmailTrigger,
    CrisisTrigger,
    {
      provide: TriggerService,
      useFactory: (
        emailTrigger: EmailTrigger,
        crisisTrigger: CrisisTrigger,
        sessionMemory: SessionMemoryService,
      ) => {
        const triggers: Trigger[] = [emailTrigger, crisisTrigger];
        return new TriggerService(triggers, sessionMemory);
      },
      inject: [EmailTrigger, CrisisTrigger, SessionMemoryService],
    },
  ],
  exports: [
    SimulationsService,
    SimulationInstanceService,
    AIService,
    CrisisEngine,
    SessionMemoryService,
    AsyncPersistenceService,
    ConversationStateService,
    TriggerService,
  ],
})
export class SimulationsModule {}

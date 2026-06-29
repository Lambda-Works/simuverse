import { Module } from '@nestjs/common';
import { MinistryController } from './ministry.controller';
import { MinistryService } from './ministry.service';

@Module({
  controllers: [MinistryController],
  providers: [MinistryService],
  exports: [MinistryService],
})
export class MinistryModule {}

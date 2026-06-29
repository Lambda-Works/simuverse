import { Module } from '@nestjs/common';
import { PracticeLogsController } from './practice-logs.controller';
import { PracticeLogsService } from './practice-logs.service';

@Module({
  controllers: [PracticeLogsController],
  providers: [PracticeLogsService],
  exports: [PracticeLogsService],
})
export class PracticeLogsModule {}

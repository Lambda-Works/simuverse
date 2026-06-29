import { Module } from '@nestjs/common';
import { TelemetryLogsController } from './telemetry-logs.controller';
import { TelemetryLogsService } from './telemetry-logs.service';

@Module({
  controllers: [TelemetryLogsController],
  providers: [TelemetryLogsService],
  exports: [TelemetryLogsService],
})
export class TelemetryLogsModule {}

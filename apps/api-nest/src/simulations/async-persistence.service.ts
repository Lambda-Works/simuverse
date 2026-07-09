import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatTurn } from './session-memory.service';

@Injectable()
export class AsyncPersistenceService {
  private readonly logger = new Logger(AsyncPersistenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fire-and-forget write to SimulationChatLog.
   * Runs the Prisma write outside the request lifecycle.
   * Errors are logged but never thrown — caller is not blocked.
   */
  saveTurn(
    simulationId: string,
    turn: ChatTurn,
  ): void {
    this.prisma.simulationChatLog
      .create({
        data: {
          simulation_instance_id: simulationId,
          turn_number: turn.turn_number,
          speaker: turn.speaker,
          message: turn.message,
          is_correct: turn.is_correct ?? null,
          ref_number: turn.ref_number ?? null,
          metadata: turn.metadata ? JSON.parse(JSON.stringify(turn.metadata)) : null,
        },
      })
      .then(() => {
        this.logger.debug(
          `Persisted turn ${turn.turn_number} for session ${simulationId}`,
        );
      })
      .catch((err) => {
        this.logger.error(
          `Failed to persist turn ${turn.turn_number} for session ${simulationId}: ${err.message}`,
        );
      });
  }
}

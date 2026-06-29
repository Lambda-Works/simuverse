import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface TelemetryEntry {
  simulation_id: string;
  action: string;
  action_type: string;
  timestamp: number;
  previous_hash: string | null;
  integrity_hash?: string;
}

@Injectable()
export class TelemetryService {
  /**
   * Compute SHA-256 integrity hash for a telemetry entry.
   * The hash includes the previous_hash to create a linked-list chain.
   */
  computeIntegrityHash(entry: {
    simulation_id: string;
    action: string;
    action_type: string;
    timestamp: number;
    previous_hash: string | null;
  }): string {
    const payload = [
      entry.simulation_id,
      entry.action,
      entry.action_type,
      entry.timestamp,
      entry.previous_hash || 'genesis',
    ].join('|');

    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Verify the integrity of a chain of telemetry entries.
   * Each entry's hash must match its computed hash, and each entry's
   * previous_hash must match the preceding entry's hash.
   */
  verifyChain(entries: TelemetryEntry[]): boolean {
    if (entries.length === 0) return true;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const expectedPreviousHash = i === 0 ? null : entries[i - 1].integrity_hash;

      // Verify previous_hash linkage
      if (entry.previous_hash !== expectedPreviousHash) {
        return false;
      }

      // Verify hash integrity
      const expectedHash = this.computeIntegrityHash({
        simulation_id: entry.simulation_id,
        action: entry.action,
        action_type: entry.action_type,
        timestamp: entry.timestamp,
        previous_hash: entry.previous_hash,
      });

      if (entry.integrity_hash !== expectedHash) {
        return false;
      }
    }

    return true;
  }
}

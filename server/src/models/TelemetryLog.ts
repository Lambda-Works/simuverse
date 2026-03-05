import { Schema, model, Document, Types } from 'mongoose';

export interface ITelemetryLog extends Document {
  simulation_id: Types.ObjectId;
  user_id: string;
  course_id: string;
  action: string;
  action_type: 'click' | 'input' | 'file_upload' | 'message_sent' | 'calculation' | 'navigation';
  timestamp: Date;
  response_time_ms: number;
  metadata: Record<string, any>;
  integrity_hash: string;
}

const telemetryLogSchema = new Schema<ITelemetryLog>(
  {
    simulation_id: { type: Schema.Types.ObjectId, ref: 'Simulation', required: true },
    user_id: { type: String, required: true },
    course_id: { type: String, required: true },
    action: { type: String, required: true },
    action_type: {
      type: String,
      enum: ['click', 'input', 'file_upload', 'message_sent', 'calculation', 'navigation'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    response_time_ms: { type: Number, default: 0 },
    metadata: Schema.Types.Mixed,
    integrity_hash: String,
  },
  { timestamps: true }
);

// Índices para auditoría y análisis
telemetryLogSchema.index({ simulation_id: 1, timestamp: 1 });
telemetryLogSchema.index({ user_id: 1, course_id: 1, timestamp: 1 });
telemetryLogSchema.index({ timestamp: 1 });

export const TelemetryLog = model<ITelemetryLog>('TelemetryLog', telemetryLogSchema);

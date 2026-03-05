import { Schema, model, Document, Types } from 'mongoose';

export interface ISimulation extends Document {
  _id: Types.ObjectId;
  user_id: string;
  course_id: string;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  progress: number;
  scenario_id?: string;
  scenario_data: Record<string, any>;
  started_at: Date;
  paused_at?: Date;
  completed_at?: Date;
  total_duration_minutes: number;
  current_state: Record<string, any>;
}

const simulationSchema = new Schema<ISimulation>(
  {
    user_id: { type: String, required: true },
    course_id: { type: String, required: true },
    status: { type: String, enum: ['not-started', 'in-progress', 'paused', 'completed'], default: 'not-started' },
    progress: { type: Number, default: 0 }, // 0-100
    scenario_id: String,
    scenario_data: Schema.Types.Mixed,
    started_at: { type: Date, default: Date.now },
    paused_at: Date,
    completed_at: Date,
    total_duration_minutes: { type: Number, default: 0 },
    current_state: Schema.Types.Mixed,
  },
  { timestamps: true }
);

simulationSchema.index({ user_id: 1, course_id: 1, status: 1 });

export const Simulation = model<ISimulation>('Simulation', simulationSchema);

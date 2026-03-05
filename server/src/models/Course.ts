import { Schema, model, Document } from 'mongoose';

export interface ICourse extends Document {
  course_id: string;
  title: string;
  description: string;
  family: 'administracion' | 'rrhh' | 'informatica' | 'emprendimiento';
  modules: string[];
  ai_config: {
    base_role: string;
    course_context: string;
    knowledge_base: string;
    personality_traits: string[];
    system_prompt: string;
  };
  eval_criteria: string[];
  crisis_events: Array<{
    trigger_minutes: number;
    event_text: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  config_specific: Record<string, any>; // JSON dinámico por curso
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    course_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    family: { type: String, enum: ['administracion', 'rrhh', 'informatica', 'emprendimiento'], required: true },
    modules: [{ type: String }],
    ai_config: {
      base_role: String,
      course_context: String,
      knowledge_base: String,
      personality_traits: [String],
      system_prompt: String,
    },
    eval_criteria: [String],
    crisis_events: [
      {
        trigger_minutes: Number,
        event_text: String,
        severity: { type: String, enum: ['info', 'warning', 'critical'] },
      },
    ],
    config_specific: Schema.Types.Mixed,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.index({ course_id: 1, is_active: 1 });

export const Course = model<ICourse>('Course', courseSchema);

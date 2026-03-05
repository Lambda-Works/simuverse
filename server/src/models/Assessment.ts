import { Schema, model, Document } from 'mongoose';

export interface IAssessment extends Document {
  simulation_id: string;
  user_id: string;
  course_id: string;
  assessment_data: {
    hard_skills: Record<string, number>;
    soft_skills: Record<string, number>;
    overall_score: number;
  };
  kpis: Record<string, any>;
  feedback: string;
  completed_at: Date;
}

const assessmentSchema = new Schema<IAssessment>(
  {
    simulation_id: { type: String, required: true },
    user_id: { type: String, required: true },
    course_id: { type: String, required: true },
    assessment_data: {
      hard_skills: Schema.Types.Mixed,
      soft_skills: Schema.Types.Mixed,
      overall_score: Number,
    },
    kpis: Schema.Types.Mixed,
    feedback: String,
    completed_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assessmentSchema.index({ user_id: 1, course_id: 1 });
assessmentSchema.index({ simulation_id: 1 });

export const Assessment = model<IAssessment>('Assessment', assessmentSchema);

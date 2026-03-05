import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  user_id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  course_ids: string[];
  profile_picture?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    user_id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    course_ids: [String],
    profile_picture: String,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ user_id: 1, email: 1 });

export const User = model<IUser>('User', userSchema);

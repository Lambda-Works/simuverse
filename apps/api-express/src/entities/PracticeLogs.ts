import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Course } from './Course';
import { SimulationInstance } from './SimulationInstance';
import crypto from 'crypto';

export type ActionType = 
  | 'calculation'
  | 'document_upload'
  | 'email_read'
  | 'email_reply'
  | 'message_sent'
  | 'decision_made'
  | 'case_submitted'
  | 'case_approved'
  | 'case_rejected'
  | 'system_event'
  | 'crisis_triggered'
  | 'evaluation_completed';

export interface ActionMetadata {
  moduleName?: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errors?: string[];
  duration?: number; // milliseconds
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

@Entity('practice_logs')
@Index(['student_id', 'course_id'])
@Index(['course_id', 'created_at'])
@Index(['student_id', 'created_at'])
@Index(['integrity_hash']) // For verifying logs haven't been tampered with
export class PracticeLogs {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  student_id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'uuid', nullable: true })
  simulation_instance_id?: string;

  @Column({
    type: 'enum',
    enum: [
      'calculation',
      'document_upload',
      'email_read',
      'email_reply',
      'message_sent',
      'decision_made',
      'case_submitted',
      'case_approved',
      'case_rejected',
      'system_event',
      'crisis_triggered',
      'evaluation_completed'
    ]
  })
  action_type!: ActionType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'json' })
  metadata!: ActionMetadata;

  @Column({ type: 'int' })
  sequence_number!: number; // Ensures chronological integrity

  // Integrity hash: SHA256(previousHash + student_id + course_id + action_type + timestamp)
  // This makes logs immutable (cryptographically verifiable)
  @Column({ type: 'varchar', length: 64 }) // SHA256 = 64 hex chars
  integrity_hash!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  previous_hash?: string;

  @CreateDateColumn()
  created_at!: Date;

  // Computed timestamp for Ministry verification (immutable)
  @Column({ type: 'bigint' })
  timestamp!: number; // Unix timestamp in milliseconds

  @Column({ type: 'text', nullable: true })
  docenter_notes?: string; // Teacher notes during review

  @ManyToOne(() => User, (user) => user.practice_logs)
  @JoinColumn({ name: 'student_id' })
  student?: User;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @ManyToOne(() => SimulationInstance, (instance) => instance.logs, { nullable: true })
  @JoinColumn({ name: 'simulation_instance_id' })
  simulation_instance?: SimulationInstance;

  // Compute integrity hash to ensure logs cannot be tampered with
  static computeIntegrityHash(
    previousHash: string | undefined,
    student_id: string,
    course_id: string,
    action_type: ActionType,
    timestamp: number
  ): string {
    const data = `${previousHash || ''}${student_id}${course_id}${action_type}${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

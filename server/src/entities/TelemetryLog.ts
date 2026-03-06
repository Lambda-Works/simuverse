import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { Course } from './Course';
import { Simulation } from './Simulation';

export enum ActionType {
  USER_INPUT = 'user_input',
  SYSTEM_ACTION = 'system_action',
  AI_RESPONSE = 'ai_response',
  DECISION = 'decision',
  ERROR = 'error',
  STATE_CHANGE = 'state_change'
}

@Entity('telemetry_logs')
@Index(['simulation_id'])
@Index(['user_id'])
@Index(['course_id'])
@Index(['created_at'])
@Index(['action_type'])
export class TelemetryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  simulation_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'varchar', length: 255 })
  action!: string;

  @Column({
    type: 'enum',
    enum: ActionType
  })
  action_type!: ActionType;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  created_at!: Date;

  @Column({ type: 'int' })
  response_time_ms!: number;

  @Column({ type: 'json', nullable: true })
  metadata!: {
    module: string;
    input?: string;
    output?: string;
    state_before?: Record<string, any>;
    state_after?: Record<string, any>;
    [key: string]: any;
  };

  @Column({ type: 'varchar', length: 64 })
  integrity_hash!: string; // SHA-256 hash for immutability verification

  // Relations
  @ManyToOne(() => Simulation, sim => sim.telemetry_logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'simulation_id' })
  simulation!: Simulation;

  @ManyToOne(() => User, user => user.telemetry_logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Course, course => course.telemetry_logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { User } from './User';
import { Course } from './Course';
import { TelemetryLog } from './TelemetryLog';
import { Assessment } from './Assessment';

export enum SimulationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

@Entity('simulations')
@Index(['user_id'])
@Index(['course_id'])
@Index(['status'])
@Index(['started_at'])
export class Simulation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'varchar', length: 36 })
  user_id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({
    type: 'enum',
    enum: SimulationStatus,
    default: SimulationStatus.IN_PROGRESS
  })
  status!: SimulationStatus;

  @Column({ type: 'json', nullable: true })
  current_state!: {
    current_module: string;
    current_step: number;
    variables: Record<string, any>;
    decision_history: Array<{ action: string; timestamp: Date }>;
  };

  @Column({ type: 'int', default: 0 })
  progress_percentage!: number;

  @CreateDateColumn()
  started_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  paused_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date | null;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, user => user.simulations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  user!: User;

  @ManyToOne(() => Course, course => course.simulations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @OneToMany(() => TelemetryLog, log => log.simulation, { cascade: true })
  telemetry_logs!: TelemetryLog[];

  @OneToMany(() => Assessment, assessment => assessment.simulation)
  assessments!: Assessment[];
}

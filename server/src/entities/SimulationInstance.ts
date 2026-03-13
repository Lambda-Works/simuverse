import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Scenario } from './Scenario';
import { Course } from './Course';
import { PracticeLogs } from './PracticeLogs';

export type SimulationStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'submitted_for_review';

@Entity('simulation_instances')
export class SimulationInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  student_id!: string;

  @Column({ type: 'uuid' })
  scenario_id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'enum', enum: ['not_started', 'in_progress', 'paused', 'completed', 'failed', 'submitted_for_review'], default: 'not_started' })
  status!: SimulationStatus;

  @Column({ type: 'int', default: 0 })
  progress_percentage!: number;

  @Column({ type: 'float', nullable: true })
  score?: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'int', nullable: true })
  time_spent_seconds?: number;

  @CreateDateColumn()
  started_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Computed fields (not in database)
  current_state?: Record<string, any>;
  progress?: number;
  performance_metrics?: {
    accuracy: number;
    time_spent: number;
    tasks_completed: number;
    tasks_total: number;
    error_count: number;
  };
  metadata?: Record<string, any>;
  submitted_at?: Date;

  @ManyToOne(() => User, (user) => user.simulation_instances)
  @JoinColumn({ name: 'student_id' })
  student?: User;

  @ManyToOne(() => Course, (course) => course.simulation_instances)
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @ManyToOne(() => Scenario, (scenario) => scenario.instances)
  @JoinColumn({ name: 'scenario_id' })
  scenario?: Scenario;

  @OneToMany(() => PracticeLogs, (log) => log.simulation_instance)
  logs?: PracticeLogs[];
}

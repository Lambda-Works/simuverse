import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { Course } from './Course';
import { Simulation } from './Simulation';

@Entity('assessments')
@Index(['simulation_id'])
@Index(['user_id'])
@Index(['course_id'])
@Index(['created_at'])
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  simulation_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at!: Date;

  @Column({ type: 'json' })
  kpis!: {
    kpi_id: string;
    kpi_name: string;
    weight: number;
    achieved_value: number;
    target_value: number;
    status: 'excellent' | 'good' | 'acceptable' | 'poor';
    notes: string;
  }[];

  @Column({ type: 'text', nullable: true })
  ai_evaluation!: string;

  @Column({ type: 'text', nullable: true })
  recommendation!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  digital_signature!: string; // HMAC-SHA256 for document authenticity

  @Column({ type: 'json', nullable: true })
  feedback!: {
    strengths: string[];
    areas_for_improvement: string[];
    suggested_actions: string[];
  };

  // Relations
  @ManyToOne(() => Simulation, sim => sim.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'simulation_id' })
  simulation!: Simulation;

  @ManyToOne(() => User, user => user.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Course, course => course.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;
}

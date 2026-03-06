import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Course } from './Course';
import { SimulationInstance } from './SimulationInstance';

export interface CaseData {
  title: string;
  description: string;
  context: Record<string, any>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
}

@Entity('scenarios')
export class Scenario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'json' })
  case_data!: CaseData;

  @Column({ type: 'json', nullable: true })
  initial_state?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  validation_rules?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  success_criteria?: string[];

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'int', default: 0 })
  sequence!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Course, (course) => course.scenarios)
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @OneToMany(() => SimulationInstance, (instance) => instance.scenario)
  instances?: SimulationInstance[];
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, ManyToMany, JoinTable, Index } from 'typeorm';
import { Simulation } from './Simulation';
import { Module } from './Module';
import { TelemetryLog } from './TelemetryLog';
import { Assessment } from './Assessment';
import { CourseModule } from './CourseModule';
import { CourseConfig } from './CourseConfig';
import { Scenario } from './Scenario';
import { SimulationInstance } from './SimulationInstance';

@Entity('courses')
@Index(['course_id'], { unique: true })
@Index(['family'])
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  course_id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 100 })
  family!: string;

  @Column({ type: 'int' })
  duration_minutes!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'json', nullable: true })
  ai_config!: {
    system_prompt_template: string;
    model: string;
    temperature: number;
    max_tokens: number;
    streaming_enabled: boolean;
  };

  @Column({ type: 'json', nullable: true })
  eval_criteria!: {
    kpi_name: string;
    weight: number;
    type: string;
    thresholds: Record<string, number>;
  }[];

  @Column({ type: 'json', nullable: true })
  crisis_events!: {
    event_id: string;
    event_name: string;
    description: string;
    trigger_condition: string;
    impact: string;
    probability: number;
  }[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany(() => Simulation, simulation => simulation.course)
  simulations!: Simulation[];

  @OneToOne(() => CourseConfig, (config) => config.course, { cascade: true, nullable: true })
  config?: CourseConfig;

  @OneToMany(() => Scenario, (scenario) => scenario.course)
  scenarios?: Scenario[];

  @OneToMany(() => SimulationInstance, (instance) => instance.course)
  simulation_instances?: SimulationInstance[];

  @ManyToMany(() => Module)
  @JoinTable({
    name: 'course_modules',
    joinColumn: { name: 'course_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'module_id', referencedColumnName: 'id' }
  })
  modules!: Module[];

  @OneToMany(() => CourseModule, cm => cm.course)
  course_modules!: CourseModule[];

  @OneToMany(() => TelemetryLog, log => log.course)
  telemetry_logs!: TelemetryLog[];

  @OneToMany(() => Assessment, assessment => assessment.course)
  assessments!: Assessment[];
}

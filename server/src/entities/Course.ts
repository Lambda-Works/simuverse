import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, Index } from 'typeorm';
import { Simulation } from './Simulation';
import { Scenario } from './Scenario';
import { Assessment } from './Assessment';
import { CourseModule } from './CourseModule';
import { TelemetryLog } from './TelemetryLog';
import { CourseConfig } from './CourseConfig';
import { SimulationInstance } from './SimulationInstance';
import { MinistryRequirement } from './MinistryRequirement';
import { KPI } from './KPI';
import { Task } from './Task';

@Entity('courses')
@Index(['course_id'], { unique: true })
@Index(['category'])
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
  category!: string;

  @Column({ type: 'json', nullable: true })
  modules?: any;

  @Column({ type: 'json', nullable: true })
  ai_config?: any;

  @Column({ type: 'json', nullable: true })
  eval_criteria?: any;

  @Column({ type: 'json', nullable: true })
  crisis_events?: any;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToOne(() => CourseConfig, config => config.course)
  config?: CourseConfig;

  @OneToMany(() => Simulation, simulation => simulation.course)
  simulations?: Simulation[];

  @OneToMany(() => Scenario, scenario => scenario.course)
  scenarios?: Scenario[];

  @OneToMany(() => Assessment, assessment => assessment.course)
  assessments?: Assessment[];

  @OneToMany(() => CourseModule, courseModule => courseModule.course)
  course_modules?: CourseModule[];

  @OneToMany(() => TelemetryLog, log => log.course)
  telemetry_logs?: TelemetryLog[];

  @OneToMany(() => SimulationInstance, instance => instance.course)
  simulation_instances?: SimulationInstance[];

  @OneToMany(() => MinistryRequirement, req => req.course)
  ministry_requirements?: MinistryRequirement[];

  @OneToMany(() => KPI, kpi => kpi.course)
  kpis?: KPI[];

  @OneToMany(() => Task, task => task.course)
  tasks?: Task[];
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Simulation } from './Simulation';
import { Scenario } from './Scenario';

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
  @OneToMany(() => Simulation, simulation => simulation.course)
  simulations?: Simulation[];

  @OneToMany(() => Scenario, scenario => scenario.course)
  scenarios?: Scenario[];
}

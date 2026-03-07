import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Course } from './Course';
import { SimulationInstance } from './SimulationInstance';
import { Task } from './Task';

/**
 * Escenarios de Simulación
 * 
 * scenario_type: 'practice' = múltiples intentos, para aprender
 *                'evaluation' = una sola oportunidad, calificado
 * 
 * Los escenarios están basados en los ejes temáticos exigidos por el
 * Ministerio de Educación, cargados en tech_sheets o eval_criteria del curso.
 */
@Entity('scenarios')
export class Scenario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  course_id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  scenario_type?: string; // 'practice' | 'evaluation'

  @Column({ type: 'json', nullable: true })
  categories?: string[] | null;

  @Column({ 
    type: 'enum',
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  })
  difficulty!: string;

  @Column({ type: 'json', nullable: true })
  content?: any; // Contenido del escenario: emails, documentos, planillas, contexto

  @Column({ type: 'json', nullable: true })
  expected_outcomes?: any; // Lo que debe lograr el alumno

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Course, (course) => course.scenarios)
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @OneToMany(() => SimulationInstance, (instance) => instance.scenario)
  instances?: SimulationInstance[];

  @OneToMany(() => Task, task => task.scenario)
  tasks?: Task[];
}

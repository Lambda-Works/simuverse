import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Course } from './Course';
import { MinistryRequirement } from './MinistryRequirement';
import { Task } from './Task';

/**
 * KPI (Key Performance Indicator)
 * Extraídos de MinistryRequirement
 * Definen qué debe lograr el estudiante
 */
@Entity('kpis')
@Index(['course_id'])
@Index(['ministry_requirement_id'])
@Index(['is_active'])
export class KPI {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'uuid' })
  ministry_requirement_id!: string;

  // Información del KPI
  @Column({ type: 'varchar', length: 255 })
  name!: string; // "Exactitud en cálculo de salarios"

  @Column({ type: 'text' })
  description!: string; // Qué mide exactamente

  @Column({ type: 'varchar', length: 50 })
  category!: string; // "accuracy", "efficiency", "compliance", etc.

  // Configuración de evaluación
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  weight!: number; // Peso en la evaluación (0-100%, suma de todos = 100%)

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  target_value!: number; // Valor objetivo (ej: 95% de exactitud)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 80 })
  minimum_pass_value!: number; // Mínimo para pasar (ej: 80%)

  // Umbrales de estado
  @Column({ type: 'json', default: JSON.stringify({
    excellent: 95,
    good: 85,
    acceptable: 75,
    poor: 0
  })})
  thresholds!: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };

  // Evento que dispara este KPI
  @Column({ type: 'varchar', length: 100 })
  trigger_event!: string; // "salary_calculation_completed", "crisis_resolved", etc.

  @Column({ type: 'text', nullable: true })
  success_criteria!: string; // Criterios específicos de éxito

  // Metadata
  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'int', default: 0 })
  tasks_count!: number; // Cantidad de tareas vinculadas

  @Column({ type: 'int', default: 0 })
  students_achieved!: number; // Estudiantes que lo alcanzaron

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @ManyToOne(() => Course, course => course.kpis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @ManyToOne(() => MinistryRequirement, req => req.kpis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ministry_requirement_id' })
  ministry_requirement!: MinistryRequirement;

  @OneToMany(() => Task, task => task.kpi)
  tasks!: Task[];
}

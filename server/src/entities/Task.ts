import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Course } from './Course';
import { KPI } from './KPI';
import { Scenario } from './Scenario';

export type TaskType = 'practice' | 'evaluation';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

/**
 * Tareas generadas automáticamente de los KPIs
 * Las tareas le dicen al estudiante: "Practica esto para alcanzar el KPI X"
 * 
 * Flujo:
 * 1. Admin sube requisitos ministeriales
 * 2. Sistema extrae KPIs
 * 3. Sistema genera Tasks (simulaciones práctica + evaluación)
 * 4. Estudiante hace Tasks
 * 5. Sistema evalúa si alcanzó KPIs
 */
@Entity('tasks')
@Index(['course_id'])
@Index(['kpi_id'])
@Index(['scenario_id'])
@Index(['type'])
@Index(['status'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'uuid' })
  kpi_id!: string;

  @Column({ type: 'uuid', nullable: true })
  scenario_id?: string; // Escenario asociado (opcional, puede haber multiple scenarios por tarea)

  // Información de la tarea
  @Column({ type: 'varchar', length: 255 })
  title!: string; // "Calcular liquidación de sueldo con 95% exactitud"

  @Column({ type: 'text' })
  description!: string; // Instrucciones para el estudiante

  @Column({ type: 'varchar', length: 20 })
  type!: TaskType; // 'practice' = puede equivocarse, IA enseña | 'evaluation' = debe pasar

  // Secuencia (1º práctica, 2º práctica, 3º evaluación)
  @Column({ type: 'int', default: 0 })
  sequence_order!: number;

  // Configuración de IA
  @Column({ type: 'json', nullable: true })
  ai_prompt_config!: {
    system_prompt?: string; // Instrucción específica para IA en esta tarea
    temperature?: number; // Cómo de creativa es la IA (0-1)
    give_hints?: boolean; // ¿Dar pistas en práctica?
    max_attempts?: number; // Cantidad de intentos permitidos
  };

  // Criterios de evaluación
  @Column({ type: 'json', nullable: true })
  evaluation_criteria!: {
    accuracy_required?: number; // % mínimo
    time_limit_minutes?: number;
    partial_credit_allowed?: boolean;
    auto_evaluation_rules?: Record<string, any>;
  };

  // Estado
  @Column({ type: 'varchar', default: 'pending' })
  status!: TaskStatus;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'int', default: 0 })
  students_completed!: number; // Cuántos la completaron

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  average_completion_rate!: number; // % promedio de cumplimiento

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  activated_at?: Date;

  // Relations
  @ManyToOne(() => Course, course => course.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @ManyToOne(() => KPI, kpi => kpi.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kpi_id' })
  kpi!: KPI;

  @ManyToOne(() => Scenario, scenario => scenario.tasks, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'scenario_id' })
  scenario?: Scenario;
}

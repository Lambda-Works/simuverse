import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Asignaciones de simulaciones a alumnos
 * El admin asigna una simulación (curso + escenario) a un alumno
 * Define: cuántos intentos tiene, fechas límite, etc.
 * 
 * Regla de Negocio:
 * - max_attempts=N → El alumno puede practicar N veces (PRACTICE)
 * - La evaluación DEFINITIVA es una sola instancia diferente (EVALUATION)
 */
@Entity('simulation_assignments')
export class SimulationAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  simulation_id!: string;

  @Column({ type: 'varchar', length: 36 })
  student_id!: string;

  @Column({ type: 'varchar', length: 36 })
  course_id!: string;

  @Column({ type: 'varchar', length: 36 })
  assigned_by!: string;

  @Column({ type: 'datetime', nullable: true })
  start_date?: Date;

  @Column({ type: 'datetime', nullable: true })
  end_date?: Date;

  @Column({ type: 'int', nullable: true, default: 1 })
  max_attempts?: number;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    default: 'pending'
  })
  status!: string;

  @Column({ type: 'int', default: 0 })
  attempts_used!: number;

  @CreateDateColumn()
  created_at!: Date;
}

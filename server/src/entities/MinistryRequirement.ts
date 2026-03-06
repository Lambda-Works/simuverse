import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Course } from './Course';
import { User } from './User';

export type FileType = 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg' | 'txt';
export type RequirementStatus = 'uploaded' | 'processing' | 'extracted' | 'active' | 'archived';

/**
 * Requisitos ministeriales (archivos con KPIs y criterios de evaluación)
 * Se suben archivos DOCX, PDF, XLS, PNG con criterios del ministerio
 * El sistema extrae automáticamente los KPIs y genera tareas
 */
@Entity('ministry_requirements')
@Index(['course_id'])
@Index(['status'])
@Index(['created_at'])
export class MinistryRequirement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'uuid' })
  uploaded_by_id!: string;

  // Información del archivo
  @Column({ type: 'varchar', length: 255 })
  file_name!: string;

  @Column({ type: 'varchar', length: 20 })
  file_type!: FileType;

  @Column({ type: 'bigint' })
  file_size_bytes!: number;

  @Column({ type: 'varchar', length: 255 })
  file_path!: string; // Ruta en servidor

  // Contenido extraído
  @Column({ type: 'text', nullable: true })
  raw_text!: string; // Texto extraído del archivo

  @Column({ type: 'json', nullable: true })
  extracted_content!: {
    title?: string;
    description?: string;
    sections?: {
      name: string;
      content: string;
    }[];
    competencies?: string[];
    evaluation_criteria?: string[];
    target_profile?: string;
  };

  // Estado del procesamiento
  @Column({ type: 'varchar', default: 'uploaded' })
  status!: RequirementStatus; // uploaded -> processing -> extracted -> active

  @Column({ type: 'text', nullable: true })
  processing_notes!: string; // Notas si ocurrió error al procesar

  // Metadata
  @Column({ type: 'int', default: 0 })
  kpis_generated!: number; // Cantidad de KPIs extraídos

  @Column({ type: 'int', default: 0 })
  tasks_generated!: number; // Cantidad de tareas creadas

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  activated_at?: Date; // Cuándo se activó

  // Relations
  @ManyToOne(() => Course, course => course.ministry_requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @ManyToOne(() => User, user => user.ministry_requirements_uploaded, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by!: User;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { Course } from './Course';
import { MinistryRequirement } from './MinistryRequirement';

export type FileUploadType = 'ministry_requirement' | 'scenario_resource' | 'student_submission';

/**
 * Registro de archivos subidos al sistema
 * Rastrea nombre, tamaño, tipo, quién subió, cuándo, dónde se guarda
 */
@Entity('file_uploads')
@Index(['uploaded_by_id'])
@Index(['course_id'])
@Index(['ministry_requirement_id'])
@Index(['created_at'])
export class FileUpload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  uploaded_by_id!: string;

  @Column({ type: 'uuid', nullable: true })
  course_id?: string;

  @Column({ type: 'uuid', nullable: true })
  ministry_requirement_id?: string;

  // Información del archivo
  @Column({ type: 'varchar', length: 255 })
  file_name!: string;

  @Column({ type: 'varchar', length: 50 })
  file_type!: string; // pdf, docx, xlsx, png, jpg, txt

  @Column({ type: 'varchar', length: 20 })
  upload_type!: FileUploadType;

  @Column({ type: 'bigint' })
  file_size_bytes!: number;

  @Column({ type: 'varchar', length: 255 })
  file_path!: string; // Ruta relativa al servidor (ej: /uploads/course_id/filename.pdf)

  @Column({ type: 'varchar', length: 64, nullable: true })
  file_hash!: string; // SHA256 del archivo para detectar duplicados

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @ManyToOne(() => User, user => user.file_uploads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by!: User;

  @ManyToOne(() => Course, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @ManyToOne(() => MinistryRequirement, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'ministry_requirement_id' })
  ministry_requirement?: MinistryRequirement;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Documentos asociados a cursos
 * Casos prácticos, contratos, políticas, procedimientos legales
 * que el alumno verá durante la simulación
 */
@Entity('course_documents')
export class CourseDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  course_id!: string;

  @Column({ type: 'varchar', length: 200 })
  document_name!: string;

  @Column({ 
    type: 'enum', 
    enum: ['case', 'contract', 'policy', 'legal', 'procedure', 'other'],
    default: 'other'
  })
  document_type!: string;

  @Column({ type: 'longtext', nullable: true })
  document_content?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  uploaded_by?: string;

  @CreateDateColumn()
  created_at!: Date;
}

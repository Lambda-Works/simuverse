import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Plantillas de prompts reutilizables
 * Admin puede crear, editar, duplicar y desactivar plantillas
 * Luego asignarlas a cursos en place of hardcoding
 */
@Entity('prompt_templates')
export class PromptTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string; // "service", "audit", "sales", "management"

  @Column({ type: 'text' })
  base_role!: string;

  @Column({ type: 'text', nullable: true })
  course_context?: string;

  @Column({ type: 'json', nullable: true })
  personality_traits?: string[];

  @Column({ type: 'longtext' })
  knowledge_base_prompt!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

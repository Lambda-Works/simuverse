import {
  Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

/**
 * Plantillas de flujo de cursos (FlowTemplates)
 * Almacena la configuración completa de un escenario: inbox, herramientas,
 * crisis events, criterios de evaluación, persona IA, etc.
 */
@Entity('flow_templates')
@Index(['course_id'])
@Index(['family'])
@Index(['is_active'])
export class FlowTemplate {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  course_id!: string;

  @Column({ type: 'varchar', length: 50 })
  course_code!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 50, default: 'administracion' })
  family!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, default: '1.0' })
  version!: string;

  @Column({ type: 'longtext' })
  template_data!: string; // JSON serializado del FlowTemplate completo

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

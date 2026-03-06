import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Fichas Técnicas del Ministerio de Educación
 * Equivalente al tech_sheets de la BD
 * Contiene los KPIs y competencias exigidos por el ministerio por curso
 */
@Entity('tech_sheets')
export class TechSheet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ministry_code?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  competencies?: any;

  @Column({ type: 'json', nullable: true })
  kpi_requirements?: any;

  @Column({ type: 'text', nullable: true })
  context_scenario?: string;

  @Column({ type: 'json', nullable: true })
  extracted_data?: any;

  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url?: string;

  @Column({ type: 'boolean', default: false })
  processed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processed_at?: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  uploaded_by?: string;

  @CreateDateColumn()
  created_at!: Date;
}

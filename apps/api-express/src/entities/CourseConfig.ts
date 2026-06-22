import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './Course';
import { TechSheet } from './TechSheet';
import { PromptTemplate } from './PromptTemplate';

export interface ModuleActivation {
  moduleId: number;
  enabled: boolean;
  config: Record<string, any>;
}

export interface UIConfig {
  layout: 'office' | 'terminal' | 'dashboard' | 'ecommerce';
  primaryColor: string;
  secondaryColor: string;
  theme: 'light' | 'dark';
}

export interface IAConfig {
  enabled: boolean;
  provider: 'gemini' | 'openai';
  systemPrompt: string;
  model?: string;
  temperature?: number;
}

export interface ValidationRules {
  [key: string]: any;
}

export interface CalculatorConfig {
  formulas: Record<string, string>;
  variables: Record<string, number | string>;
}

export interface InboxConfig {
  initialEmails: Array<{
    id: string;
    from: string;
    subject: string;
    body: string;
    attachments?: string[];
    triggerAction?: string;
  }>;
  eventTriggers: Record<string, string>;
}

@Entity('course_config')
export class CourseConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  course_id!: string;

  @Column({ type: 'json' })
  config_data!: any;

  @Column({ type: 'text', nullable: true })
  base_role?: string;

  @Column({ type: 'text', nullable: true })
  course_context?: string;

  @Column({ type: 'json', nullable: true })
  personality_traits?: Record<string, any>;

  @Column({ type: 'longtext', nullable: true })
  knowledge_base_prompt?: string;

  @Column({ type: 'json', nullable: true })
  active_modules?: ModuleActivation[];

  @Column({ type: 'json', nullable: true })
  ui_config?: UIConfig;

  @Column({ type: 'json', nullable: true })
  ia_config?: IAConfig;

  @Column({ type: 'varchar', length: 50, nullable: true })
  family_type?: 'administration' | 'rrhh' | 'it' | 'entrepreneurship';

  @Column({ type: 'json', nullable: true })
  calculator_config?: CalculatorConfig;

  @Column({ type: 'json', nullable: true })
  inbox_config?: InboxConfig;

  @Column({ type: 'json', nullable: true })
  validation_rules?: ValidationRules;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // NUEVO: Relaciones para Ficha Técnica y Prompts
  @Column({ type: 'int', nullable: true })
  tech_sheet_id?: number;

  @ManyToOne(() => TechSheet, { nullable: true })
  @JoinColumn({ name: 'tech_sheet_id' })
  tech_sheet?: TechSheet;

  @Column({ type: 'int', nullable: true })
  prompt_template_id?: number;

  @ManyToOne(() => PromptTemplate, { nullable: true })
  @JoinColumn({ name: 'prompt_template_id' })
  prompt_template?: PromptTemplate;

  @Column({
    type: 'enum',
    enum: ['template', 'manual', 'guided'],
    default: 'template'
  })
  prompt_generation_mode!: 'template' | 'manual' | 'guided';

  @Column({ type: 'varchar', length: 36, nullable: true })
  prompt_generated_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  prompt_generated_at?: Date;

  @OneToOne(() => Course, (course) => course.config)
  @JoinColumn({ name: 'course_id' })
  course?: Course;
}

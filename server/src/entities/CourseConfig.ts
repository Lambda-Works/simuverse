import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Course } from './Course';

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

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'json' })
  active_modules!: ModuleActivation[];

  @Column({ type: 'json' })
  ui_config!: UIConfig;

  @Column({ type: 'json' })
  ia_config!: IAConfig;

  @Column({ type: 'json', nullable: true })
  calculator_config?: CalculatorConfig;

  @Column({ type: 'json', nullable: true })
  inbox_config?: InboxConfig;

  @Column({ type: 'text', nullable: true })
  family_type!: 'administration' | 'rrhh' | 'it' | 'entrepreneurship';

  @Column({ type: 'json', nullable: true })
  validation_rules?: ValidationRules;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToOne(() => Course, (course) => course.config)
  @JoinColumn({ name: 'course_id' })
  course?: Course;
}

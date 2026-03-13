import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Scenario } from './Scenario';
import { Course } from './Course';

/**
 * ScenarioConfig Entity (NUEVA - CRÍTICA)
 * 
 * ⭐ SOLUCIONA EL GAP DETECTADO ⭐
 * 
 * Problema: Todos los escenarios de un curso usan CourseConfig global
 * No hay forma de personalizar IA, crisis, fórmulas, emails por escenario
 * 
 * Solución: ScenarioConfig permite override de configuración a nivel escenario
 * 
 * Patrón de herencia:
 * - Si ScenarioConfig.ia_config existe → USAR
 * - Si no → heredar de CourseConfig.ia_config
 * - Aplica para todos los campos: ia, crisis, modules, etc.
 * 
 * Ejemplo uso:
 * 
 * CourseConfig (global):
 * {
 *   ia_config: { systemPrompt: "Eres jefe directo", temperature: 0.7 }
 *   crisis_events: [{ id: 1, name: "Cliente enojado" }]
 * }
 * 
 * ScenarioConfig (específico):
 * {
 *   scenario_id: "scenario_123",
 *   ia_config: { systemPrompt: "Eres cliente hostil", temperature: 0.9 } // OVERRIDE
 *   crisis_events: null // Hereda del curso
 * }
 * 
 * Cuando estudiante practica scenario_123:
 * - Usa ia_config de ScenarioConfig (cliente hostil, más agresivo)
 * - Hereda crisis_events de CourseConfig
 * 
 * Cuando practica scenario_456 sin ScenarioConfig:
 * - Usa todo de CourseConfig (por defecto)
 */
@Entity('scenario_configs')
export class ScenarioConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  scenario_id: string;

  @OneToOne(() => Scenario, (scenario) => scenario.config)
  @JoinColumn({ name: 'scenario_id' })
  scenario: Scenario;

  @Column()
  course_id: string;

  @ManyToOne(() => Course, (course) => course.scenario_configs)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  // ─────────────────────────────────────────────────────────────────────
  // IA CONFIGURATION (Override de CourseConfig.ia_config)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Configuración de IA específica para este escenario
   * Si es null, hereda de CourseConfig.ia_config
   * 
   * {
   *   systemPrompt: "Eres...",
   *   temperature: 0.7,
   *   model: "gemini-pro",
   *   maxTokens: 1024,
   *   personality: "Sé agresivo si el cliente..."
   * }
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Override de IA config. Null = heredar de curso',
  })
  ia_config: {
    systemPrompt?: string;
    temperature?: number;
    model?: string;
    maxTokens?: number;
    personality?: string;
    [key: string]: any;
  } | null;

  // ─────────────────────────────────────────────────────────────────────
  // CRISIS EVENTS (Override de Course.crisis_events)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Eventos de crisis específicos para este escenario
   * Si es null, hereda de Course.crisis_events
   * 
   * [
   *   {
   *     id: "crisis_1",
   *     name: "Cliente reclama",
   *     trigger: "salary_mentioned",
   *     probability: 0.7,
   *     message: "¡Espera! La nómina está mal calculada!"
   *   },
   *   {
   *     id: "crisis_2",
   *     name: "Empleado se va",
   *     trigger: "termination_mentioned",
   *     probability: 0.9
   *   }
   * ]
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Crisis events específicos. Null = heredar de curso',
  })
  crisis_events: Array<{
    id: string;
    name: string;
    trigger: string;
    probability: number;
    message?: string;
    response_options?: string[];
  }> | null;

  // ─────────────────────────────────────────────────────────────────────
  // MODULE CONFIGURATION (Override de CourseConfig.active_modules)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Módulos disponibles en este escenario (override)
   * Si es null, hereda de CourseConfig.active_modules
   * 
   * [
   *   {
   *     moduleId: "chat_ia",
   *     enabled: true,
   *     config: {
   *       allowHints: true,
   *       responseDelay: 0
   *     }
   *   },
   *   {
   *     moduleId: "inbox",
   *     enabled: true,
   *     config: {
   *       initialEmails: 2,
   *       canCreateNewEmails: true
   *     }
   *   }
   * ]
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Active modules override. Null = heredar del curso',
  })
  scenario_modules: Array<{
    moduleId: string;
    enabled: boolean;
    config?: Record<string, any>;
  }> | null;

  // ─────────────────────────────────────────────────────────────────────
  // INBOX CONFIGURATION (Override)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Configuración específica de Inbox (correos)
   * Si es null, hereda de CourseConfig.inbox_config
   * 
   * {
   *   initialEmails: [
   *     {
   *       from: "jefe@empresa.com",
   *       subject: "Urgente: necesito liquidación",
   *       body: "...",
   *       timestamp: "2026-03-09T08:00:00Z"
   *     }
   *   ],
   *   eventTriggers: [
   *     {
   *       event: "salary_calculated",
   *       triggerEmail: { from: "...", subject: "..." }
   *     }
   *   ],
   *   canReceiveEmails: true,
   *   canSendEmails: true
   * }
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Inbox config override. Null = heredar del curso',
  })
  inbox_config: Record<string, any> | null;

  // ─────────────────────────────────────────────────────────────────────
  // CALCULATOR CONFIGURATION (Override)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Configuración específica de Planilla de Cálculo
   * Si es null, hereda de CourseConfig.calculator_config
   * 
   * {
   *   formulas: {
   *     "cell_B2": "=A2*1.05",
   *     "cell_B3": "=A3*0.15"
   *   },
   *   availableFunctions: ["SUM", "AVG", "IF", "ROUND"],
   *   lockedCells: ["A1", "A2"],
   *   showGrid: true,
   *   decimals: 2
   * }
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Calculator config override. Null = heredar del curso',
  })
  calculator_config: Record<string, any> | null;

  // ─────────────────────────────────────────────────────────────────────
  // UI CONFIGURATION (Override)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Configuración específica de UI para este escenario
   * Si es null, hereda de CourseConfig.ui_config
   * 
   * {
   *   theme: "dark",
   *   layout: "classic|modern|minimal",
   *   colors: {
   *     primary: "#FF0000",
   *     danger: "#FF6666"
   *   },
   *   showTimer: true,
   *   timerLimit: 900 // 15 minutos
   * }
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'UI config override. Null = heredar del curso',
  })
  ui_config: Record<string, any> | null;

  // ─────────────────────────────────────────────────────────────────────
  // DOCUMENTS CONFIGURATION (Override)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Documentos disponibles para este escenario
   * Si es null, hereda de CourseConfig
   * 
   * {
   *   availableDocuments: [
   *     {
   *       id: "doc_1",
   *       title: "Normativa de Nómina",
   *       url: "/docs/nomina.pdf",
   *       canDownload: true
   *     }
   *   ]
   * }
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Documents config override. Null = heredar del curso',
  })
  documents_config: Record<string, any> | null;

  // ─────────────────────────────────────────────────────────────────────
  // CONSTRAINT HINTS (Para fallback offline)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Constraints/restricciones del escenario
   * Usadas para generar hints y fallback responses inteligentes
   * 
   * [
   *   "Debes seguir la normativa de 2026",
   *   "No puedes ofrecer menos del mínimo legal",
   *   "El cliente solo acepta hasta el 20% de comisión"
   * ]
   */
  @Column({
    type: 'json',
    nullable: true,
  })
  constraints: string[] | null;

  // ─────────────────────────────────────────────────────────────────────
  // METADATA & CONTROL
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Si esta configuración está activa
   * Permite desactivar sin eliminar
   */
  @Column({ default: true })
  is_active: boolean;

  /**
   * Quién creó esta configuración (admin_id)
   */
  @Column({ nullable: true })
  created_by: string;

  /**
   * Notas sobre la configuración
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /**
   * Versión de la configuración (para control de cambios)
   */
  @Column({ default: 1 })
  version: number;

  /**
   * Si está en sincronización con servidor
   */
  @Column({ default: false })
  is_syncing: boolean;

  /**
   * Última sincronización exitosa
   */
  @Column({ type: 'timestamp', nullable: true })
  last_synced_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

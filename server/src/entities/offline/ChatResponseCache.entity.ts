import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SimulationInstance } from '../SimulationInstance.entity';
import { Scenario } from '../Scenario.entity';

/**
 * ChatResponseCache Entity
 * 
 * Almacena respuestas de chat pre-generadas para modo offline
 * 
 * Estrategia:
 * 1. Admin configura escenario
 * 2. Sistema pre-genera respuestas comunes con IA
 * 3. Se guardan en base de datos
 * 4. Offline: se sirven de la BD en lugar de caer a fallback simple
 * 
 * Ejemplo:
 * Pregunta: "¿Cuáles son los pasos correctos?"
 * Respuesta cached: "Según normativa XYZ, los pasos son: 1) ... 2) ... 3)"
 * (Generada con IA antes de offline, guardada en BD)
 */
@Entity('chat_response_cache')
@Index(['scenario_id', 'question_hash'])
@Index(['family_type'])
@Index(['created_at'])
export class ChatResponseCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scenario_id: string;

  @ManyToOne(() => Scenario)
  @JoinColumn({ name: 'scenario_id' })
  scenario: Scenario;

  /**
   * Familia de curso para agrupar respuestas
   * rrhh | it | administración | emprendimiento
   */
  @Column({ type: 'varchar', length: 50 })
  family_type: string;

  /**
   * Pregunta original (o patrón) que genera esta respuesta
   * Ejemplos:
   * - "¿Cuáles son los pasos?"
   * - "¿Qué normativa aplica?"
   * - "procedimiento|proceso|pasos"
   */
  @Column({ type: 'text' })
  question: string;

  /**
   * Hash de la pregunta para búsqueda rápida
   */
  @Column()
  question_hash: string;

  /**
   * Categoría de pregunta para agrupación
   * general, procedimiento, normativa, salarios, contratos, etc.
   */
  @Column({ type: 'varchar', length: 100 })
  category: string;

  /**
   * Respuesta pre-generada con IA
   * Incluye contexto del escenario
   */
  @Column({ type: 'longtext' })
  response: string;

  /**
   * Tokens utilizados por IA al generar
   */
  @Column({ type: 'int', nullable: true })
  tokens_used: number | null;

  /**
   * Modelo que generó la respuesta
   * gemini-1.5-flash, gpt-4, etc.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  /**
   * Score de relevancia (0-100)
   * Generado por IA o manual
   */
  @Column({ type: 'int', default: 100 })
  relevance_score: number;

  /**
   * Metadatos:
   * {
   *   generatedAt: "2026-03-09T10:00:00Z",
   *   generatedBy: "admin_id",
   *   temperature: 0.7,
   *   contextSnippet: "Escenario de liquidación mensual"
   * }
   */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  /**
   * Cuántas veces fue usada (para estadísticas)
   */
  @Column({ type: 'int', default: 0 })
  usage_count: number;

  /**
   * Última vez que fue usada
   */
  @Column({ type: 'timestamp', nullable: true })
  last_used: Date | null;

  /**
   * Si está validada por experto humano
   */
  @Column({ default: false })
  is_validated: boolean;

  /**
   * Notas de validación o mejora
   */
  @Column({ type: 'text', nullable: true })
  validation_notes: string | null;

  @CreateDateColumn()
  created_at: Date;
}

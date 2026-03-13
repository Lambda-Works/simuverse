import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { KPI } from '../KPI';
import { Scenario } from '../Scenario';

/**
 * EvaluationCache Entity
 * 
 * Almacena rúbricas de evaluación y criterios cacheados
 * Permite evaluaciones inteligentes offline
 * 
 * Flujo:
 * 1. Admin crea KPI
 * 2. Sistema genera rúbrica detallada con IA
 * 3. Se guarda en esta tabla
 * 4. Offline: evaluaciones usan rúbrica cacheada en lugar de IA
 * 5. Resultado: evaluaciones 85% tan buenas como con IA
 * 
 * Ejemplo:
 * KPI: "Exactitud en cálculo de nómina"
 * Rúbrica cacheada:
 * {
 *   "5 estrellas": "Cálculo 100% exacto, considera todos los conceptos",
 *   "4 estrellas": "98-99% exacto, un concepto olvidado",
 *   "3 estrellas": "95-97% exacto, algunos conceptos omitidos",
 *   "2 estrellas": "90-94% exacto, lógica básica presente",
 *   "1 estrella": "Menos de 90%, errores conceptuales"
 * }
 */
@Entity('evaluation_cache')
@Index(['kpi_id', 'scenario_id'])
@Index(['created_at'])
export class EvaluationCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kpi_id: string;

  @ManyToOne(() => KPI)
  @JoinColumn({ name: 'kpi_id' })
  kpi: KPI;

  @Column()
  scenario_id: string;

  @ManyToOne(() => Scenario)
  @JoinColumn({ name: 'scenario_id' })
  scenario: Scenario;

  /**
   * Tipo de evaluación
   * rubric | exemplars | checklist | scoring_guide
   */
  @Column({ type: 'varchar', length: 50 })
  evaluation_type: 'rubric' | 'exemplars' | 'checklist' | 'scoring_guide';

  /**
   * Rúbrica detallada para evaluar
   * Estructura por niveles de desempeño
   * 
   * Ejemplo:
   * {
   *   "excellent": {
   *     "score": 5,
   *     "criteria": ["...", "...", "..."],
   *     "indicators": ["...", "..."]
   *   },
   *   "good": { ... },
   *   "satisfactory": { ... },
   *   "needs_improvement": { ... },
   *   "incomplete": { ... }
   * }
   */
  @Column({ type: 'longtext' })
  rubric_definition: string; // JSON stringified

  /**
   * Ejemplos de respuestas buenas/malas
   * Para reference durante evaluación
   * 
   * {
   *   "excellent": {
   *     "example": "El estudiante escribió...",
   *     "explanation": "Por qué es excelente..."
   *   },
   *   "poor": {
   *     "example": "Error común: El estudiante...",
   *     "explanation": "Por qué está mal..."
   *   }
   * }
   */
  @Column({ type: 'longtext', nullable: true })
  exemplars: string | null;

  /**
   * Checklist de puntos a verificar
   * Array de criterios concretos
   * 
   * ["Incluye cálculo de sueldo base",
   *  "Aplica bonificaciones",
   *  "Considera impuestos",
   *  "Resultado > 0"]
   */
  @Column({ type: 'longtext' })
  checklist_items: string;

  /**
   * Instrucciones para evaluar
   * Cómo usar esta rúbrica
   */
  @Column({ type: 'text', nullable: true })
  evaluation_instructions: string | null;

  /**
   * Puntuación máxima posible
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  max_score: number;

  /**
   * Puntuación mínima de aprobación
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 60 })
  passing_score: number;

  /**
   * Metadatos:
   * {
   *   generatedAt: "2026-03-09T...",
   *   generatedBy: "system",
   *   temperature: 0.5,
   *   complexity: "moderate"
   * }
   */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  /**
   * Veces que fue usada esta rúbrica
   */
  @Column({ type: 'int', default: 0 })
  usage_count: number;

  /**
   * Última vez que fue usada
   */
  @Column({ type: 'timestamp', nullable: true })
  last_used: Date | null;

  /**
   * Si está validada y es confiable
   */
  @Column({ default: false })
  is_validated: boolean;

  /**
   * Notas de mejora o ajustes necesarios
   */
  @Column({ type: 'text', nullable: true })
  validation_notes: string | null;

  /**
   * Tasa de consistencia con evaluaciones reales
   * 0-100%, qué tan bien predice scores reales
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  consistency_score: number | null;

  @CreateDateColumn()
  created_at: Date;
}

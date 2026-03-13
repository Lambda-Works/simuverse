import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SimulationInstance } from '../SimulationInstance';
import { Scenario } from '../Scenario';

/**
 * OfflineSession Entity
 * 
 * Registra sesiones offline completas
 * Permite sincronización después de que regresa conexión
 * 
 * Flujo:
 * 1. Estudiante abre simulación con conexión
 * 2. Se crea OfflineSession
 * 3. Estudiante se desconecta
 * 4. Continúa practicando, datos se guardan localmente
 * 5. Regresa conexión
 * 6. OfflineSession se sincroniza con servidor
 * 7. Se integran cambios y se evalúan
 */
@Entity('offline_sessions')
@Index(['simulation_instance_id'])
@Index(['status', 'created_at'])
export class OfflineSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  simulation_instance_id: string;

  @ManyToOne(() => SimulationInstance)
  @JoinColumn({ name: 'simulation_instance_id' })
  simulation_instance: SimulationInstance;

  @Column()
  scenario_id: string;

  @ManyToOne(() => Scenario)
  @JoinColumn({ name: 'scenario_id' })
  scenario: Scenario;

  /**
   * Estado de la sesión offline
   * active: En curso, datos se están guardando
   * paused: Pausada, esperando
   * syncing: Sincronizando con servidor
   * synced: Completada, datos sincronizados
   * error: Error en sincronización
   */
  @Column({ default: 'active' })
  status: 'active' | 'paused' | 'syncing' | 'synced' | 'error';

  /**
   * Timestamp cuando se inició sesión offline
   */
  @Column({ type: 'timestamp' })
  started_at: Date;

  /**
   * Timestamp cuando se detectó desconexión
   */
  @Column({ type: 'timestamp', nullable: true })
  disconnected_at: Date | null;

  /**
   * Timestamp cuando regresó conexión
   */
  @Column({ type: 'timestamp', nullable: true })
  reconnected_at: Date | null;

  /**
   * Timestamp cuando se completó sincronización
   */
  @Column({ type: 'timestamp', nullable: true })
  synced_at: Date | null;

  /**
   * Datos de la simulación durante sesión offline
   * {
   *   currentState: { ... },
   *   actions: [ { type, data, timestamp }, ... ],
   *   responses: [ { questionId, answer, timestamp }, ... ],
   *   events: [ { eventId, triggered, timestamp }, ... ]
   * }
   */
  @Column({ type: 'longtext' })
  session_data: string; // JSON stringified

  /**
   * Eventos que ocurrieron durante sesión
   * Array de acciones del estudiante
   */
  @Column({ type: 'longtext' })
  action_log: string; // JSON stringified array

  /**
   * Cuánto tiempo estuvo offline (en segundos)
   */
  @Column({ type: 'int', nullable: true })
  offline_duration_seconds: number | null;

  /**
   * Cuántos datos se generaron (bytes)
   */
  @Column({ type: 'int', default: 0 })
  data_size_bytes: number;

  /**
   * Si hay conflictos de sincronización
   * Array de conflictos encontrados
   */
  @Column({ type: 'json', nullable: true })
  sync_conflicts: Array<{
    type: 'state_conflict' | 'action_conflict' | 'data_mismatch';
    description: string;
    resolution: string;
  }> | null;

  /**
   * Resultado de sincronización
   * {
   *   successCount: 150,
   *   conflictCount: 2,
   *   errorCount: 0,
   *   summary: "..."
   * }
   */
  @Column({ type: 'json', nullable: true })
  sync_result: Record<string, any> | null;

  /**
   * Mensajes de error si la sincronización falló
   */
  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  /**
   * Metadatos sobre la sesión
   * {
   *   userAgent: "...",
   *   deviceType: "mobile|tablet|desktop",
   *   networkQuality: "poor|fair|good",
   *   cacheHits: 150,
   *   cacheMisses: 10
   * }
   */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

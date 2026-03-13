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
import { Course } from '../Course';

/**
 * OfflineCache Entity
 * 
 * Almacena datos necesarios para modo offline:
 * - Escenarios completos
 * - KPIs y criterios de evaluación
 * - Configuraciones de módulos
 * - Crisis events
 * 
 * Se pre-cachea cuando hay conexión
 * Se sincroniza cuando regresa conexión
 */
@Entity('offline_cache')
@Index(['course_id', 'cache_type'])
@Index(['last_synced'])
export class OfflineCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  course_id: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  /**
   * Tipos de datos cacheados:
   * - 'full_course': Curso completo (escenarios, KPIs, tareas)
   * - 'scenarios': Escenarios del curso
   * - 'kpis': KPIs y criterios
   * - 'tasks': Tareas autogeneradas
   * - 'crisis_events': Eventos de crisis
   * - 'module_configs': Configuraciones de módulos
   */
  @Column({ type: 'varchar', length: 50 })
  cache_type: 'full_course' | 'scenarios' | 'kpis' | 'tasks' | 'crisis_events' | 'module_configs';

  /**
   * Datos JSON comprimidos para almacenar
   * Incluye todo lo necesario para funcionar sin internet
   */
  @Column({ type: 'longtext' })
  cache_data: string; // JSON stringified

  /**
   * Hash para detectar cambios
   * Sirve para saber si ya está cacheado
   */
  @Column()
  data_hash: string;

  /**
   * Tamaño en bytes para monitoreo
   */
  @Column({ type: 'int' })
  size_bytes: number;

  /**
   * Última sincronización exitosa
   */
  @Column({ type: 'timestamp', nullable: true })
  last_synced: Date | null;

  /**
   * Versión de los datos (para migración)
   */
  @Column({ default: 1 })
  version: number;

  /**
   * Si está listo para usar offline
   */
  @Column({ default: false })
  is_ready_offline: boolean;

  /**
   * Metadatos sobre qué incluye el cache
   * { itemCount: 5, lastModified: "2026-03-09T...", compressionRatio: 0.45 }
   */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

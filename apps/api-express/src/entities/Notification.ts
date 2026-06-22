import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { SimulationInstance } from './SimulationInstance';

export type NotificationType = 
  | 'simulation_completed'
  | 'feedback_received'
  | 'kpi_achieved'
  | 'kpi_failed'
  | 'course_assigned'
  | 'evaluation_ready'
  | 'system_alert';

/**
 * Notificaciones del sistema
 * Alertan a profesores, ministerio, etc. sobre eventos importantes
 */
@Entity('notifications')
@Index(['recipient_id'])
@Index(['type'])
@Index(['is_read'])
@Index(['created_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  recipient_id!: string; // A quién va la notificación

  @Column({ type: 'uuid', nullable: true })
  actor_id?: string; // Quién provocó la notificación

  @Column({ type: 'uuid', nullable: true })
  simulation_instance_id?: string; // Simulación relacionada

  @Column({ type: 'varchar', length: 50 })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'json', nullable: true })
  metadata!: {
    student_name?: string;
    course_name?: string;
    kpi_name?: string;
    achievement_rate?: number;
    action_url?: string; // Dónde ir al hacer click
  };

  // Seguimiento
  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date;

  @Column({ type: 'boolean', default: false })
  is_sent!: boolean; // ¿Se envió por email?

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @ManyToOne(() => User, user => user.notifications_received, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient!: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: User;

  @ManyToOne(() => SimulationInstance, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'simulation_instance_id' })
  simulation_instance?: SimulationInstance;
}

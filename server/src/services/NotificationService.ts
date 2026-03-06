import { AppDataSource } from '../database/connection';
import { Notification, NotificationType } from '../entities/Notification';
import { User } from '../entities/User';
import { Repository } from 'typeorm';

/**
 * Servicio de notificaciones
 * Alertar a profesores, ministerio, estudiantes sobre eventos importantes
 */
export class NotificationService {
  private notificationRepository: Repository<Notification>;
  private userRepository: Repository<User>;

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Crear una notificación
   */
  async createNotification(data: {
    recipient_id: string;
    actor_id?: string;
    simulation_instance_id?: string;
    type: NotificationType;
    title: string;
    content: string;
    metadata?: any;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    return await this.notificationRepository.save(notification);
  }

  /**
   * Notificar cuando estudiante completa simulación
   */
  async notifySimulationCompleted(
    student_id: string,
    student_name: string,
    course_id: string,
    course_name: string,
    simulation_instance_id: string,
    teacher_ids: string[]
  ): Promise<void> {
    for (const teacher_id of teacher_ids) {
      await this.createNotification({
        recipient_id: teacher_id,
        actor_id: student_id,
        simulation_instance_id,
        type: 'simulation_completed',
        title: `${student_name} completó la simulación`,
        content: `El estudiante ${student_name} completó la simulación del curso ${course_name}. Requiere revisión.`,
        metadata: {
          student_name,
          course_name,
          action_url: `/admin/simulations/${simulation_instance_id}`
        }
      });
    }
  }

  /**
   * Notificar cuando KPI es alcanzado
   */
  async notifyKPIAchieved(
    student_id: string,
    student_name: string,
    kpi_name: string,
    achievement_rate: number,
    recipient_ids: string[]
  ): Promise<void> {
    for (const recipient_id of recipient_ids) {
      await this.createNotification({
        recipient_id,
        actor_id: student_id,
        type: 'kpi_achieved',
        title: `KPI alcanzado: ${kpi_name}`,
        content: `${student_name} alcanzó el KPI "${kpi_name}" con ${achievement_rate}% de efectividad.`,
        metadata: {
          student_name,
          kpi_name,
          achievement_rate
        }
      });
    }
  }

  /**
   * Notificar cuando KPI NO es alcanzado
   */
  async notifyKPIFailed(
    student_id: string,
    student_name: string,
    kpi_name: string,
    achievement_rate: number,
    recipient_ids: string[]
  ): Promise<void> {
    for (const recipient_id of recipient_ids) {
      await this.createNotification({
        recipient_id,
        actor_id: student_id,
        type: 'kpi_failed',
        title: `KPI no alcanzado: ${kpi_name}`,
        content: `${student_name} no alcanzó el KPI "${kpi_name}". Logró ${achievement_rate}%.`,
        metadata: {
          student_name,
          kpi_name,
          achievement_rate
        }
      });
    }
  }

  /**
   * Obtener notificaciones no leídas de un usuario
   */
  async getUnreadNotifications(user_id: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { recipient_id: user_id, is_read: false },
      relations: ['actor', 'simulation_instance'],
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Obtener todas las notificaciones de un usuario
   */
  async getUserNotifications(
    user_id: string,
    limit = 50,
    offset = 0
  ): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { recipient_id: user_id },
      relations: ['actor', 'simulation_instance'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(id: string): Promise<Notification> {
    await this.notificationRepository.update(
      { id },
      { is_read: true, read_at: new Date() }
    );
    const updated = await this.getNotificationById(id);
    if (!updated) throw new Error('Notification not found');
    return updated;
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(user_id: string): Promise<void> {
    await this.notificationRepository.update(
      { recipient_id: user_id, is_read: false },
      { is_read: true, read_at: new Date() }
    );
  }

  /**
   * Obtener notificación por ID
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    return await this.notificationRepository.findOne({
      where: { id },
      relations: ['actor', 'recipient', 'simulation_instance']
    });
  }

  /**
   * Contar notificaciones no leídas
   */
  async countUnread(user_id: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { recipient_id: user_id, is_read: false }
    });
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(id: string): Promise<void> {
    await this.notificationRepository.delete({ id });
  }

  /**
   * Limpiar notificaciones antiguas (más de 30 días)
   */
  async cleanupOldNotifications(days = 30): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await this.notificationRepository.delete({
      created_at: require('typeorm').LessThan(date)
    });

    return result.affected || 0;
  }
}

export const notificationService = new NotificationService();

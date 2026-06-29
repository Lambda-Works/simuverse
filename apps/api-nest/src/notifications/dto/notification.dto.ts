import { IsString, IsUUID, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

export enum NotificationType {
  simulation_completed = 'simulation_completed',
  feedback_received = 'feedback_received',
  kpi_achieved = 'kpi_achieved',
  kpi_failed = 'kpi_failed',
  course_assigned = 'course_assigned',
  evaluation_ready = 'evaluation_ready',
  system_alert = 'system_alert',
}

export class CreateNotificationDto {
  @IsUUID()
  recipient_id: string;

  @IsUUID()
  @IsOptional()
  actor_id?: string;

  @IsUUID()
  @IsOptional()
  simulation_instance_id?: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  is_read?: boolean;
}

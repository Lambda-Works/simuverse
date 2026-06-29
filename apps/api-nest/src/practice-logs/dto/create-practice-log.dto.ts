import { IsString, IsUUID, IsEnum, IsOptional, IsObject, IsNumber } from 'class-validator';

export enum ActionType {
  calculation = 'calculation',
  document_upload = 'document_upload',
  email_read = 'email_read',
  email_reply = 'email_reply',
  message_sent = 'message_sent',
  decision_made = 'decision_made',
  case_submitted = 'case_submitted',
  case_approved = 'case_approved',
  case_rejected = 'case_rejected',
  system_event = 'system_event',
  crisis_triggered = 'crisis_triggered',
  evaluation_completed = 'evaluation_completed',
}

export class CreatePracticeLogDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  course_id: string;

  @IsUUID()
  @IsOptional()
  simulation_instance_id?: string;

  @IsEnum(ActionType)
  action_type: ActionType;

  @IsString()
  description: string;

  @IsObject()
  metadata: Record<string, any>;

  @IsString()
  @IsOptional()
  docenter_notes?: string;
}

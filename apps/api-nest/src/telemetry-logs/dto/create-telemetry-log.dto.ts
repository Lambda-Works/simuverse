import { IsString, IsUUID, IsEnum, IsOptional, IsObject, IsNumber } from 'class-validator';

export enum TelemetryActionType {
  user_input = 'user_input',
  system_action = 'system_action',
  ai_response = 'ai_response',
  decision = 'decision',
  error = 'error',
  state_change = 'state_change',
}

export class CreateTelemetryLogDto {
  @IsUUID()
  simulation_id: string;

  @IsUUID()
  user_id: string;

  @IsUUID()
  course_id: string;

  @IsString()
  action: string;

  @IsEnum(TelemetryActionType)
  action_type: TelemetryActionType;

  @IsNumber()
  response_time_ms: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

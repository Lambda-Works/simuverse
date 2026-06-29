import { IsOptional, IsDateString, IsInt, IsEnum, Min } from 'class-validator';

export enum AssignmentStatusEnum {
  pending = 'pending',
  in_progress = 'in_progress',
  completed = 'completed',
  expired = 'expired',
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_attempts?: number;

  @IsOptional()
  @IsEnum(AssignmentStatusEnum)
  status?: AssignmentStatusEnum;
}

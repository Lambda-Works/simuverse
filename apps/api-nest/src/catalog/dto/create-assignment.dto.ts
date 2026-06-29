import { IsString, IsOptional, IsInt, IsDateString, MinLength, Min } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @MinLength(1)
  simulation_id: string;

  @IsString()
  @MinLength(1)
  student_id: string;

  @IsString()
  @MinLength(1)
  course_id: string;

  @IsString()
  @MinLength(1)
  assigned_by: string;

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
}

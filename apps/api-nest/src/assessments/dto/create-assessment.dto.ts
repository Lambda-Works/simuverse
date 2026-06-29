import { IsString, IsOptional, IsObject, IsInt, MinLength } from 'class-validator';

export class CreateAssessmentDto {
  @IsString()
  @MinLength(1)
  simulation_id: string;

  @IsString()
  @MinLength(1)
  user_id: string;

  @IsString()
  @MinLength(1)
  course_id: string;

  @IsOptional()
  @IsObject()
  kpis?: any;

  @IsOptional()
  @IsString()
  ai_evaluation?: string;

  @IsOptional()
  @IsString()
  recommendation?: string;

  @IsOptional()
  @IsObject()
  feedback?: any;
}

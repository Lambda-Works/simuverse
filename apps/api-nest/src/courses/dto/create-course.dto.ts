import { IsString, IsOptional, IsBoolean, IsObject, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MinLength(1)
  course_id: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsObject()
  modules?: any;

  @IsOptional()
  @IsObject()
  ai_config?: any;

  @IsOptional()
  @IsObject()
  eval_criteria?: any;

  @IsOptional()
  @IsObject()
  crisis_events?: any;

  @IsOptional()
  @IsObject()
  categories?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

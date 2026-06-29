import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

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

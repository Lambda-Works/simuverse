import { IsString, IsOptional, IsBoolean, IsObject, IsArray, IsInt } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  course_id?: string;

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
  @IsArray()
  modules?: any;

  @IsOptional()
  @IsObject()
  ai_config?: any;

  @IsOptional()
  @IsArray()
  eval_criteria?: any;

  @IsOptional()
  @IsArray()
  crisis_events?: any;

  @IsOptional()
  @IsArray()
  categories?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  simulated_company_id?: number;

  @IsOptional()
  @IsInt()
  tech_sheet_id?: number;

  @IsOptional()
  @IsString()
  created_by?: string;
}

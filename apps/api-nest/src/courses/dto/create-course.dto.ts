import { IsString, IsOptional, IsBoolean, IsObject, IsArray, IsInt, MinLength } from 'class-validator';

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
  tech_sheet_id?: number;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  endorser_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  company_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  foundation_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  sponsor_ids?: number[];
}

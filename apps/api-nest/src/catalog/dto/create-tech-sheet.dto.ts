import { IsString, IsOptional, IsObject, MinLength } from 'class-validator';

export class CreateTechSheetDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  course_id: string;

  @IsOptional()
  @IsString()
  ministry_code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  competencies?: any;

  @IsOptional()
  @IsObject()
  kpi_requirements?: any;

  @IsOptional()
  @IsString()
  context_scenario?: string;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  uploaded_by?: string;
}

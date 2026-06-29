import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateTechSheetDto {
  @IsOptional()
  @IsString()
  name?: string;

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
  @IsObject()
  extracted_data?: any;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  uploaded_by?: string;
}

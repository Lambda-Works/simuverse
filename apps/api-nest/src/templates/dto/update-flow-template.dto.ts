import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateFlowTemplateDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsString()
  course_code?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  family?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsObject()
  template_data?: any;
}

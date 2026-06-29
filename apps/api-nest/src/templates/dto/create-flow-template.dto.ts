import { IsString, IsOptional, IsBoolean, IsObject, MinLength } from 'class-validator';

export class CreateFlowTemplateDto {
  @IsString()
  @MinLength(1)
  id: string;

  @IsString()
  @MinLength(1)
  course_id: string;

  @IsOptional()
  @IsString()
  course_code?: string;

  @IsString()
  @MinLength(1)
  title: string;

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
  @IsString()
  created_by?: string;

  @IsObject()
  template_data: any;
}

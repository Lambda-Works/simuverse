import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, IsObject, IsArray } from 'class-validator';

export enum FileType {
  pdf = 'pdf',
  docx = 'docx',
  xlsx = 'xlsx',
  png = 'png',
  jpg = 'jpg',
  txt = 'txt',
}

export class CreateMinistryRequirementDto {
  @IsUUID()
  course_id: string;

  @IsUUID()
  @IsOptional()
  uploaded_by_id?: string;

  @IsString()
  file_name: string;

  @IsEnum(FileType)
  file_type: FileType;

  @IsNumber()
  file_size_bytes: number;

  @IsString()
  file_path: string;

  @IsString()
  @IsOptional()
  raw_text?: string;
}

export class UpdateMinistryRequirementDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  raw_text?: string;

  @IsObject()
  @IsOptional()
  extracted_content?: Record<string, any>;

  @IsString()
  @IsOptional()
  processing_notes?: string;

  @IsNumber()
  @IsOptional()
  kpis_generated?: number;

  @IsNumber()
  @IsOptional()
  tasks_generated?: number;

  @IsOptional()
  is_active?: boolean;
}

export class CreateKpiDto {
  @IsUUID()
  course_id: string;

  @IsUUID()
  @IsOptional()
  ministry_requirement_id?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  target_value?: number;

  @IsNumber()
  @IsOptional()
  minimum_pass_value?: number;

  @IsObject()
  @IsOptional()
  thresholds?: Record<string, any>;

  @IsString()
  @IsOptional()
  prompt_instruction?: string;

  @IsString()
  @IsOptional()
  trigger_event?: string;

  @IsString()
  @IsOptional()
  success_criteria?: string;
}

export class ProcessRequirementDto {
  @IsArray()
  @IsOptional()
  extracted_kpis?: Array<{
    name: string;
    description?: string;
    category?: string;
    weight?: number;
    target_value?: number;
    minimum_pass_value?: number;
    prompt_instruction?: string;
    trigger_event?: string;
  }>;
}

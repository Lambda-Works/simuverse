import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum FileUploadType {
  ministry_requirement = 'ministry_requirement',
  scenario_resource = 'scenario_resource',
  student_submission = 'student_submission',
}

export class UpdateFileDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  course_id?: string;

  @IsOptional()
  is_active?: boolean;
}

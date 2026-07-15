import { IsOptional, IsString } from 'class-validator';

export class UpdateTechSheetPromptsDto {
  @IsOptional()
  @IsString()
  system_prompt?: string;

  @IsOptional()
  @IsString()
  coaching_prompt?: string;

  @IsOptional()
  @IsString()
  base_role?: string;

  @IsOptional()
  @IsString()
  course_context?: string;

  @IsOptional()
  @IsString()
  knowledge_base_prompt?: string;
}

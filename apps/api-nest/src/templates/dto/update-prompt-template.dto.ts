import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class UpdatePromptTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  base_role?: string;

  @IsOptional()
  @IsString()
  course_context?: string;

  @IsOptional()
  @IsObject()
  personality_traits?: any;

  @IsOptional()
  @IsString()
  knowledge_base_prompt?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

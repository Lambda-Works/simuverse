import { IsString, IsOptional, IsObject, IsBoolean, MinLength } from 'class-validator';

export class CreatePromptTemplateDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  @MinLength(1)
  base_role: string;

  @IsOptional()
  @IsString()
  course_context?: string;

  @IsOptional()
  @IsObject()
  personality_traits?: any;

  @IsString()
  @MinLength(1)
  knowledge_base_prompt: string;

  @IsOptional()
  @IsString()
  created_by?: string;
}

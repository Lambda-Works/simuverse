import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, MinLength } from 'class-validator';

export class CreateScenarioDto {
  @IsString()
  @MinLength(1)
  course_id: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scenario_type?: string;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'] as const)
  difficulty?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsObject()
  expected_outcomes?: any;

  @IsOptional()
  @IsObject()
  categories?: any;

  @IsOptional()
  @IsObject()
  config?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

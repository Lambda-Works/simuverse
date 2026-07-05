import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class UpdateScenarioDto {
  @IsOptional()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsString()
  title?: string;

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
  content?: any;

  @IsOptional()
  expected_outcomes?: any;

  @IsOptional()
  categories?: any;

  @IsOptional()
  config?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

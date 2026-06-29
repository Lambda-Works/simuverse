import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

export class UpdateScenarioDto {
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

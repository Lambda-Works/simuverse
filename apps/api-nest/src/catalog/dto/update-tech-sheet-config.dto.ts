import { IsOptional, IsArray, IsObject } from 'class-validator';

export class UpdateTechSheetConfigDto {
  @IsOptional()
  @IsArray()
  competencies?: any[];

  @IsOptional()
  @IsArray()
  kpis?: any[];

  @IsOptional()
  @IsArray()
  tasks?: any[];

  @IsOptional()
  @IsObject()
  prompts?: Record<string, any>;
}

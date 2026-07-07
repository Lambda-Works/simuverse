import { IsString, IsOptional } from 'class-validator';

export class CreateSimulationDto {
  @IsString()
  course_id: string;

  @IsOptional()
  @IsString()
  scenario_id?: string;
}

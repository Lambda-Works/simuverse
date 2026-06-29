import { IsUUID, IsOptional } from 'class-validator';

export class CreateSimulationDto {
  @IsUUID()
  course_id: string;

  @IsOptional()
  @IsUUID()
  scenario_id?: string;
}

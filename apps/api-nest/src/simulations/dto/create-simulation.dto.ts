import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSimulationDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsString()
  @IsNotEmpty()
  course_id: string;

  @IsOptional()
  @IsString()
  scenario_id?: string;
}

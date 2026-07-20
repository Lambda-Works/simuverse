import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSponsorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

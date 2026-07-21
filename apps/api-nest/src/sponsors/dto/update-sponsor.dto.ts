import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSponsorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

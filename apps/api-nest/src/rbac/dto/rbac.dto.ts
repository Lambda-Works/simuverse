import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class CreateFunctionalityDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  module: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  route?: string;
}

export class UpdateFunctionalityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  module?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  route?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class AssignPermissionDto {
  @IsString()
  role_name: string;

  @IsNumber()
  functionality_id: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

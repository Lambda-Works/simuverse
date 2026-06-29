import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['student', 'teacher', 'admin', 'ministerio'] as const)
  role?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

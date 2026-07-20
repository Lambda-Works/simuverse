import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { logoUploadOptions, resolveLogoUrl, cleanupOldLogo } from '../files/logo-upload';

// multipart/form-data sends booleans as the strings "true"/"false"
const toBoolean = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value === 'true' : value;

class CreateSimulatedCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  short_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  is_fictional?: boolean;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

class UpdateSimulatedCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  short_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  is_fictional?: boolean;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

@Controller('simulated-companies')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'teacher')
@Permissions('companies.manage')
export class SimulatedCompaniesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return (this.prisma as any).simulatedCompany.findMany();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return (this.prisma as any).simulatedCompany.findUnique({ where: { id: Number(id) } });
  }

  @Post()
  @UseInterceptors(FileInterceptor('logo_file', logoUploadOptions))
  async create(@Body() dto: CreateSimulatedCompanyDto, @UploadedFile() logo_file?: Express.Multer.File) {
    return (this.prisma as any).simulatedCompany.create({
      data: { ...dto, logo_url: resolveLogoUrl(logo_file, dto.logo_url) ?? null },
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('logo_file', logoUploadOptions))
  async update(@Param('id') id: string, @Body() dto: UpdateSimulatedCompanyDto, @UploadedFile() logo_file?: Express.Multer.File) {
    if (logo_file) {
      const existing = await (this.prisma as any).simulatedCompany.findUnique({ where: { id: Number(id) } });
      cleanupOldLogo(existing?.logo_url);
    }

    const data = { ...dto } as any;
    if (logo_file || dto.logo_url !== undefined) {
      data.logo_url = resolveLogoUrl(logo_file, dto.logo_url) ?? null;
    }

    return (this.prisma as any).simulatedCompany.update({ where: { id: Number(id) }, data });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return (this.prisma as any).simulatedCompany.update({ where: { id: Number(id) }, data: { is_active: false } });
  }

  @Put(':id/reactivate')
  async reactivate(@Param('id') id: string) {
    return (this.prisma as any).simulatedCompany.update({ where: { id: Number(id) }, data: { is_active: true } });
  }
}

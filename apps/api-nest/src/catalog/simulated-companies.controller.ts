import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

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
  async create(@Body() dto: CreateSimulatedCompanyDto) {
    return (this.prisma as any).simulatedCompany.create({ data: dto });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSimulatedCompanyDto) {
    return (this.prisma as any).simulatedCompany.update({ where: { id: Number(id) }, data: dto });
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

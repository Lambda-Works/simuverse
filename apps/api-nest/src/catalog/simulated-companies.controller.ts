import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

class CreateSimulatedCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  industry?: string;
}

class UpdateSimulatedCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

@Controller('simulated-companies')
@UseGuards(JwtAuthGuard)
export class SimulatedCompaniesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return (this.prisma as any).simulatedCompany.findMany();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return (this.prisma as any).simulatedCompany.findUnique({ where: { id } });
  }

  @Post()
  async create(@Body() dto: CreateSimulatedCompanyDto) {
    return (this.prisma as any).simulatedCompany.create({ data: dto });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSimulatedCompanyDto) {
    return (this.prisma as any).simulatedCompany.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return (this.prisma as any).simulatedCompany.delete({ where: { id } });
  }
}

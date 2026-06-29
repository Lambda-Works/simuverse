import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

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
  async create(@Body() body: any) {
    return (this.prisma as any).simulatedCompany.create({ data: body });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return (this.prisma as any).simulatedCompany.update({ where: { id }, data: body });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return (this.prisma as any).simulatedCompany.delete({ where: { id } });
  }
}

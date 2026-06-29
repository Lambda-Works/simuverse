import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('access-requests')
export class AccessRequestsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return [];
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return { id, ...body };
  }
}

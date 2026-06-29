import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('teacher-groups')
export class TeacherGroupsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() { return []; }

  @Post()
  async create(@Body() body: any) { return body; }

  @Delete(':id')
  async remove(@Param('id') id: string) { return { id }; }
}

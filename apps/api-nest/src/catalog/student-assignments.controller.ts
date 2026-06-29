import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('student-assignments')
export class StudentAssignmentsController {
  constructor(private prisma: PrismaService) {}

  @Get(':studentId')
  async findByStudent(@Param('studentId') studentId: string) {
    return [];
  }
}

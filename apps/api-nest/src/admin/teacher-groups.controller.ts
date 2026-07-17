import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('teacher-groups')
@Roles('admin', 'teacher')
@UseGuards(RolesGuard)
export class TeacherGroupsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    const groups = await this.prisma.teacherGroup.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    // Fetch users for mapping
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    const userMap = new Map<string, any>(users.map(u => [u.id, u]));

    return groups.map(g => {
      const teacher = userMap.get(g.teacher_id);
      const student = userMap.get(g.student_id);
      return {
        id: g.id,
        teacher_id: g.teacher_id,
        teacher_name: teacher?.name || 'Unknown',
        teacher_email: teacher?.email || '',
        student_id: g.student_id,
        student_name: student?.name || 'Unknown',
        student_email: student?.email || '',
        created_at: g.created_at,
      };
    });
  }

  @Post()
  async create(@Body() body: { teacher_id: string, student_id: string }) {
    if (!body.teacher_id || !body.student_id) {
      throw new Error('teacher_id and student_id are required');
    }
    
    const existing = await this.prisma.teacherGroup.findUnique({
      where: {
        teacher_id_student_id: {
          teacher_id: body.teacher_id,
          student_id: body.student_id
        }
      }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.teacherGroup.create({
      data: {
        teacher_id: body.teacher_id,
        student_id: body.student_id,
      }
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.teacherGroup.delete({
      where: { id: parseInt(id, 10) }
    });
  }
}

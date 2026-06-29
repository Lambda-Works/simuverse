import { Controller, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('request-access')
export class RequestAccessController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async request(@Body() body: any) {
    await (this.prisma as any).$queryRawUnsafe(
      `INSERT INTO access_requests (student_id, course_id, student_name, student_email, course_name, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      body.student_id || '', body.course_id || '', body.student_name || '',
      body.student_email || '', body.course_name || '', body.reason || ''
    );
    return { success: true, message: 'Solicitud enviada' };
  }
}

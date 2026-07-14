import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

class RequestAccessDto {
  @IsString()
  student_id: string;

  @IsOptional()
  @IsString()
  course_id: string;

  @IsString()
  student_name: string;

  @IsEmail()
  student_email: string;

  @IsOptional()
  @IsString()
  course_name: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller('request-access')
@UseGuards(JwtAuthGuard)
export class RequestAccessController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Post()
  async request(@Body() body: RequestAccessDto) {
    await this.prisma.accessRequest.create({
      data: {
        student_id: body.student_id,
        course_id: body.course_id || '',
        student_name: body.student_name,
        student_email: body.student_email,
        course_name: body.course_name || '',
        reason: body.reason || '',
        status: 'pending',
      },
    });
    return { success: true, message: 'Solicitud enviada' };
  }
}

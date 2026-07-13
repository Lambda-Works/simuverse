import { Controller, Get, Put, Param, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

class UpdateAccessRequestDto {
  @IsString()
  @IsIn(['approved', 'rejected', 'pending'])
  status: string;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}

@Controller('access-requests')
@UseGuards(JwtAuthGuard)
export class AccessRequestsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    if (status) {
      return this.prisma.accessRequest.findMany({
        where: { status },
        orderBy: { created_at: 'desc' },
      });
    }
    return this.prisma.accessRequest.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.prisma.accessRequest.findUnique({
      where: { id: parseInt(id) },
    });
    if (!result) {
      throw new NotFoundException(`Access request ${id} not found`);
    }
    return result;
  }



  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAccessRequestDto) {
    // Note: admin_notes is in DTO but not in DB schema, so we ignore it
    const updated = await this.prisma.accessRequest.update({
      where: { id: parseInt(id) },
      data: { 
        status: body.status,
        updated_at: new Date()
      },
    });

    if (body.status === 'approved') {
      await this.prisma.simulationAssignment.create({
        data: {
          simulation_id: 'sim-' + Date.now(),
          student_id: updated.student_id,
          course_id: updated.course_id,
          assigned_by: 'admin',
          status: 'pending'
        }
      });
    }

    return updated;
  }
}

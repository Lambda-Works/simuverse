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
      return this.prisma.$queryRawUnsafe(
        `SELECT * FROM access_requests WHERE status = $1 ORDER BY created_at DESC`,
        status,
      );
    }
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM access_requests ORDER BY created_at DESC`,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM access_requests WHERE id = $1`, parseInt(id),
    );
    if (!result?.[0]) {
      throw new NotFoundException(`Access request ${id} not found`);
    }
    return result[0];
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAccessRequestDto) {
    await this.prisma.$queryRawUnsafe(
      `UPDATE access_requests SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3`,
      body.status, body.admin_notes || null, parseInt(id),
    );
    // If approved, create a simulation assignment
    if (body.status === 'approved') {
      const req: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM access_requests WHERE id = $1`, parseInt(id),
      );
      if (req?.[0]) {
        const r = req[0];
        // Create simulation assignment if not exists
        await this.prisma.$queryRawUnsafe(
          `INSERT INTO simulation_assignments (simulation_id, student_id, course_id, assigned_by, status)
           VALUES ($1, $2, $3, 'admin', 'pending')
           ON CONFLICT DO NOTHING`,
          'sim-' + Date.now(), r.student_id, r.course_id,
        );
      }
    }
    const result: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM access_requests WHERE id = $1`, parseInt(id),
    );
    return result?.[0] || { id, ...body };
  }
}

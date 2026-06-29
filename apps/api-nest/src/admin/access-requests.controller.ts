import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('access-requests')
export class AccessRequestsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    const where = status ? `WHERE status = '${status}'` : '';
    return (this.prisma as any).$queryRawUnsafe(`SELECT * FROM access_requests ${where} ORDER BY created_at DESC`);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    await (this.prisma as any).$queryRawUnsafe(
      `UPDATE access_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
      body.status, parseInt(id)
    );
    // If approved, create a simulation assignment
    if (body.status === 'approved') {
      const req = await (this.prisma as any).$queryRawUnsafe(
        `SELECT * FROM access_requests WHERE id = $1`, parseInt(id)
      );
      if (req?.[0]) {
        const r = req[0];
        // Create simulation assignment if not exists
        await (this.prisma as any).$queryRawUnsafe(
          `INSERT INTO simulation_assignments (simulation_id, student_id, course_id, assigned_by, status)
           VALUES ($1, $2, $3, 'admin', 'pending')
           ON CONFLICT DO NOTHING`,
          'sim-' + Date.now(), r.student_id, r.course_id
        );
      }
    }
    const result = await (this.prisma as any).$queryRawUnsafe(
      `SELECT * FROM access_requests WHERE id = $1`, parseInt(id)
    );
    return result?.[0] || { id, ...body };
  }
}

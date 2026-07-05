import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ── Foundation Config ────────────────────────────────────────────
@Controller('foundation-config')
export class FoundationConfigController {
  constructor(private prisma: PrismaService) {}

  @Get() async findAll() {
    return (this.prisma as any).foundationConfig.findMany({
      orderBy: { id: 'asc' },
    });
  }

  @Post() async create(@Body() body: any) {
    const { name, short_name, logo_url, address, city, province, country, phone, email, website, ministry_aval } = body;
    return (this.prisma as any).foundationConfig.create({
      data: {
        name,
        short_name: short_name ?? null,
        logo_url: logo_url ?? null,
        address: address ?? null,
        city: city ?? null,
        province: province ?? null,
        country: country ?? null,
        phone: phone ?? null,
        email: email ?? null,
        website: website ?? null,
        ministry_aval: ministry_aval ?? null,
      },
    });
  }

  @Put(':id') async update(@Param('id') id: string, @Body() body: any) {
    const { name, short_name, logo_url, address, city, province, country, phone, email, website, ministry_aval, is_active } = body;
    return (this.prisma as any).foundationConfig.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(short_name !== undefined && { short_name: short_name ?? null }),
        ...(logo_url !== undefined && { logo_url: logo_url ?? null }),
        ...(address !== undefined && { address: address ?? null }),
        ...(city !== undefined && { city: city ?? null }),
        ...(province !== undefined && { province: province ?? null }),
        ...(country !== undefined && { country: country ?? null }),
        ...(phone !== undefined && { phone: phone ?? null }),
        ...(email !== undefined && { email: email ?? null }),
        ...(website !== undefined && { website: website ?? null }),
        ...(ministry_aval !== undefined && { ministry_aval: ministry_aval ?? null }),
        ...(is_active !== undefined && { is_active }),
      },
    });
  }
}

// ── Endorsers ────────────────────────────────────────────────────
@Controller('endorsers')
export class EndorsersController {
  constructor(private prisma: PrismaService) {}

  @Get() async findAll() {
    return (this.prisma as any).endorser.findMany({
      orderBy: { id: 'asc' },
    });
  }

  @Post() async create(@Body() body: any) {
    const { name, short_name, logo_url, description, endorsement_type, website } = body;
    return (this.prisma as any).endorser.create({
      data: {
        name,
        short_name: short_name ?? null,
        logo_url: logo_url ?? null,
        description: description ?? null,
        endorsement_type: endorsement_type ?? 'institution',
        website: website ?? null,
      },
    });
  }

  @Put(':id') async update(@Param('id') id: string, @Body() body: any) {
    const { name, short_name, logo_url, description, endorsement_type, website, is_active } = body;
    return (this.prisma as any).endorser.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(short_name !== undefined && { short_name: short_name ?? null }),
        ...(logo_url !== undefined && { logo_url: logo_url ?? null }),
        ...(description !== undefined && { description: description ?? null }),
        ...(endorsement_type !== undefined && { endorsement_type: endorsement_type ?? null }),
        ...(website !== undefined && { website: website ?? null }),
        ...(is_active !== undefined && { is_active }),
      },
    });
  }

  @Delete(':id') async remove(@Param('id') id: string) {
    return (this.prisma as any).endorser.delete({
      where: { id: Number(id) },
    });
  }
}

// ── Course Endorsers ─────────────────────────────────────────────
@Controller('course-endorsers')
export class CourseEndorsersController {
  constructor(private prisma: PrismaService) {}

  @Get() async findAll(@Query('course_id') courseId?: string) {
    if (courseId) {
      return (this.prisma as any).courseEndorser.findMany({
        where: { course_id: courseId },
        include: { Endorser: true },
        orderBy: { id: 'asc' },
      });
    }
    return (this.prisma as any).courseEndorser.findMany({
      include: { Endorser: true },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':courseId') async findByCourse(@Param('courseId') courseId: string) {
    const courseEndorsers = await (this.prisma as any).courseEndorser.findMany({
      where: { course_id: courseId },
      include: { Endorser: true },
      orderBy: { id: 'asc' },
    });
    // Flatten endorser fields for frontend compatibility
    return courseEndorsers.map((ce: any) => ({
      id: ce.id,
      course_id: ce.course_id,
      endorser_id: ce.endorser_id,
      name: ce.Endorser?.name ?? '',
      short_name: ce.Endorser?.short_name ?? '',
      logo_url: ce.Endorser?.logo_url ?? '',
      endorsement_type: ce.Endorser?.endorsement_type ?? '',
    }));
  }

  @Post() async create(@Body() body: any) {
    const { course_id, endorser_id } = body;
    return (this.prisma as any).courseEndorser.create({
      data: {
        course_id,
        endorserId: Number(endorser_id),
      },
    });
  }

  @Delete() async remove(@Body() body: any) {
    const { course_id, endorser_id } = body;
    return (this.prisma as any).courseEndorser.deleteMany({
      where: {
        course_id,
        endorser_id: Number(endorser_id),
      },
    });
  }
}

// ── Legajo ───────────────────────────────────────────────────────
@Controller('legajo')
export class LegajoController {
  constructor(private prisma: PrismaService) {}
  @Get('students') async getStudents() { return []; }
}

// ── Simulation Sessions ──────────────────────────────────────────
@Controller('simulation-sessions')
export class SimulationSessionsController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll() { return []; }
  @Get('ref/:ref') async findByRef(@Param('ref') ref: string) { return null; }
  @Get(':id') async findOne(@Param('id') id: string) { return null; }
}

// ── Certificates ─────────────────────────────────────────────────
@Controller('certificates')
export class CertificatesController {
  constructor(private prisma: PrismaService) {}
  @Get(':id') async findOne(@Param('id') id: string) { return null; }
  @Post('send-email') async sendEmail(@Body() body: any) { return { sent: true }; }
}

import { Controller, Get, Post, Put, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return (this.prisma as any).foundationConfig.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
  }

  @Put(':id/reactivate')
  async reactivate(@Param('id') id: string) {
    return (this.prisma as any).foundationConfig.update({
      where: { id: Number(id) },
      data: { is_active: true },
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
    return (this.prisma as any).endorser.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
  }

  @Put(':id/reactivate') async reactivate(@Param('id') id: string) {
    return (this.prisma as any).endorser.update({
      where: { id: Number(id) },
      data: { is_active: true },
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

  @Get('students')
  async getStudents() {
    const students = await this.prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true, name: true, email: true,
        simulations: { select: { id: true, status: true, score: true, progress_percentage: true } },
      },
    });
    return students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      total_sims: s.simulations.length,
      completed: s.simulations.filter(sim => sim.status === 'completed').length,
      avg_score: s.simulations.length > 0
        ? s.simulations.filter(sim => sim.score).reduce((a, sim) => a + sim.score!, 0) / s.simulations.filter(sim => sim.score).length
        : null,
    }));
  }

  @Get(':userId')
  async getStudentLedger(@Param('userId') userId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, created_at: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const simulations = await this.prisma.simulation.findMany({
      where: { student_id: userId },
      include: { course: { select: { title: true, category: true } } },
      orderBy: { started_at: 'desc' },
    });

    const evaluations = await this.prisma.simulationEvaluation.findMany({
      where: { student_id: userId },
      orderBy: { evaluated_at: 'desc' },
    });

    const enriched = simulations.map(sim => {
      const evalData = evaluations.find(e => e.simulation_id === sim.id);
      return {
        simulation_id: sim.id,
        status: sim.status,
        started_at: sim.started_at,
        completed_at: sim.completed_at,
        course_id: sim.course_id,
        course_title: sim.course.title,
        course_category: sim.course.category,
        assessment_id: evalData ? String(evalData.id) : null,
        score: evalData ? Number(evalData.overall_score) : sim.score,
        passed: evalData ? Number(evalData.overall_score) >= 70 : sim.score ? sim.score >= 70 : null,
        criteria_met: evalData?.kpi_results ? {
          kpis: evalData.kpi_results as Record<string, number>,
          scoring_methodology: {
            formula: 'IA + Motor de Reglas',
            components: {},
            puntaje_base_ia: Number(evalData.overall_score),
            puntaje_motor_reglas: null,
            puntaje_crisis: null,
            ajuste_crisis: 0,
            puntaje_final: Number(evalData.overall_score),
            aprobado: Number(evalData.overall_score) >= 70,
          },
          analysis_detail: {
            strengths: evalData.overall_feedback ? [evalData.overall_feedback] : [],
            areas_to_improve: [],
            recommendations: [],
          },
        } : null,
        assessment_comments: evalData?.overall_feedback || null,
        evaluated_at: evalData?.evaluated_at || null,
        evaluator_name: null,
        total_logs: 0,
        messages_sent: 0,
      };
    });

    const completedEvals = evaluations.filter(e => Number(e.overall_score || 0) > 0);
    const passedEvals = completedEvals.filter(e => Number(e.overall_score || 0) >= 70);

    const stats = {
      total_simulations: simulations.length,
      total_evaluations: completedEvals.length,
      passed_evaluations: passedEvals.length,
      avg_score: completedEvals.length > 0
        ? Math.round(completedEvals.reduce((a, e) => a + Number(e.overall_score || 0), 0) / completedEvals.length)
        : null,
      approval_rate: completedEvals.length > 0
        ? Math.round((passedEvals.length / completedEvals.length) * 100)
        : null,
    };

    return { student, stats, simulations: enriched };
  }
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

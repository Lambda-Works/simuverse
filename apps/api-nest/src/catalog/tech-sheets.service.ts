import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechSheetDto } from './dto/create-tech-sheet.dto';
import { UpdateTechSheetDto } from './dto/update-tech-sheet.dto';

@Injectable()
export class TechSheetsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.techSheet.findMany({ orderBy: { created_at: 'desc' } });
  }

  async findValid() {
    const sheets = await this.prisma.techSheet.findMany({
      orderBy: { created_at: 'desc' },
    });
    return sheets
      .filter((s) => s.name && (s.competencies || s.kpi_requirements))
      .map((s) => ({
        id: s.id,
        name: s.name,
        processed: s.processed,
        has_competencies: !!s.competencies,
        has_kpis: !!s.kpi_requirements,
      }));
  }

  async findOne(id: number) {
    const sheet = await this.prisma.techSheet.findUnique({ where: { id } });
    if (!sheet) {
      throw new NotFoundException('Tech sheet not found');
    }
    return sheet;
  }

  async create(dto: CreateTechSheetDto) {
    // Validate course exists
    const course = await this.prisma.course.findFirst({
      where: { id: dto.course_id },
    });
    if (!course) {
      throw new BadRequestException(
        `Course with ID "${dto.course_id}" does not exist`,
      );
    }

    return this.prisma.techSheet.create({
      data: {
        name: dto.name,
        course_id: dto.course_id,
        ministry_code: dto.ministry_code,
        description: dto.description,
        competencies: dto.competencies,
        kpi_requirements: dto.kpi_requirements,
        context_scenario: dto.context_scenario,
        file_url: dto.file_url,
        uploaded_by: dto.uploaded_by || 'system',
      },
    });
  }

  async update(id: number, dto: UpdateTechSheetDto) {
    await this.findOne(id);
    return this.prisma.techSheet.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.techSheet.delete({ where: { id } });
    return { message: 'Tech sheet deleted successfully' };
  }

  async process(id: number) {
    const sheet = await this.findOne(id);
    return this.prisma.techSheet.update({
      where: { id },
      data: {
        processed: true,
        processed_at: new Date(),
        extracted_data: {
          kpis: sheet.kpi_requirements || [],
          competencies: sheet.competencies || [],
          processed_at: new Date(),
          note: 'Processed manually',
        },
      },
    });
  }

  async analyze(id: number) {
    const sheet = await this.findOne(id);
    if (!sheet.course_id) {
      throw new BadRequestException(
        'Tech sheet must have a course assigned',
      );
    }

    const hasContent = sheet.file_url || sheet.description;
    if (!hasContent) {
      throw new BadRequestException(
        'Tech sheet must have at least one of: attached file, URL, or description',
      );
    }

    // Mark as processed
    const savedSheet = await this.prisma.techSheet.update({
      where: { id },
      data: { processed: true, processed_at: new Date() },
    });

    // Build analyzed config from sheet data
    const analyzedConfig = {
      competencies: (sheet.competencies as any[]) || [],
      kpis: (sheet.kpi_requirements as any[]) || [],
      tasks: [],
      analysis_method: sheet.file_url ? 'file_analysis' : 'description_analysis',
      analysis_notes: 'Analyzed via NestJS service',
    };

    return {
      message: 'Tech sheet analyzed successfully',
      sheet: savedSheet,
      config: analyzedConfig,
      summary: {
        competencies_count: analyzedConfig.competencies.length,
        kpis_count: analyzedConfig.kpis.length,
        tasks_count: analyzedConfig.tasks.length,
      },
    };
  }
}

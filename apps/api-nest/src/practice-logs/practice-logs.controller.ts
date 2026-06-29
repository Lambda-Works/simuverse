import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PracticeLogsService } from './practice-logs.service';
import { CreatePracticeLogDto } from './dto/create-practice-log.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('practice-logs')
@UseGuards(JwtAuthGuard)
export class PracticeLogsController {
  constructor(private practiceLogsService: PracticeLogsService) {}

  @Post()
  async create(@Body() dto: CreatePracticeLogDto) {
    return this.practiceLogsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('student_id') student_id: string,
    @Query('course_id') course_id: string,
    @Query('limit') limit?: string,
  ) {
    return this.practiceLogsService.findAll(student_id, course_id, limit ? parseInt(limit) : 100);
  }

  @Get('export/csv')
  async exportCSV(
    @Query('student_id') student_id: string,
    @Query('course_id') course_id: string,
    @Res() res: Response,
  ) {
    const csv = await this.practiceLogsService.exportCSV(student_id, course_id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=practice-logs.csv');
    res.send(csv);
  }

  @Get('verify')
  async verifyIntegrity(
    @Query('student_id') student_id: string,
    @Query('course_id') course_id: string,
  ) {
    return this.practiceLogsService.verifyIntegrity(student_id, course_id);
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private assessmentsService: AssessmentsService) {}

  @Get()
  async findAll(
    @Query('course_id') courseId?: string,
    @Query('user_id') userId?: string,
    @CurrentUser() user?: any,
  ) {
    let resolvedUserId = userId;
    if (user?.role === 'student') {
      resolvedUserId = user.id;
    }
    return this.assessmentsService.findAll({
      course_id: courseId,
      user_id: resolvedUserId,
    });
  }

  @Get('simulation/:simulationId')
  async findBySimulation(@Param('simulationId') simulationId: string) {
    return this.assessmentsService.findBySimulation(simulationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(dto);
  }

  @Get(':id/verify')
  async verifySignature(@Param('id') id: string) {
    return this.assessmentsService.verifySignature(id);
  }
}

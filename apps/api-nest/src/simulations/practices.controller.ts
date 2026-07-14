import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PracticesService } from './practices.service';

@UseGuards(JwtAuthGuard)
@Controller('practices')
export class PracticesController {
  constructor(private readonly practices: PracticesService) {}

  @Get('course/:courseId')
  async list(@Param('courseId') courseId: string) {
    return this.practices.listByCourse(courseId);
  }

  @Get('course/:courseId/progress')
  async progress(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.practices.getStudentProgress(userId, courseId);
  }

  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @Post('course/:courseId')
  async create(
    @Param('courseId') courseId: string,
    @Body()
    body: {
      title: string;
      description?: string;
      difficulty?: 'very_low' | 'low' | 'medium';
      content?: any;
    },
  ) {
    return this.practices.createPractice(courseId, body);
  }

  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      difficulty?: 'very_low' | 'low' | 'medium';
      content?: any;
      is_active?: boolean;
    },
  ) {
    return this.practices.updatePractice(id, body);
  }

  @Post('course/:courseId/start')
  async start(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
    @Body() body?: { scenario_id?: string },
  ) {
    return this.practices.startNextPractice(userId, courseId, body?.scenario_id);
  }

  @Post('instances/:instanceId/complete')
  async complete(
    @CurrentUser('id') userId: string,
    @Param('instanceId') instanceId: string,
  ) {
    return this.practices.completePractice(userId, instanceId);
  }
}

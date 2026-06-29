import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  async findAll(@Query('is_active') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.coursesService.findAll(active);
  }

  @Get(':courseId')
  async findOne(@Param('courseId') courseId: string) {
    return this.coursesService.findByCourseId(courseId);
  }

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':courseId')
  async update(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(courseId, dto);
  }

  @Delete(':courseId')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('courseId') courseId: string) {
    await this.coursesService.remove(courseId);
    return { message: 'Course deactivated successfully' };
  }
}

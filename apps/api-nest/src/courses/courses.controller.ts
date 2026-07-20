import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsArray, IsInt, MinLength } from 'class-validator';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class CreateCourseDto {
  @IsString()
  @MinLength(1)
  course_id: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsArray()
  modules?: any;

  @IsOptional()
  @IsArray()
  eval_criteria?: any;

  @IsOptional()
  @IsArray()
  crisis_events?: any;

  @IsOptional()
  @IsArray()
  categories?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  simulated_company_id?: number;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  drive_folder_url?: string;

  @IsOptional()
  @IsArray()
  teacher_ids?: string[];
}

class UpdateCourseDto {
  @IsOptional()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  modules?: any;

  @IsOptional()
  @IsArray()
  eval_criteria?: any;

  @IsOptional()
  @IsArray()
  crisis_events?: any;

  @IsOptional()
  @IsArray()
  categories?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  simulated_company_id?: number;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  clear_password?: boolean;

  @IsOptional()
  @IsString()
  drive_folder_url?: string;

  @IsOptional()
  @IsArray()
  teacher_ids?: string[];
}

class EnrollDto {
  @IsOptional()
  @IsString()
  password?: string;
}

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  async findAll(@Query('is_active') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.coursesService.findAll(active);
  }

  @Get('catalog')
  async catalog(@Query('q') q?: string) {
    return this.coursesService.catalog(q);
  }

  @Get(':courseId')
  async findOne(@Param('courseId') courseId: string) {
    return this.coursesService.findById(courseId);
  }

  @Post()
  @Roles('admin')
  @Permissions('courses.manage')
  async create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'teacher')
  @Permissions('courses.manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.coursesService.update(id, dto, user);
  }

  @Post(':id/regenerate-password')
  @Roles('admin', 'teacher')
  @Permissions('courses.manage')
  async regeneratePassword(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.coursesService.regeneratePassword(id, user);
  }

  @Post(':courseId/enroll')
  @Roles('student', 'admin', 'teacher')
  async enroll(
    @Param('courseId') courseId: string,
    @Body() dto: EnrollDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.coursesService.enroll(courseId, userId, dto.password);
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('courses.manage')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.coursesService.remove(id);
    return { message: 'Course deactivated successfully' };
  }
}

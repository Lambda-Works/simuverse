import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'teacher')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Get('assignments')
  async findAll(
    @Query('student_id') studentId?: string,
    @Query('course_id') courseId?: string,
    @Query('status') status?: string,
  ) {
    return this.assignmentsService.findAll({
      student_id: studentId,
      course_id: courseId,
      status,
    });
  }

  @Get('assignments/student/:studentId')
  async findByStudent(@Param('studentId') studentId: string) {
    return this.assignmentsService.findByStudent(studentId);
  }

  @Get('assignments/course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.assignmentsService.findByCourse(courseId);
  }

  @Get('assignments/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentsService.findOne(id);
  }

  @Post('assignments')
  async create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(dto);
  }

  @Put('assignments/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, dto);
  }

  @Delete('assignments/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentsService.remove(id);
  }
}

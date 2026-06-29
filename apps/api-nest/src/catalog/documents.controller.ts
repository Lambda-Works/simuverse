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
import { DocumentsService } from './documents.service';
import { AssignmentsService } from './assignments.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('documents')
  async findAll(@Query('course_id') courseId?: string) {
    return this.documentsService.findAll(courseId);
  }

  @Get('documents/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }

  @Post('documents')
  async create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Put('documents/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }
}

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
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { FilesService } from './files.service';
import { UpdateFileDto } from './dto/file.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') uploaded_by_id: string,
    @Body('upload_type') upload_type: string,
    @Body('course_id') course_id?: string,
    @Body('ministry_requirement_id') ministry_requirement_id?: string,
    @Body('description') description?: string,
  ) {
    return this.filesService.upload(file, {
      uploaded_by_id,
      upload_type,
      course_id,
      ministry_requirement_id,
      description,
    });
  }

  @Get()
  async findAll(
    @Query('uploaded_by_id') uploaded_by_id?: string,
    @Query('course_id') course_id?: string,
  ) {
    return this.filesService.findAll({ uploaded_by_id, course_id });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { filePath, fileName } = await this.filesService.getFilePath(id);
    const file = createReadStream(filePath);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(file);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFileDto,
    @CurrentUser() user: any,
  ) {
    return this.filesService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.filesService.remove(id, user);
  }
}

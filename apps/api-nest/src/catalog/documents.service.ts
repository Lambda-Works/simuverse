import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(courseId?: string) {
    const where = courseId ? { course_id: courseId } : {};
    return this.prisma.courseDocument.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const doc = await this.prisma.courseDocument.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  async create(dto: CreateDocumentDto) {
    return this.prisma.courseDocument.create({
      data: {
        course_id: dto.course_id,
        document_name: dto.document_name,
        document_type: dto.document_type || 'other',
        document_content: dto.document_content,
        file_url: dto.file_url,
        uploaded_by: dto.uploaded_by,
      },
    });
  }

  async update(id: number, dto: UpdateDocumentDto) {
    await this.findOne(id);
    return this.prisma.courseDocument.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.courseDocument.update({ where: { id }, data: { is_active: false } });
    return { message: 'Document deactivated' };
  }

  async reactivate(id: number) {
    await this.findOne(id);
    await this.prisma.courseDocument.update({ where: { id }, data: { is_active: true } });
    return { message: 'Document reactivated' };
  }
}

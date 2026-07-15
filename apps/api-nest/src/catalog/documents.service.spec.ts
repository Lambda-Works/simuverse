import { BadRequestException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const prisma = {
    courseDocument: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentsService(prisma);
  });

  describe('create', () => {
    it('persists trimmed https file_url', async () => {
      (prisma.courseDocument.create as jest.Mock).mockResolvedValue({ id: 1 });

      await service.create({
        course_id: 'c1',
        document_name: 'Contrato',
        file_url: '  https://drive.google.com/file/d/abc/view  ',
      });

      expect(prisma.courseDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          file_url: 'https://drive.google.com/file/d/abc/view',
        }),
      });
    });

    it('rejects invalid file_url', async () => {
      await expect(
        service.create({
          course_id: 'c1',
          document_name: 'Contrato',
          file_url: 'not-a-url',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-http(s) file_url', async () => {
      await expect(
        service.create({
          course_id: 'c1',
          document_name: 'Contrato',
          file_url: 'ftp://example.com/doc.pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('validates file_url when provided', async () => {
      (prisma.courseDocument.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(
        service.update(1, { file_url: 'javascript:alert(1)' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

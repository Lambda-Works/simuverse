import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const JWT_SECRET = 'dev-secret';

function signToken(payload: { sub: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Files (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const fileId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  beforeAll(async () => {
    prismaMock = {
      fileUpload: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    adminToken = signToken({ sub: userId, email: 'user@test.com', role: 'admin' });
  });

  afterAll(async () => { await app.close(); });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === userId) {
        return Promise.resolve({ id: userId, name: 'User', email: 'user@test.com', role: 'admin' });
      }
      return Promise.resolve(null);
    });
  });

  describe('POST /api/files/upload', () => {
    it('should upload a file with SHA-256 hash', async () => {
      prismaMock.fileUpload.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'new-file', ...data, created_at: new Date() }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('uploaded_by_id', userId)
        .field('upload_type', 'student_submission')
        .field('description', 'Test file')
        .attach('file', Buffer.from('Hello, World!'), 'test.txt')
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('file_hash');
      expect(res.body.file_name).toBe('test.txt');
      expect(res.body.file_type).toBe('txt');
    });
  });

  describe('GET /api/files', () => {
    it('should list files for a user', async () => {
      prismaMock.fileUpload.findMany.mockResolvedValue([
        { id: fileId, file_name: 'test.txt', uploaded_by_id: userId, is_active: true },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/files?uploaded_by_id=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/files/:id', () => {
    it('should get file metadata by id', async () => {
      prismaMock.fileUpload.findUnique.mockResolvedValue({
        id: fileId, file_name: 'test.txt', file_hash: 'abc123', uploaded_by_id: userId,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', fileId);
      expect(res.body).toHaveProperty('file_hash');
    });
  });

  describe('GET /api/files/:id/download', () => {
    it('should download a file', async () => {
      const tmpDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const tmpFile = path.join(tmpDir, `${fileId}.txt`);
      fs.writeFileSync(tmpFile, 'Hello, World!');

      prismaMock.fileUpload.findUnique.mockResolvedValue({
        id: fileId, file_name: 'test.txt', file_path: tmpFile, uploaded_by_id: userId,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/files/${fileId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('octet-stream');
      // Buffer response from res.end()
      const body = res.body instanceof Buffer ? res.body.toString() : res.text;
      expect(body).toBe('Hello, World!');

      // Cleanup
      fs.unlinkSync(tmpFile);
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('should soft-delete a file', async () => {
      prismaMock.fileUpload.update.mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });
  });
});

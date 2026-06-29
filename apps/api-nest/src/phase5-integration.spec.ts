import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { AIService } from './simulations/ai/ai.service';

const JWT_SECRET = 'dev-secret';

function signToken(payload: { sub: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Phase 5 Integration (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let aiServiceMock: Record<string, any>;
  let adminToken: string;
  let studentToken: string;

  const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const courseId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeAll(async () => {
    prismaMock = {
      role: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      systemFunctionality: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      rolePermission: {
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      fileUpload: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      ministryRequirement: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      kPI: {
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    aiServiceMock = {
      sendMessageToGemini: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(AIService)
      .useValue(aiServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    adminToken = signToken({ sub: userId, email: 'admin@test.com', role: 'admin' });
    studentToken = signToken({ sub: 'student-id', email: 'student@test.com', role: 'student' });
  });

  afterAll(async () => { await app.close(); });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === userId) {
        return Promise.resolve({ id: userId, name: 'Admin', email: 'admin@test.com', role: 'admin' });
      }
      if (where.id === 'student-id') {
        return Promise.resolve({ id: 'student-id', name: 'Student', email: 'student@test.com', role: 'student' });
      }
      return Promise.resolve(null);
    });
  });

  // ── RBAC Integration ──────────────────────────────────────────────

  describe('RBAC Role Assignment + Permissions', () => {
    it('should create role, assign permission, and verify', async () => {
      // Create role
      prismaMock.role.create.mockResolvedValue({ id: 1, name: 'editor', is_active: true });
      await request(app.getHttpServer())
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'editor', description: 'Content editor' })
        .expect(201);

      // Create functionality
      prismaMock.systemFunctionality.create.mockResolvedValue({ id: 1, name: 'Edit Posts', module: 'blog' });
      await request(app.getHttpServer())
        .post('/api/rbac/functionalities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Edit Posts', module: 'blog' })
        .expect(201);

      // Assign permission
      prismaMock.rolePermission.upsert.mockResolvedValue({ id: 1, role_name: 'editor', functionality_id: 1, enabled: true });
      const permRes = await request(app.getHttpServer())
        .post('/api/rbac/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_name: 'editor', functionality_id: 1, enabled: true })
        .expect(201);

      expect(permRes.body.role_name).toBe('editor');
      expect(permRes.body.functionality_id).toBe(1);

      // List permissions
      prismaMock.rolePermission.findMany.mockResolvedValue([
        { id: 1, role_name: 'editor', functionality_id: 1, enabled: true },
      ]);
      const listRes = await request(app.getHttpServer())
        .get('/api/rbac/permissions?role_name=editor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].role_name).toBe('editor');
    });
  });

  // ── Notifications Integration ─────────────────────────────────────

  describe('Notification CRUD Flow', () => {
    it('should create, read, mark as read, and delete notification', async () => {
      // Create
      prismaMock.notification.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'notif-1', ...data, created_at: new Date() }),
      );
      const createRes = await request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recipient_id: userId,
          type: 'system_alert',
          title: 'Test Alert',
          content: 'Something happened',
        })
        .expect(201);

      expect(createRes.body.is_read).toBe(false);

      // List
      prismaMock.notification.findMany.mockResolvedValue([
        { id: 'notif-1', recipient_id: userId, type: 'system_alert', title: 'Test Alert', is_read: false },
      ]);
      const listRes = await request(app.getHttpServer())
        .get(`/api/notifications?recipient_id=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);

      // Mark as read
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'notif-1', recipient_id: userId, type: 'system_alert', title: 'Test Alert', is_read: false,
      });
      prismaMock.notification.update.mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data, is_read: true, read_at: new Date() }),
      );
      const readRes = await request(app.getHttpServer())
        .put('/api/notifications/notif-1/read')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(readRes.body.is_read).toBe(true);

      // Delete
      prismaMock.notification.delete.mockResolvedValue({ id: 'notif-1' });
      await request(app.getHttpServer())
        .delete('/api/notifications/notif-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  // ── File Upload + Hash Verification ───────────────────────────────

  describe('File Upload + Download + Hash', () => {
    it('should upload file and verify SHA-256 hash', async () => {
      const fileContent = 'Integration test file content';
      prismaMock.fileUpload.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'file-1', ...data, created_at: new Date() }),
      );

      const uploadRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('uploaded_by_id', userId)
        .field('upload_type', 'student_submission')
        .attach('file', Buffer.from(fileContent), 'integration-test.txt')
        .expect(201);

      expect(uploadRes.body).toHaveProperty('file_hash');
      expect(uploadRes.body.file_name).toBe('integration-test.txt');
      expect(uploadRes.body.file_type).toBe('txt');

      // Verify hash format (SHA-256 = 64 hex chars)
      expect(uploadRes.body.file_hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ── Ministry KPI Extraction (Mock AI) ─────────────────────────────

  describe('Ministry KPI Extraction', () => {
    it('should extract KPIs via mocked AI', async () => {
      const reqId = 'req-ai-test';
      prismaMock.ministryRequirement.findUnique.mockResolvedValue({
        id: reqId,
        course_id: courseId,
        raw_text: 'El ministerio requiere 85% de aprobación en ciencias.',
        status: 'uploaded',
      });
      prismaMock.ministryRequirement.update.mockResolvedValue({});
      aiServiceMock.sendMessageToGemini.mockResolvedValue({
        response: JSON.stringify([
          {
            name: 'Aprobación Ciencias',
            description: '85% de aprobación en ciencias',
            category: 'academic',
            target_value: 85,
            trigger_event: 'course_completed',
          },
        ]),
        mode: 'live',
      });
      prismaMock.kPI.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'kpi-int-1', ...data }),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/ministry/requirements/${reqId}/extract-kpis`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.kpis).toHaveLength(1);
      expect(res.body.kpis[0].name).toBe('Aprobación Ciencias');
      expect(res.body.mode).toBe('live');
      expect(aiServiceMock.sendMessageToGemini).toHaveBeenCalledTimes(1);
    });
  });
});

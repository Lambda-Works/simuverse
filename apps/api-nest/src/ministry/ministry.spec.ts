import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../simulations/ai/ai.service';

const JWT_SECRET = 'dev-secret';

function signToken(payload: { sub: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Ministry (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let aiServiceMock: Record<string, any>;
  let adminToken: string;

  const courseId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const reqId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const kpiId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeAll(async () => {
    prismaMock = {
      ministryRequirement: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      kPI: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    aiServiceMock = {
      sendMessage: jest.fn(),
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

    adminToken = signToken({ sub: 'admin-id', email: 'admin@test.com', role: 'admin' });
  });

  afterAll(async () => { await app.close(); });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === 'admin-id') {
        return Promise.resolve({ id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin' });
      }
      return Promise.resolve(null);
    });
  });

  // ── Ministry Requirements ──────────────────────────────────────────

  describe('Requirements', () => {
    describe('GET /api/ministry/requirements', () => {
      it('should list requirements', async () => {
        prismaMock.ministryRequirement.findMany.mockResolvedValue([
          { id: reqId, course_id: courseId, status: 'uploaded', file_size_bytes: BigInt(1024) },
        ]);

        const res = await request(app.getHttpServer())
          .get(`/api/ministry/requirements?course_id=${courseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].file_size_bytes).toBe('1024');
      });
    });

    describe('GET /api/ministry/requirements/:id', () => {
      it('should get requirement with KPIs', async () => {
        prismaMock.ministryRequirement.findUnique.mockResolvedValue({
          id: reqId, course_id: courseId, status: 'uploaded',
          file_size_bytes: BigInt(2048), kpis: [],
        });

        const res = await request(app.getHttpServer())
          .get(`/api/ministry/requirements/${reqId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('id', reqId);
        expect(res.body).toHaveProperty('kpis');
      });
    });

    describe('POST /api/ministry/requirements', () => {
      it('should create a requirement', async () => {
        prismaMock.ministryRequirement.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 'new-req', ...data, created_at: new Date() }),
        );

        const res = await request(app.getHttpServer())
          .post('/api/ministry/requirements')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            course_id: courseId,
            file_name: 'requisito.pdf',
            file_type: 'pdf',
            file_size_bytes: 1024,
            file_path: '/uploads/requisito.pdf',
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('uploaded');
      });
    });

    describe('PUT /api/ministry/requirements/:id', () => {
      it('should update a requirement', async () => {
        prismaMock.ministryRequirement.update.mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data }),
        );

        const res = await request(app.getHttpServer())
          .put(`/api/ministry/requirements/${reqId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'processing', processing_notes: 'Starting extraction' })
          .expect(200);

        expect(res.body.status).toBe('processing');
      });
    });

    describe('POST /api/ministry/requirements/:id/process', () => {
      it('should process requirement and extract KPIs', async () => {
        prismaMock.ministryRequirement.update.mockResolvedValue({});
        prismaMock.ministryRequirement.findUnique.mockResolvedValue({
          id: reqId, course_id: courseId,
        });
        prismaMock.kPI.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 'kpi-1', ...data }),
        );

        const res = await request(app.getHttpServer())
          .post(`/api/ministry/requirements/${reqId}/process`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            extracted_kpis: [
              { name: 'KPI 1', description: 'Test KPI', category: 'general' },
            ],
          })
          .expect(201);

        expect(res.body).toHaveProperty('kpis');
        expect(res.body.kpis).toHaveLength(1);
      });
    });

    describe('PUT /api/ministry/requirements/:id/activate', () => {
      it('should activate a requirement', async () => {
        prismaMock.ministryRequirement.update.mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data }),
        );

        const res = await request(app.getHttpServer())
          .put(`/api/ministry/requirements/${reqId}/activate`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.status).toBe('active');
        expect(res.body.is_active).toBe(true);
      });
    });

    describe('DELETE /api/ministry/requirements/:id', () => {
      it('should archive a requirement', async () => {
        prismaMock.ministryRequirement.update.mockResolvedValue({});

        const res = await request(app.getHttpServer())
          .delete(`/api/ministry/requirements/${reqId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('message');
      });
    });

    describe('POST /api/ministry/requirements/:id/extract-kpis', () => {
      it('should extract KPIs from document using AI', async () => {
        prismaMock.ministryRequirement.findUnique.mockResolvedValue({
          id: reqId,
          course_id: courseId,
          raw_text: 'El ministerio requiere 80% de aprobación en matemática.',
          status: 'uploaded',
        });
        prismaMock.ministryRequirement.update.mockResolvedValue({});
        aiServiceMock.sendMessage.mockResolvedValue({
          response: JSON.stringify([
            {
              name: 'Aprobación Matemática',
              description: '80% de aprobación en matemática',
              category: 'academic',
              weight: 1.0,
              target_value: 80,
              minimum_pass_value: 70,
              trigger_event: 'course_completed',
            },
          ]),
          mode: 'live',
        });
        prismaMock.kPI.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 'kpi-ai-1', ...data }),
        );

        const res = await request(app.getHttpServer())
          .post(`/api/ministry/requirements/${reqId}/extract-kpis`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201);

        expect(res.body).toHaveProperty('kpis');
        expect(res.body.kpis).toHaveLength(1);
        expect(res.body.kpis[0].name).toBe('Aprobación Matemática');
        expect(res.body.mode).toBe('live');
      });

      it('should return 404 when requirement not found', async () => {
        prismaMock.ministryRequirement.findUnique.mockResolvedValue(null);

        await request(app.getHttpServer())
          .post(`/api/ministry/requirements/nonexistent/extract-kpis`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should handle AI fallback to scripted mode', async () => {
        prismaMock.ministryRequirement.findUnique.mockResolvedValue({
          id: reqId,
          course_id: courseId,
          raw_text: 'Some document text',
          status: 'uploaded',
        });
        prismaMock.ministryRequirement.update.mockResolvedValue({});
        aiServiceMock.sendMessage.mockResolvedValue({
          response: 'Sorry, I cannot extract KPIs from this document.',
          mode: 'scripted',
        });

        const res = await request(app.getHttpServer())
          .post(`/api/ministry/requirements/${reqId}/extract-kpis`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201);

        expect(res.body).toHaveProperty('kpis');
        expect(res.body.kpis).toHaveLength(0);
        expect(res.body.mode).toBe('scripted');
      });
    });
  });

  // ── KPIs ────────────────────────────────────────────────────────────

  describe('KPIs', () => {
    describe('GET /api/ministry/kpis', () => {
      it('should list KPIs', async () => {
        prismaMock.kPI.findMany.mockResolvedValue([
          { id: kpiId, course_id: courseId, name: 'Test KPI', is_active: true },
        ]);

        const res = await request(app.getHttpServer())
          .get(`/api/ministry/kpis?course_id=${courseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('POST /api/ministry/kpis', () => {
      it('should create a KPI', async () => {
        prismaMock.kPI.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 'new-kpi', ...data, created_at: new Date() }),
        );

        const res = await request(app.getHttpServer())
          .post('/api/ministry/kpis')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            course_id: courseId,
            name: 'New KPI',
            description: 'A test KPI',
            target_value: 90,
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('New KPI');
      });
    });

    describe('DELETE /api/ministry/kpis/:id', () => {
      it('should deactivate a KPI', async () => {
        prismaMock.kPI.update.mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data }),
        );

        const res = await request(app.getHttpServer())
          .delete(`/api/ministry/kpis/${kpiId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.is_active).toBe(false);
      });
    });
  });

  describe('GET /api/ministry/health', () => {
    it('should return health status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ministry/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.module).toBe('ministry');
    });
  });
});

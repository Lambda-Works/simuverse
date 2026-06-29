import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET = 'dev-secret';

function signToken(payload: { sub: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Templates (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  beforeAll(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      flowTemplate: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      promptTemplate: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      courseConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
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

    adminToken = signToken({ sub: 'admin-id', email: 'admin@test.com', role: 'admin' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === 'admin-id') {
        return Promise.resolve({
          id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin',
          password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
        });
      }
      return Promise.resolve(null);
    });
  });

  // ─── Flow Templates ────────────────────────────────────────────────────

  describe('Flow Templates', () => {
    describe('GET /api/templates/flow', () => {
      it('should return 401 without auth', async () => {
        await request(app.getHttpServer())
          .get('/api/templates/flow')
          .expect(401);
      });

      it('should return all flow templates', async () => {
        prismaMock.flowTemplate.findMany.mockResolvedValue([
          { id: 't1', title: 'Template 1', family: 'admin', template_data: '{"steps":[]}', is_active: true },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/templates/flow')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('template_data');
      });

      it('should filter by family', async () => {
        prismaMock.flowTemplate.findMany.mockResolvedValue([]);

        await request(app.getHttpServer())
          .get('/api/templates/flow?family=rrhh')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(prismaMock.flowTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ family: 'rrhh' }) }),
        );
      });
    });

    describe('POST /api/templates/flow', () => {
      it('should create a flow template', async () => {
        prismaMock.flowTemplate.findUnique.mockResolvedValue(null);
        prismaMock.flowTemplate.create.mockResolvedValue({
          id: 't1', course_id: 'c1', title: 'Template 1', family: 'admin',
          template_data: '{"steps":[]}', is_active: true, created_at: new Date(),
        });

        const res = await request(app.getHttpServer())
          .post('/api/templates/flow')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ id: 't1', course_id: 'c1', title: 'Template 1', template_data: { steps: [] } })
          .expect(201);

        expect(res.body).toHaveProperty('id', 't1');
      });

      it('should return 409 for duplicate id', async () => {
        prismaMock.flowTemplate.findUnique.mockResolvedValue({ id: 't1' });

        await request(app.getHttpServer())
          .post('/api/templates/flow')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ id: 't1', course_id: 'c1', title: 'Template 1', template_data: {} })
          .expect(409);
      });
    });

    describe('POST /api/templates/flow/:id/duplicate', () => {
      it('should duplicate a flow template', async () => {
        prismaMock.flowTemplate.findUnique.mockResolvedValue({
          id: 't1', course_id: 'c1', title: 'Original', family: 'admin',
          course_code: 'T1', description: null, version: '1.0',
          template_data: '{}', created_by: null,
        });
        prismaMock.flowTemplate.create.mockResolvedValue({
          id: 't1-copia', course_id: 'c1', title: 'Original (Copia)',
        });

        const res = await request(app.getHttpServer())
          .post('/api/templates/flow/t1/duplicate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(201);

        expect(res.body).toHaveProperty('id');
      });
    });

    describe('POST /api/templates/flow/bulk-import', () => {
      it('should import multiple templates', async () => {
        prismaMock.flowTemplate.findUnique.mockResolvedValue(null);
        prismaMock.flowTemplate.create.mockResolvedValue({});

        const res = await request(app.getHttpServer())
          .post('/api/templates/flow/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            templates: [
              { id: 't1', course_id: 'c1', title: 'T1', template_data: '{}' },
              { id: 't2', course_id: 'c1', title: 'T2', template_data: '{}' },
            ],
          })
          .expect(201);

        expect(res.body).toHaveProperty('created', 2);
      });
    });
  });

  // ─── Prompt Templates ──────────────────────────────────────────────────

  describe('Prompt Templates', () => {
    describe('GET /api/templates/prompt', () => {
      it('should return all prompt templates', async () => {
        prismaMock.promptTemplate.findMany.mockResolvedValue([
          { id: 1, name: 'Tutor Template', base_role: 'Tutor', is_active: true },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/templates/prompt')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('POST /api/templates/prompt', () => {
      it('should create a prompt template', async () => {
        prismaMock.promptTemplate.create.mockResolvedValue({
          id: 1, name: 'New Template', base_role: 'Tutor', is_active: true,
        });

        const res = await request(app.getHttpServer())
          .post('/api/templates/prompt')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'New Template',
            base_role: 'Sos un tutor de administracion',
            knowledge_base_prompt: 'Leyes laborales',
          })
          .expect(201);

        expect(res.body).toHaveProperty('id', 1);
      });
    });

    describe('POST /api/templates/prompt/:id/duplicate', () => {
      it('should duplicate a prompt template', async () => {
        prismaMock.promptTemplate.findUnique.mockResolvedValue({
          id: 1, name: 'Original', base_role: 'Tutor', description: null,
          category: null, course_context: null, personality_traits: null,
          knowledge_base_prompt: 'KB',
        });
        prismaMock.promptTemplate.create.mockResolvedValue({
          id: 2, name: 'Copy', base_role: 'Tutor',
        });

        const res = await request(app.getHttpServer())
          .post('/api/templates/prompt/1/duplicate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Copy' })
          .expect(201);

        expect(res.body).toHaveProperty('id', 2);
      });
    });
  });

  // ─── Prompt Config ─────────────────────────────────────────────────────

  describe('Prompt Config', () => {
    describe('GET /api/templates/prompt-config/:courseId', () => {
      it('should return prompt config for a course', async () => {
        prismaMock.courseConfig.findUnique.mockResolvedValue({
          course_id: 'c1', prompt_template_id: 1,
          prompt_generation_mode: 'template', base_role: 'Tutor',
        });

        const res = await request(app.getHttpServer())
          .get('/api/templates/prompt-config/c1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('prompt_template_id', 1);
      });

      it('should return empty for non-existent config', async () => {
        prismaMock.courseConfig.findUnique.mockResolvedValue(null);

        const res = await request(app.getHttpServer())
          .get('/api/templates/prompt-config/nonexistent')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // NestJS serializes null as empty object in JSON
        expect(res.body).toEqual({});
      });
    });

    describe('POST /api/templates/prompt-config/:courseId/assign-template', () => {
      it('should assign a template to a course', async () => {
        prismaMock.promptTemplate.findUnique.mockResolvedValue({ id: 1, base_role: 'Tutor' });
        prismaMock.courseConfig.upsert.mockResolvedValue({
          course_id: 'c1', prompt_template_id: 1,
        });

        const res = await request(app.getHttpServer())
          .post('/api/templates/prompt-config/c1/assign-template')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ templateId: 1 })
          .expect(201);

        expect(res.body).toHaveProperty('prompt_template_id', 1);
      });

      it('should return 404 if template not found', async () => {
        prismaMock.promptTemplate.findUnique.mockResolvedValue(null);

        await request(app.getHttpServer())
          .post('/api/templates/prompt-config/c1/assign-template')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ templateId: 999 })
          .expect(404);
      });
    });

    describe('POST /api/templates/prompt-config/:courseId/save', () => {
      it('should save prompt configuration', async () => {
        prismaMock.courseConfig.upsert.mockResolvedValue({
          course_id: 'c1', prompt_generation_mode: 'manual',
        });

        const res = await request(app.getHttpServer())
          .post('/api/templates/prompt-config/c1/save')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            promptData: {
              generation_mode: 'manual',
              base_role: 'Custom tutor',
            },
          })
          .expect(201);

        expect(res.body).toHaveProperty('success', true);
      });
    });
  });
});

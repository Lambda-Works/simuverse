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

describe('Simulations Controller PR4 (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'dev-secret';
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      simulation: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      simulationInstance: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      simulationChatLog: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      course: {
        findUnique: jest.fn(),
      },
      courseConfig: {
        findUnique: jest.fn(),
      },
      scenario: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      courseDocument: {
        findMany: jest.fn(),
      },
      telemetryLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
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
    teacherToken = signToken({ sub: 'teacher-id', email: 'teacher@test.com', role: 'teacher' });
    studentToken = signToken({ sub: 'student-id', email: 'student@test.com', role: 'student' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default user mock
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === 'admin-id') {
        return Promise.resolve({
          id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin',
          password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
        });
      }
      if (where.id === 'student-id') {
        return Promise.resolve({
          id: 'student-id', name: 'Student', email: 'student@test.com', role: 'student',
          password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
        });
      }
      if (where.id === 'teacher-id') {
        return Promise.resolve({
          id: 'teacher-id', name: 'Teacher', email: 'teacher@test.com', role: 'teacher',
          password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
        });
      }
      return Promise.resolve(null);
    });

    // Default simulation mock
    prismaMock.simulation.findUnique.mockResolvedValue({
      id: 'sim-uuid', student_id: 'student-id', course_id: 'course-uuid',
      status: 'active', started_at: new Date(),
    });

    // Default scenario mock
    prismaMock.simulation.findUnique.mockImplementation(({ where, include }) => {
      if (include?.course) {
        return Promise.resolve({
          id: 'sim-uuid', student_id: 'student-id', course_id: 'course-uuid',
          status: 'active', started_at: new Date(),
          course: {
            title: 'Course A', category: 'administracion',
            scenarios: [{ id: 'sc-1', description: 'Test scenario', content: {} }],
          },
        });
      }
      return Promise.resolve({
        id: 'sim-uuid', student_id: 'student-id', course_id: 'course-uuid',
        status: 'active', started_at: new Date(),
      });
    });

    // Default config mock
    prismaMock.courseConfig.findUnique.mockResolvedValue({
      id: 'cfg-1', course_id: 'course-uuid',
      base_role: 'Eres un tutor de administracion',
      course_context: 'Curso de administracion',
      knowledge_base_prompt: 'Leyes laborales',
      personality_traits: ['amable', 'profesional'],
      tone: 'profesional',
      language: 'es',
      role_behavior: 'Comportamiento generoso',
      chatbot_humano_enabled: false,
    });

    // Default chat log mocks (needed for async persistence)
    prismaMock.simulationChatLog.findMany.mockResolvedValue([]);
    prismaMock.simulationChatLog.create.mockResolvedValue({});
  });

  // ─── Task 4.1: Feature flag gate tests ────────────────────────────────

  describe('POST /api/simulations/:id/message — feature flag gate', () => {
    it('should use legacy flow when chatbot_humano_enabled is false', async () => {
      prismaMock.courseConfig.findUnique.mockResolvedValue({
        id: 'cfg-1', course_id: 'course-uuid',
        base_role: 'Eres un tutor', course_context: 'Context',
        knowledge_base_prompt: 'KB', personality_traits: [],
        chatbot_humano_enabled: false,
      });

      const response = await request(app.getHttpServer())
        .post('/api/simulations/sim-uuid/message')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Hola tutor' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'sim-uuid');
      expect(response.body).toHaveProperty('message', 'Hola tutor');
      expect(response.body).toHaveProperty('response');
      // Legacy response has no 'state' or 'triggers' fields
      expect(response.body).not.toHaveProperty('state');
      expect(response.body).not.toHaveProperty('triggers');
    });

    it('should use new chatbot humano flow when chatbot_humano_enabled is true', async () => {
      prismaMock.courseConfig.findUnique.mockResolvedValue({
        id: 'cfg-1', course_id: 'course-uuid',
        base_role: 'Eres un tutor', course_context: 'Context',
        knowledge_base_prompt: 'KB', personality_traits: ['amable'],
        tone: 'profesional', language: 'es', role_behavior: 'Generoso',
        chatbot_humano_enabled: true,
      });

      // Mock session memory hydration (empty)
      prismaMock.simulationChatLog.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .post('/api/simulations/sim-uuid/message')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Hola' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'sim-uuid');
      expect(response.body).toHaveProperty('message', 'Hola');
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('state');
      expect(response.body).toHaveProperty('triggers');
      expect(Array.isArray(response.body.triggers)).toBe(true);
    });

    it('should persist both user and AI turns when chatbot_humano enabled', async () => {
      prismaMock.courseConfig.findUnique.mockResolvedValue({
        id: 'cfg-1', course_id: 'course-uuid',
        base_role: 'Tutor', course_context: 'C',
        knowledge_base_prompt: 'KB', personality_traits: [],
        chatbot_humano_enabled: true,
      });
      prismaMock.simulationChatLog.findMany.mockResolvedValue([]);
      prismaMock.simulationChatLog.create.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/simulations/sim-uuid/message')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Test message' })
        .expect(201);

      // Should have called create twice (user turn + AI turn)
      expect(prismaMock.simulationChatLog.create).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Task 4.2: GET /:id/messages ──────────────────────────────────────

  describe('GET /api/simulations/:id/messages', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/simulations/sim-msg-auth/messages')
        .expect(401);
    });

    it('should return messages array for authenticated user', async () => {
      // Use unique ID to avoid cache collision
      const simId = 'sim-msg-history-test';

      // Mock simulation lookup for the unique ID
      prismaMock.simulation.findUnique.mockImplementation(({ where, include }) => {
        if (where.id === simId) {
          if (include?.course) {
            return Promise.resolve({
              id: simId, student_id: 'student-id', course_id: 'course-uuid',
              status: 'active', started_at: new Date(),
              course: {
                title: 'Course A', category: 'administracion',
                scenarios: [{ id: 'sc-1', description: 'Test', content: {} }],
              },
            });
          }
          return Promise.resolve({
            id: simId, student_id: 'student-id', course_id: 'course-uuid',
            status: 'active', started_at: new Date(),
          });
        }
        return Promise.resolve(null);
      });

      // Mock session memory hydration from DB
      prismaMock.simulationChatLog.findMany.mockResolvedValue([
        {
          id: 1, simulation_instance_id: simId, turn_number: 1,
          speaker: 'student', message: 'Hola', created_at: new Date(),
        },
        {
          id: 2, simulation_instance_id: simId, turn_number: 2,
          speaker: 'ai', message: 'Hola! Bienvenido.', created_at: new Date(),
        },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/api/simulations/${simId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('simulationId', simId);
      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages).toHaveLength(2);
      expect(response.body.messages[0]).toHaveProperty('speaker', 'student');
      expect(response.body.messages[1]).toHaveProperty('speaker', 'ai');
    });

    it('should return empty messages for new simulation', async () => {
      const simId = 'sim-fresh-messages';

      prismaMock.simulation.findUnique.mockImplementation(({ where, include }) => {
        if (where.id === simId) {
          if (include?.course) {
            return Promise.resolve({
              id: simId, student_id: 'student-id', course_id: 'course-uuid',
              status: 'active', started_at: new Date(),
              course: {
                title: 'Course A', category: 'administracion',
                scenarios: [{ id: 'sc-1', description: 'Test', content: {} }],
              },
            });
          }
          return Promise.resolve({
            id: simId, student_id: 'student-id', course_id: 'course-uuid',
            status: 'active', started_at: new Date(),
          });
        }
        return Promise.resolve(null);
      });

      prismaMock.simulationChatLog.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/api/simulations/${simId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.messages).toHaveLength(0);
    });
  });

  // ─── Task 4.3: GET /admin/:instanceId/history ─────────────────────────

  describe('GET /api/simulations/admin/:instanceId/history', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/simulations/admin/sim-admin-auth/history')
        .expect(401);
    });

    it('should return 403 for student role', async () => {
      await request(app.getHttpServer())
        .get('/api/simulations/admin/sim-admin-student/history')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return full chat log for admin', async () => {
      const simId = 'sim-admin-history';

      prismaMock.simulationChatLog.findMany.mockResolvedValue([
        {
          id: 1, simulation_instance_id: simId, turn_number: 1,
          speaker: 'student', message: 'Hola', is_correct: null,
          ref_number: null, metadata: null, created_at: new Date().toISOString(),
        },
        {
          id: 2, simulation_instance_id: simId, turn_number: 2,
          speaker: 'ai', message: 'Bienvenido', is_correct: null,
          ref_number: null, metadata: null, created_at: new Date().toISOString(),
        },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/api/simulations/admin/${simId}/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('simulationId', simId);
      expect(response.body).toHaveProperty('turns');
      expect(Array.isArray(response.body.turns)).toBe(true);
      expect(response.body.turns).toHaveLength(2);
    });

    it('should return full chat log for teacher', async () => {
      const simId = 'sim-admin-teacher';

      prismaMock.simulationChatLog.findMany.mockResolvedValue([
        {
          id: 1, simulation_instance_id: simId, turn_number: 1,
          speaker: 'student', message: 'Hola', is_correct: null,
          ref_number: null, metadata: null, created_at: new Date().toISOString(),
        },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/api/simulations/admin/${simId}/history`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.turns).toHaveLength(1);
    });
  });
});

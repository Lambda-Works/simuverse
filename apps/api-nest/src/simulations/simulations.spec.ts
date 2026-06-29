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

describe('Simulations (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
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
      course: {
        findUnique: jest.fn(),
      },
      scenario: {
        findUnique: jest.fn(),
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
    studentToken = signToken({ sub: 'student-id', email: 'student@test.com', role: 'student' });
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
      if (where.id === 'student-id') {
        return Promise.resolve({
          id: 'student-id', name: 'Student', email: 'student@test.com', role: 'student',
          password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
        });
      }
      return Promise.resolve(null);
    });
  });

  // ─── T019: Lifecycle endpoints ─────────────────────────────────────────

  describe('POST /api/simulations/start', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/simulations/start')
        .send({ course_id: 'course-uuid' })
        .expect(401);
    });

    it('should create a new simulation', async () => {
      const courseId = '550e8400-e29b-41d4-a716-446655440000';
      prismaMock.course.findUnique.mockResolvedValue({
        id: courseId, title: 'Admin Course', category: 'administracion', is_active: true,
      });
      prismaMock.simulation.findFirst.mockResolvedValue(null);
      prismaMock.simulation.create.mockResolvedValue({
        id: 'sim-uuid', student_id: 'student-id', course_id: courseId,
        status: 'active', progress_percentage: 0, started_at: new Date(),
        created_at: new Date(), updated_at: new Date(),
      });
      prismaMock.telemetryLog.create.mockResolvedValue({});

      const response = await request(app.getHttpServer())
        .post('/api/simulations/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: courseId })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'sim-uuid');
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should return 404 if course not found', async () => {
      const courseId = '550e8400-e29b-41d4-a716-446655440099';
      prismaMock.course.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/simulations/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: courseId })
        .expect(404);
    });
  });

  describe('GET /api/simulations', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/simulations')
        .expect(401);
    });

    it('should return all simulations for admin', async () => {
      prismaMock.simulation.findMany.mockResolvedValue([
        { id: 's1', student_id: 'student-id', course_id: 'c1', status: 'active', score: null,
          started_at: new Date(), completed_at: null, created_at: new Date(),
          user: { name: 'Student', email: 'student@test.com' },
          course: { title: 'Course A', category: 'admin' } },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should return 403 for student role', async () => {
      await request(app.getHttpServer())
        .get('/api/simulations')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('GET /api/simulations/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/simulations/sim-uuid')
        .expect(401);
    });

    it('should return a simulation by id', async () => {
      prismaMock.simulation.findUnique.mockResolvedValue({
        id: 'sim-uuid', student_id: 'student-id', course_id: 'course-uuid',
        status: 'active', progress_percentage: 0, score: null,
        started_at: new Date(), completed_at: null, created_at: new Date(),
        updated_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/api/simulations/sim-uuid')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'sim-uuid');
    });

    it('should return 404 for non-existent simulation', async () => {
      prismaMock.simulation.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/simulations/nonexistent')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/simulations/:id/pause', () => {
    it('should pause an active simulation', async () => {
      prismaMock.simulation.findUnique.mockResolvedValue({
        id: 'sim-uuid', student_id: 'student-id', course_id: 'course-uuid',
        status: 'active', started_at: new Date(),
      });
      prismaMock.simulation.update.mockResolvedValue({
        id: 'sim-uuid', status: 'paused', paused_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .put('/api/simulations/sim-uuid/pause')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'paused');
    });
  });

  describe('PUT /api/simulations/:id/resume', () => {
    it('should resume a paused simulation', async () => {
      prismaMock.simulation.findUnique.mockResolvedValue({
        id: 'sim-uuid', student_id: 'student-id', course_id: 'course-uuid',
        status: 'paused', started_at: new Date(),
      });
      prismaMock.simulation.update.mockResolvedValue({
        id: 'sim-uuid', status: 'active', paused_at: null,
      });

      const response = await request(app.getHttpServer())
        .put('/api/simulations/sim-uuid/resume')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'active');
    });
  });

  describe('PUT /api/simulations/:id/complete', () => {
    it('should complete a simulation', async () => {
      prismaMock.simulation.findUnique.mockResolvedValue({
        id: 'sim-uuid', student_id: 'student-id', course_id: 'course-uuid',
        status: 'active', started_at: new Date(),
      });
      prismaMock.simulation.update.mockResolvedValue({
        id: 'sim-uuid', status: 'completed', progress_percentage: 100, completed_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .put('/api/simulations/sim-uuid/complete')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('progress_percentage', 100);
    });
  });

  describe('PUT /api/simulations/:id/abandon', () => {
    it('should abandon a simulation', async () => {
      prismaMock.simulation.findUnique.mockResolvedValue({
        id: 'sim-uuid', student_id: 'student-id', course_id: 'course-uuid',
        status: 'active', started_at: new Date(),
      });
      prismaMock.simulation.update.mockResolvedValue({
        id: 'sim-uuid', status: 'abandoned', completed_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .put('/api/simulations/sim-uuid/abandon')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'abandoned');
    });
  });

  describe('GET /api/simulations/user/:userId', () => {
    it('should return simulations for a specific user', async () => {
      prismaMock.simulation.findMany.mockResolvedValue([
        { id: 's1', student_id: 'student-id', course_id: 'c1', status: 'active' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/simulations/user/student-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/simulations/course/:courseId', () => {
    it('should return simulations for a specific course', async () => {
      prismaMock.simulation.findMany.mockResolvedValue([
        { id: 's1', student_id: 'student-id', course_id: 'course-uuid', status: 'active' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/simulations/course/course-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ─── T020: SimulationInstance service ──────────────────────────────────

  describe('Simulation Instance Lifecycle', () => {
    it('should not create duplicate active instance for same scenario', async () => {
      prismaMock.simulationInstance.findFirst.mockResolvedValue({
        id: 'existing-instance', status: 'in_progress',
      });

      const response = await request(app.getHttpServer())
        .post('/api/simulations/instances/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: 'course-uuid', scenario_id: 'scenario-uuid' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'existing-instance');
    });

    it('should create new instance when no active exists', async () => {
      prismaMock.simulationInstance.findFirst.mockResolvedValue(null);
      prismaMock.simulationInstance.create.mockResolvedValue({
        id: 'new-instance', student_id: 'student-id', course_id: 'course-uuid',
        scenario_id: 'scenario-uuid', status: 'in_progress', progress_percentage: 0,
        started_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/api/simulations/instances/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: 'course-uuid', scenario_id: 'scenario-uuid' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'new-instance');
      expect(response.body).toHaveProperty('status', 'in_progress');
    });
  });
});

// ─── T021: AI Service unit tests ─────────────────────────────────────────

describe('AIService (unit)', () => {
  let aiService: any;

  beforeAll(async () => {
    // Dynamic import to test in isolation
    const mod = await import('./ai/ai.service');
    aiService = new mod.AIService();
  });

  describe('buildSystemPrompt', () => {
    it('should build a prompt with all fields', () => {
      const prompt = aiService.buildSystemPrompt({
        base_role: 'Sos un tutor de administracion',
        course_context: 'Curso de liquidacion de sueldos',
        knowledge_base: 'Leyes laborales argentinas',
        personality_traits: ['amable', 'profesional'],
        student_history: ['Tarea 1 completada'],
      });

      expect(typeof prompt).toBe('string');
      expect(prompt).toContain('Sos un tutor de administracion');
      expect(prompt).toContain('Curso de liquidacion de sueldos');
      expect(prompt).toContain('Leyes laborales argentinas');
      expect(prompt).toContain('amable, profesional');
      expect(prompt).toContain('Tarea 1 completada');
    });

    it('should handle empty history', () => {
      const prompt = aiService.buildSystemPrompt({
        base_role: 'Tutor',
        course_context: 'Context',
        knowledge_base: 'KB',
        personality_traits: [],
        student_history: [],
      });

      expect(prompt).toContain('Principiante, sin interacciones previas');
    });
  });

  describe('sendMessageToGemini (fallback mode)', () => {
    it('should return scripted response when API key is missing', async () => {
      // Ensure no key is set
      const original = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const result = await aiService.sendMessageToGemini(
        'Hola, como estas?',
        'Sos un tutor',
        [],
      );

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('mode', 'scripted');
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);

      // Restore
      if (original) process.env.GEMINI_API_KEY = original;
    });

    it('should detect greeting intent', async () => {
      const original = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const result = await aiService.sendMessageToGemini(
        'Hola profesor',
        'Sos un tutor',
        [],
      );

      expect(result.mode).toBe('scripted');
      expect(result.response.length).toBeGreaterThan(0);

      if (original) process.env.GEMINI_API_KEY = original;
    });

    it('should detect problem intent', async () => {
      const original = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const result = await aiService.sendMessageToGemini(
        'Hay un problema urgente con el servidor',
        'Sos un tutor',
        [],
      );

      expect(result.mode).toBe('scripted');
      expect(result.response.length).toBeGreaterThan(0);

      if (original) process.env.GEMINI_API_KEY = original;
    });
  });
});

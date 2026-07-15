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
        findFirst: jest.fn(),
      },
      simulationChatLog: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
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
      prismaMock.scenario.findMany.mockResolvedValue([
        {
          id: 'sc-1',
          course_id: courseId,
          title: 'Práctica 1',
          sequence_index: 1,
          agent_key: 'practica-1',
          scenario_type: 'practice',
          is_active: true,
          prior_context: null,
          difficulty: 'medium',
        },
      ]);
      prismaMock.simulationInstance.findMany.mockResolvedValue([]);
      prismaMock.simulationInstance.findFirst.mockResolvedValue(null);
      prismaMock.simulationInstance.create.mockResolvedValue({
        id: 'inst-1',
        student_id: 'student-id',
        course_id: courseId,
        scenario_id: 'sc-1',
        status: 'in_progress',
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

      expect(response.body).toHaveProperty('id', 'inst-1');
      expect(response.body).toHaveProperty('session_id', 'inst-1');
      expect(response.body).toHaveProperty('agent_key', 'practica-1');
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
      prismaMock.simulationInstance.findUnique.mockResolvedValue(null);
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
      prismaMock.simulationInstance.findUnique.mockResolvedValue(null);
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
      prismaMock.simulationInstance.findUnique.mockResolvedValue(null);
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
      prismaMock.simulationInstance.findUnique.mockResolvedValue(null);
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
    const practiceScenario = {
      id: 'scenario-uuid',
      course_id: 'course-uuid',
      title: 'Práctica 1',
      sequence_index: 1,
      agent_key: 'practica-1',
      scenario_type: 'practice',
      is_active: true,
      prior_context: null,
      difficulty: 'medium',
    };

    beforeEach(() => {
      prismaMock.scenario.findMany.mockResolvedValue([practiceScenario]);
      prismaMock.simulationInstance.findMany.mockResolvedValue([]);
    });

    it('should not create duplicate active instance for same scenario', async () => {
      prismaMock.simulationInstance.findFirst.mockResolvedValue({
        id: 'existing-instance',
        status: 'in_progress',
        scenario_id: 'scenario-uuid',
        student_id: 'student-id',
        course_id: 'course-uuid',
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
    aiService = new mod.AIService({} as any);
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

  describe('sendMessage (fallback mode)', () => {
    it('should return scripted response when no providers are configured', async () => {
      const result = await aiService.sendMessage(
        'Hola, como estas?',
        'Sos un tutor',
        [],
      );

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('mode', 'scripted');
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
    });

    it('should detect greeting intent', async () => {
      const result = await aiService.sendMessage(
        'Hola profesor',
        'Sos un tutor',
        [],
      );

      expect(result.mode).toBe('scripted');
      expect(result.response.length).toBeGreaterThan(0);
    });

    it('should detect problem intent', async () => {
      const result = await aiService.sendMessage(
        'Hay un problema urgente con el servidor',
        'Sos un tutor',
        [],
      );

      expect(result.mode).toBe('scripted');
      expect(result.response.length).toBeGreaterThan(0);
    });
  });
});

// ─── T022: CrisisEngine unit tests ───────────────────────────────────────

describe('CrisisEngine (unit)', () => {
  let crisisEngine: any;

  beforeAll(async () => {
    const mod = await import('./engines/crisis-engine.service');
    crisisEngine = new mod.CrisisEngine();
  });

  beforeEach(() => {
    // Clear all active crises
    crisisEngine.clearAll();
  });

  describe('getOrCreateCrisis', () => {
    it('should create a crisis event for a simulation', () => {
      const event = crisisEngine.getOrCreateCrisis('sim-1', 'administracion');

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('simulationId', 'sim-1');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('severity');
      expect(event).toHaveProperty('options');
      expect(event.options.length).toBeGreaterThan(0);
      expect(event).toHaveProperty('status', 'active');
    });

    it('should return existing crisis if already active', () => {
      const first = crisisEngine.getOrCreateCrisis('sim-1', 'administracion');
      const second = crisisEngine.getOrCreateCrisis('sim-1', 'administracion');

      expect(first.id).toBe(second.id);
    });

    it('should use custom events when provided', () => {
      const customEvents = [
        {
          title: 'Custom Crisis',
          description: 'A custom event',
          severity: 'low',
          options: [{ text: 'Option A', score: 80, feedback: 'Good' }],
        },
      ];

      const event = crisisEngine.getOrCreateCrisis('sim-1', 'administracion', customEvents);
      expect(event.title).toBe('Custom Crisis');
    });

    it('should create different crises for different simulations', () => {
      const event1 = crisisEngine.getOrCreateCrisis('sim-1', 'administracion');
      const event2 = crisisEngine.getOrCreateCrisis('sim-2', 'rrhh');

      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe('resolveCrisis', () => {
    it('should resolve a crisis with the chosen option', () => {
      crisisEngine.getOrCreateCrisis('sim-1', 'informatica');
      const resolved = crisisEngine.resolveCrisis('sim-1', 'a');

      expect(resolved).not.toBeNull();
      expect(resolved.status).toBe('resolved');
      expect(resolved.selectedOptionId).toBe('a');
      expect(typeof resolved.score).toBe('number');
      expect(resolved).toHaveProperty('feedback');
      expect(resolved).toHaveProperty('resolvedAt');
    });

    it('should return null for non-existent simulation', () => {
      const result = crisisEngine.resolveCrisis('nonexistent', 'a');
      expect(result).toBeNull();
    });

    it('should return event for already resolved crisis', () => {
      crisisEngine.getOrCreateCrisis('sim-1', 'emprendimiento');
      crisisEngine.resolveCrisis('sim-1', 'a');
      const second = crisisEngine.resolveCrisis('sim-1', 'b');
      // Express returns the existing event when already resolved
      expect(second).not.toBeNull();
      expect(second!.status).toBe('resolved');
    });
  });

  describe('clearCrisis', () => {
    it('should clear crisis state for a simulation', () => {
      crisisEngine.getOrCreateCrisis('sim-1', 'rrhh');
      crisisEngine.clearCrisis('sim-1');

      // Should create a new one
      const newEvent = crisisEngine.getOrCreateCrisis('sim-1', 'rrhh');
      expect(newEvent).toHaveProperty('status', 'active');
    });
  });
});

// ─── T023: RulesEngine unit tests ────────────────────────────────────────

describe('RulesEngine (unit)', () => {
  let rulesEngine: any;

  beforeAll(async () => {
    const mod = await import('./engines/rules-engine.service');
    rulesEngine = new mod.RulesEngine();
  });

  describe('validate', () => {
    it('should validate salary calculation for administracion', async () => {
      const result = await rulesEngine.validate('administracion', 'socialCharges', {
        base_salary: 500000,
      });

      expect(result).toHaveProperty('valid', true);
    });

    it('should reject invalid salary for administracion', async () => {
      const result = await rulesEngine.validate('administracion', 'socialCharges', {
        base_salary: 0,
      });

      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('error');
    });

    it('should validate communication for rrhh', async () => {
      const result = await rulesEngine.validate('rrhh', 'communication', {
        text: 'Además, considerando la situación, propongo una solución.',
      });

      expect(result).toHaveProperty('score');
      expect(typeof result.score).toBe('number');
    });

    it('should validate python script for informatica', async () => {
      const result = await rulesEngine.validate('informatica', 'pythonScript', {
        code: 'def calculate():\n  return 42',
      });

      expect(result).toHaveProperty('valid');
    });

    it('should return error for unsupported family', async () => {
      const result = await rulesEngine.validate('unknown', 'any', {});
      expect(result).toHaveProperty('valid', false);
    });
  });

  describe('execute', () => {
    it('should execute salary rules for administracion', async () => {
      const result = await rulesEngine.execute('administracion', 'socialCharges', {
        base_salary: 500000,
      });

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should throw for unsupported family execution', async () => {
      await expect(rulesEngine.execute('rrhh', 'any', {})).rejects.toThrow();
    });
  });
});

// ─── T024: TelemetryLog integrity hash chain tests ──────────────────────

describe('TelemetryService (unit)', () => {
  let telemetryService: any;

  beforeAll(async () => {
    const mod = await import('./telemetry.service');
    telemetryService = new mod.TelemetryService();
  });

  describe('computeIntegrityHash', () => {
    it('should compute SHA-256 hash for a telemetry entry', () => {
      const hash = telemetryService.computeIntegrityHash({
        simulation_id: 'sim-1',
        action: 'test_action',
        action_type: 'user_input',
        timestamp: 1234567890,
        previous_hash: null,
      });

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 hex digest
    });

    it('should produce different hashes for different data', () => {
      const hash1 = telemetryService.computeIntegrityHash({
        simulation_id: 'sim-1',
        action: 'action1',
        action_type: 'user_input',
        timestamp: 1234567890,
        previous_hash: null,
      });

      const hash2 = telemetryService.computeIntegrityHash({
        simulation_id: 'sim-1',
        action: 'action2',
        action_type: 'user_input',
        timestamp: 1234567890,
        previous_hash: null,
      });

      expect(hash1).not.toBe(hash2);
    });

    it('should include previous_hash in computation for chain integrity', () => {
      const hash1 = telemetryService.computeIntegrityHash({
        simulation_id: 'sim-1',
        action: 'action1',
        action_type: 'user_input',
        timestamp: 1234567890,
        previous_hash: null,
      });

      const hash2 = telemetryService.computeIntegrityHash({
        simulation_id: 'sim-1',
        action: 'action1',
        action_type: 'user_input',
        timestamp: 1234567890,
        previous_hash: hash1,
      });

      // Same data but different previous_hash → different hash
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyChain', () => {
    it('should verify a valid chain of hashes', () => {
      const entries = [
        { simulation_id: 'sim-1', action: 'a1', action_type: 'user_input', timestamp: 100 },
        { simulation_id: 'sim-1', action: 'a2', action_type: 'system_action', timestamp: 200 },
        { simulation_id: 'sim-1', action: 'a3', action_type: 'ai_response', timestamp: 300 },
      ];

      // Build chain iteratively
      const chain: any[] = [];
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const prevHash = i === 0 ? null : chain[i - 1].integrity_hash;
        const hash = telemetryService.computeIntegrityHash({ ...entry, previous_hash: prevHash });
        chain.push({ ...entry, integrity_hash: hash, previous_hash: prevHash });
      }

      const valid = telemetryService.verifyChain(chain);
      expect(valid).toBe(true);
    });

    it('should detect tampered chain', () => {
      const entries = [
        { simulation_id: 'sim-1', action: 'a1', action_type: 'user_input', timestamp: 100 },
        { simulation_id: 'sim-1', action: 'a2', action_type: 'system_action', timestamp: 200 },
      ];

      // Build chain iteratively
      const chain: any[] = [];
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const prevHash = i === 0 ? null : chain[i - 1].integrity_hash;
        const hash = telemetryService.computeIntegrityHash({ ...entry, previous_hash: prevHash });
        chain.push({ ...entry, integrity_hash: hash, previous_hash: prevHash });
      }

      // Tamper with second entry's hash
      chain[1].integrity_hash = 'tampered';

      const valid = telemetryService.verifyChain(chain);
      expect(valid).toBe(false);
    });
  });
});

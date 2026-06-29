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

describe('TelemetryLogs (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  const simId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const courseId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeAll(async () => {
    prismaMock = {
      telemetryLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
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

  describe('POST /api/telemetry-logs', () => {
    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/telemetry-logs')
        .send({ simulation_id: simId, user_id: userId, course_id: courseId, action: 'test', action_type: 'user_input', response_time_ms: 100 })
        .expect(401);
    });

    it('should create a telemetry log with integrity hash', async () => {
      prismaMock.telemetryLog.findFirst.mockResolvedValue(null);
      prismaMock.telemetryLog.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'log-1', ...data, created_at: new Date() }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/telemetry-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          simulation_id: simId,
          user_id: userId,
          course_id: courseId,
          action: 'user clicked button',
          action_type: 'user_input',
          response_time_ms: 150,
          metadata: { button: 'submit' },
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('integrity_hash');
      expect(res.body.action_type).toBe('user_input');
    });
  });

  describe('GET /api/telemetry-logs', () => {
    it('should list telemetry logs with filters', async () => {
      prismaMock.telemetryLog.findMany.mockResolvedValue([
        { id: '1', simulation_id: simId, action_type: 'user_input' },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/telemetry-logs?simulation_id=${simId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/telemetry-logs/:id', () => {
    it('should return a single telemetry log', async () => {
      prismaMock.telemetryLog.findUnique.mockResolvedValue({
        id: 'log-1', simulation_id: simId, action: 'test',
        action_type: 'user_input', response_time_ms: 100, metadata: {},
      });

      const res = await request(app.getHttpServer())
        .get('/api/telemetry-logs/log-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', 'log-1');
    });
  });
});

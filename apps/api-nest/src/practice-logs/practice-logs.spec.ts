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

describe('PracticeLogs (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;
  let studentToken: string;

  const studentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const courseId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  beforeAll(async () => {
    prismaMock = {
      practiceLogs: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
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
    studentToken = signToken({ sub: studentId, email: 'student@test.com', role: 'student' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === studentId) {
        return Promise.resolve({
          id: studentId, name: 'Student', email: 'student@test.com', role: 'student',
          password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
        });
      }
      if (where.id === 'admin-id') {
        return Promise.resolve({
          id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin',
          password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
        });
      }
      return Promise.resolve(null);
    });
  });

  // ─── POST /api/practice-logs ────────────────────────────────────────────

  describe('POST /api/practice-logs', () => {
    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/practice-logs')
        .send({ student_id: studentId, course_id: courseId, action_type: 'calculation', description: 'test', metadata: {} })
        .expect(401);
    });

    it('should create a practice log with integrity hash', async () => {
      prismaMock.practiceLogs.findFirst.mockResolvedValue(null);
      prismaMock.practiceLogs.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'log-1', ...data }),
      );

      const response = await request(app.getHttpServer())
        .post('/api/practice-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: studentId,
          course_id: courseId,
          action_type: 'calculation',
          description: 'Student performed calculation',
          metadata: { result: 42 },
        });
      // Debug: log body on failure
      if (response.status !== 201) {
        console.log('POST /api/practice-logs response:', response.status, JSON.stringify(response.body));
      }
      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('integrity_hash');
      expect(response.body).toHaveProperty('sequence_number', 1);
      expect(response.body.action_type).toBe('calculation');
      expect(response.body.metadata).toEqual({ result: 42 });
    });

    it('should increment sequence_number and chain previous_hash', async () => {
      prismaMock.practiceLogs.findFirst.mockResolvedValue({
        id: 'prev-log',
        integrity_hash: 'abc123',
        sequence_number: 5,
      });
      prismaMock.practiceLogs.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'new-log', ...data }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/practice-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: studentId,
          course_id: courseId,
          action_type: 'decision_made',
          description: 'Decision made',
          metadata: {},
        })
        .expect(201);

      expect(res.body.sequence_number).toBe(6);
      expect(res.body.previous_hash).toBe('abc123');
      expect(res.body.integrity_hash).not.toBe('abc123');
    });
  });

  // ─── GET /api/practice-logs ────────────────────────────────────────────

  describe('GET /api/practice-logs', () => {
    it('should list practice logs for a student+course', async () => {
      prismaMock.practiceLogs.findMany.mockResolvedValue([
        { id: '1', student_id: studentId, course_id: courseId, action_type: 'calculation', sequence_number: 1 },
        { id: '2', student_id: studentId, course_id: courseId, action_type: 'decision_made', sequence_number: 2 },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/practice-logs?student_id=${studentId}&course_id=${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });
  });

  // ─── GET /api/practice-logs/export/csv ─────────────────────────────────

  describe('GET /api/practice-logs/export/csv', () => {
    it('should return CSV with integrity verification column', async () => {
      prismaMock.practiceLogs.findMany.mockResolvedValue([
        {
          id: '1', student_id: studentId, course_id: courseId,
          action_type: 'calculation', description: 'Calc result',
          metadata: { val: 1 }, sequence_number: 1,
          integrity_hash: 'hash1', previous_hash: null,
          timestamp: BigInt(Date.now()), created_at: new Date(),
        },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/practice-logs/export/csv?student_id=${studentId}&course_id=${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.text).toContain('Sequence');
      expect(res.text).toContain('Integrity Hash');
      expect(res.text).toContain('Verified');
      // The Verified column should contain YES or NO
      const rows = res.text.split('\n');
      expect(rows.length).toBe(2); // header + 1 data row
      expect(rows[1]).toMatch(/,(YES|NO)$/);
    });
  });

  // ─── GET /api/practice-logs/verify ─────────────────────────────────────

  describe('GET /api/practice-logs/verify', () => {
    it('should verify chain integrity', async () => {
      prismaMock.practiceLogs.findMany.mockResolvedValue([
        {
          id: '1', student_id: studentId, course_id: courseId,
          action_type: 'calculation', description: 'First',
          metadata: {}, sequence_number: 1,
          integrity_hash: 'valid-hash', previous_hash: null,
          timestamp: BigInt(Date.now()),
        },
      ]);

      // Mock the service to return valid
      const res = await request(app.getHttpServer())
        .get(`/api/practice-logs/verify?student_id=${studentId}&course_id=${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('isValid');
      expect(res.body).toHaveProperty('details');
      expect(res.body.details).toHaveProperty('totalLogs');
    });
  });
});

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

describe('Scenarios (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  beforeAll(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      scenario: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      course: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
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

  describe('GET /api/scenarios', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/scenarios')
        .expect(401);
    });

    it('should return all scenarios', async () => {
      prismaMock.scenario.findMany.mockResolvedValue([
        { id: 's1', course_id: 'c1', title: 'Scenario A', difficulty: 'easy', is_active: true, created_at: new Date() },
        { id: 's2', course_id: 'c1', title: 'Scenario B', difficulty: 'hard', is_active: true, created_at: new Date() },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/scenarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should filter by course_id', async () => {
      prismaMock.scenario.findMany.mockResolvedValue([
        { id: 's1', course_id: 'c1', title: 'Scenario A', difficulty: 'easy', is_active: true, created_at: new Date() },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/scenarios?course_id=c1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('course_id', 'c1');
    });

    it('should filter by difficulty', async () => {
      prismaMock.scenario.findMany.mockResolvedValue([
        { id: 's2', course_id: 'c1', title: 'Scenario B', difficulty: 'hard', is_active: true, created_at: new Date() },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/scenarios?difficulty=hard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('difficulty', 'hard');
    });
  });

  describe('GET /api/scenarios/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/scenarios/s1')
        .expect(401);
    });

    it('should return a scenario by id', async () => {
      prismaMock.scenario.findUnique.mockResolvedValue({
        id: 's1', course_id: 'c1', title: 'Scenario A', difficulty: 'easy',
        is_active: true, created_at: new Date(), updated_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/api/scenarios/s1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 's1');
      expect(response.body).toHaveProperty('title', 'Scenario A');
    });

    it('should return 404 for non-existent scenario', async () => {
      prismaMock.scenario.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/scenarios/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/scenarios', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/scenarios')
        .send({ course_id: 'c1', title: 'New Scenario' })
        .expect(401);
    });

    it('should create a new scenario', async () => {
      prismaMock.scenario.create.mockResolvedValue({
        id: 's-new', course_id: 'c1', title: 'New Scenario', difficulty: 'medium',
        is_active: true, created_at: new Date(), updated_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ course_id: 'c1', title: 'New Scenario' })
        .expect(201);

      expect(response.body).toHaveProperty('title', 'New Scenario');
    });

    it('should return 400 if required fields missing', async () => {
      await request(app.getHttpServer())
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing course_id' })
        .expect(400);
    });
  });

  describe('PUT /api/scenarios/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .put('/api/scenarios/s1')
        .send({ title: 'Updated' })
        .expect(401);
    });

    it('should update a scenario', async () => {
      prismaMock.scenario.update.mockResolvedValue({
        id: 's1', course_id: 'c1', title: 'Updated Scenario', difficulty: 'hard',
        is_active: true, created_at: new Date(), updated_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .put('/api/scenarios/s1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Scenario', difficulty: 'hard' })
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Updated Scenario');
    });
  });

  describe('DELETE /api/scenarios/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .delete('/api/scenarios/s1')
        .expect(401);
    });

    it('should soft-delete a scenario', async () => {
      prismaMock.scenario.update.mockResolvedValue({
        id: 's1', course_id: 'c1', title: 'Scenario', is_active: false,
      });

      const response = await request(app.getHttpServer())
        .delete('/api/scenarios/s1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent scenario', async () => {
      prismaMock.scenario.update.mockRejectedValue({ code: 'P2025' });

      await request(app.getHttpServer())
        .delete('/api/scenarios/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

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

describe('Courses (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  beforeAll(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      course: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      courseConfig: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      courseEndorser: { deleteMany: jest.fn(), createMany: jest.fn() },
      courseSimulatedCompany: { deleteMany: jest.fn(), createMany: jest.fn() },
      courseFoundationConfig: { deleteMany: jest.fn(), createMany: jest.fn() },
      courseSponsor: { deleteMany: jest.fn(), createMany: jest.fn() },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
    prismaMock.$transaction = jest.fn((callback: any) => callback(prismaMock));

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

  describe('GET /api/courses', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/courses')
        .expect(401);
    });

    it('should return all active courses', async () => {
      prismaMock.course.findMany.mockResolvedValue([
        { id: 'c1', course_id: 'CS101', title: 'Intro to CS', category: 'it', is_active: true, created_at: new Date() },
        { id: 'c2', course_id: 'HR101', title: 'HR Basics', category: 'rrhh', is_active: true, created_at: new Date() },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title', 'Intro to CS');
    });
  });

  describe('GET /api/courses/:courseId', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/courses/c1')
        .expect(401);
    });

    it('should return a course by courseId', async () => {
      prismaMock.course.findUnique.mockResolvedValue({
        id: 'c1', course_id: 'CS101', title: 'Intro to CS', category: 'it',
        is_active: true, created_at: new Date(), updated_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/api/courses/CS101')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('course_id', 'CS101');
      expect(response.body).toHaveProperty('title', 'Intro to CS');
    });

    it('should return 404 for non-existent course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/courses/NONEXISTENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/courses', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/courses')
        .send({ course_id: 'NEW1', title: 'New Course', category: 'it' })
        .expect(401);
    });

    it('should create a new course', async () => {
      const created = {
        id: 'c-new', course_id: 'NEW1', title: 'New Course', category: 'it',
        is_active: true, created_at: new Date(), updated_at: new Date(),
      };
      prismaMock.course.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'c-new') return Promise.resolve(created);
        return Promise.resolve(null);
      });
      prismaMock.course.create.mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ course_id: 'NEW1', title: 'New Course', category: 'it' })
        .expect(201);

      expect(response.body).toHaveProperty('course_id', 'NEW1');
      expect(response.body).toHaveProperty('title', 'New Course');
    });

    it('should return 409 if course_id already exists', async () => {
      prismaMock.course.findUnique.mockResolvedValue({
        id: 'existing', course_id: 'CS101', title: 'Existing', category: 'it',
      });

      await request(app.getHttpServer())
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ course_id: 'CS101', title: 'Duplicate', category: 'it' })
        .expect(409);
    });

    it('should return 400 if required fields missing', async () => {
      await request(app.getHttpServer())
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing fields' })
        .expect(400);
    });
  });

  describe('PUT /api/courses/:courseId', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .put('/api/courses/c1')
        .send({ title: 'Updated' })
        .expect(401);
    });

    it('should update a course', async () => {
      const updated = {
        id: 'c1', course_id: 'CS101', title: 'Updated CS', category: 'it',
        is_active: true, created_at: new Date(), updated_at: new Date(),
      };
      prismaMock.course.update.mockResolvedValue(updated);
      prismaMock.course.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'CS101' || where.course_id === 'CS101') return Promise.resolve(updated);
        return Promise.resolve(null);
      });

      const response = await request(app.getHttpServer())
        .put('/api/courses/CS101')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated CS' })
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Updated CS');
    });
  });

  describe('DELETE /api/courses/:courseId', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .delete('/api/courses/c1')
        .expect(401);
    });

    it('should soft-delete a course', async () => {
      prismaMock.course.update.mockResolvedValue({
        id: 'c1', course_id: 'CS101', title: 'CS', is_active: false,
      });

      const response = await request(app.getHttpServer())
        .delete('/api/courses/CS101')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent course', async () => {
      prismaMock.course.update.mockRejectedValue({ code: 'P2025' });

      await request(app.getHttpServer())
        .delete('/api/courses/NONEXISTENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

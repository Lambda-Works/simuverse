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

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
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
    studentToken = signToken({ sub: 'student-id', email: 'student@test.com', role: 'student' });
  });

  afterAll(async () => {
    await app.close();
  });

  // Mock the FirebaseStrategy (JWT fallback) user lookup
  beforeEach(() => {
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === 'admin-id' || where.id === 'student-id') {
        return Promise.resolve({
          id: where.id,
          name: where.id === 'admin-id' ? 'Admin User' : 'Student User',
          email: where.id === 'admin-id' ? 'admin@test.com' : 'student@test.com',
          role: where.id === 'admin-id' ? 'admin' : 'student',
          password_hash: '$2b$10$hashed',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('GET /api/users', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .expect(401);
    });

    it('should return all users for admin', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student', created_at: new Date() },
        { id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'teacher', created_at: new Date() },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name', 'Alice');
      expect(response.body[0]).not.toHaveProperty('password_hash');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/users/some-id')
        .expect(401);
    });

    it('should return a user by id', async () => {
      prismaMock.user.findUnique.mockImplementation(({ where }) => {
        // FirebaseStrategy validate() looks up the token user first
        if (where.id === 'admin-id') {
          return Promise.resolve({
            id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin',
            password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
          });
        }
        if (where.id === 'u1') {
          return Promise.resolve({
            id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student',
            created_at: new Date(), updated_at: new Date(),
          });
        }
        return Promise.resolve(null);
      });

      const response = await request(app.getHttpServer())
        .get('/api/users/u1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'u1');
      expect(response.body).toHaveProperty('name', 'Alice');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'nonexistent') return Promise.resolve(null);
        return Promise.resolve({
          id: where.id, name: 'Admin', email: 'admin@test.com', role: 'admin',
          password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
        });
      });

      await request(app.getHttpServer())
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 403 when student tries to view another user', async () => {
      prismaMock.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'student-id') {
          return Promise.resolve({
            id: 'student-id', name: 'Student', email: 'student@test.com', role: 'student',
            password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
          });
        }
        if (where.id === 'u1') {
          return Promise.resolve({
            id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student',
            created_at: new Date(), updated_at: new Date(),
          });
        }
        return Promise.resolve(null);
      });

      await request(app.getHttpServer())
        .get('/api/users/u1')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .put('/api/users/some-id')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('should update a user', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 'u1', name: 'Updated Alice', email: 'alice@test.com', role: 'student',
        created_at: new Date(), updated_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .put('/api/users/u1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Alice' })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Alice');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/some-id')
        .expect(401);
    });

    it('should soft-delete a user', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student',
      });

      const response = await request(app.getHttpServer())
        .delete('/api/users/u1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.update.mockRejectedValue({ code: 'P2025' });

      await request(app.getHttpServer())
        .delete('/api/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id/hard', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/some-id/hard')
        .expect(401);
    });

    it('should return 403 for non-admin role', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/u1/hard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 400 when target user is still active', async () => {
      prismaMock.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'admin-id') {
          return Promise.resolve({
            id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin',
            password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
          });
        }
        if (where.id === 'u1') {
          return Promise.resolve({ id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student', is_active: true });
        }
        return Promise.resolve(null);
      });

      await request(app.getHttpServer())
        .delete('/api/users/u1/hard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });

    it('should delete a deactivated user permanently', async () => {
      prismaMock.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'admin-id') {
          return Promise.resolve({
            id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin',
            password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
          });
        }
        if (where.id === 'u1') {
          return Promise.resolve({ id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student', is_active: false });
        }
        return Promise.resolve(null);
      });
      prismaMock.user.delete.mockResolvedValue({ id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student' });

      const response = await request(app.getHttpServer())
        .delete('/api/users/u1/hard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'admin-id') {
          return Promise.resolve({
            id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin',
            password_hash: '$2b$10$hashed', created_at: new Date(), updated_at: new Date(),
          });
        }
        return Promise.resolve(null);
      });

      await request(app.getHttpServer())
        .delete('/api/users/nonexistent/hard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

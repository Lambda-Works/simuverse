import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaMock: any;

  beforeAll(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      termsVersion: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      userTermsAcceptance: {
        create: jest.fn(),
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        password_hash: '$2b$10$hashed',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toEqual({
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'student',
      });
    });

    it('should return 409 if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing', email: 'taken@example.com' });

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'taken@example.com',
          password: 'password123',
          name: 'Existing User',
        })
        .expect(409);
    });

    it('should return 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
          name: 'Test',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 for a deactivated user with valid credentials', async () => {
      const bcrypt = await import('bcrypt');
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'uuid-inactive',
        email: 'inactive@example.com',
        role: 'student',
        password_hash: await bcrypt.hash('password123', 10),
        is_active: false,
      });

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });
});

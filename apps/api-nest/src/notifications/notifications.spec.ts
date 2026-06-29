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

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const notifId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  beforeAll(async () => {
    prismaMock = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

    adminToken = signToken({ sub: userId, email: 'user@test.com', role: 'admin' });
  });

  afterAll(async () => { await app.close(); });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === userId) {
        return Promise.resolve({ id: userId, name: 'User', email: 'user@test.com', role: 'admin' });
      }
      return Promise.resolve(null);
    });
  });

  describe('POST /api/notifications', () => {
    it('should create a notification', async () => {
      prismaMock.notification.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'new-notif', ...data, created_at: new Date() }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recipient_id: userId,
          type: 'system_alert',
          title: 'Test Notification',
          content: 'This is a test',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('system_alert');
      expect(res.body.is_read).toBe(false);
    });
  });

  describe('GET /api/notifications', () => {
    it('should list notifications for a recipient', async () => {
      prismaMock.notification.findMany.mockResolvedValue([
        { id: notifId, recipient_id: userId, type: 'system_alert', title: 'Test', is_read: false },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/notifications?recipient_id=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it('should filter unread notifications', async () => {
      prismaMock.notification.findMany.mockResolvedValue([
        { id: notifId, recipient_id: userId, type: 'system_alert', title: 'Test', is_read: false },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/notifications?recipient_id=${userId}&unread=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('should get a notification by id', async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: notifId, recipient_id: userId, type: 'system_alert', title: 'Test', content: 'Body',
      });

      const res = await request(app.getHttpServer())
        .get(`/api/notifications/${notifId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', notifId);
    });
  });

  describe('PUT /api/notifications/:id', () => {
    it('should update a notification', async () => {
      prismaMock.notification.update.mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      );

      const res = await request(app.getHttpServer())
        .put(`/api/notifications/${notifId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.title).toBe('Updated Title');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      prismaMock.notification.update.mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data, is_read: true, read_at: new Date() }),
      );

      const res = await request(app.getHttpServer())
        .put(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.is_read).toBe(true);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      prismaMock.notification.delete.mockResolvedValue({ id: notifId });

      const res = await request(app.getHttpServer())
        .delete(`/api/notifications/${notifId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });
  });
});

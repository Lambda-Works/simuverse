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

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  beforeAll(async () => {
    prismaMock = {
      role: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      systemFunctionality: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      rolePermission: {
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
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

  // ── Roles ─────────────────────────────────────────────────────────

  describe('Roles', () => {
    describe('POST /api/rbac/roles', () => {
      it('should create a role', async () => {
        prismaMock.role.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 1, ...data, created_at: new Date() }),
        );

        const res = await request(app.getHttpServer())
          .post('/api/rbac/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'editor', description: 'Can edit content' })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('editor');
        expect(res.body.is_active).toBe(true);
      });
    });

    describe('GET /api/rbac/roles', () => {
      it('should list all roles', async () => {
        prismaMock.role.findMany.mockResolvedValue([
          { id: 1, name: 'admin', description: 'Admin role', is_active: true },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/rbac/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('GET /api/rbac/roles/:id', () => {
      it('should get a role by id', async () => {
        prismaMock.role.findUnique.mockResolvedValue({
          id: 1, name: 'admin', description: 'Admin role', is_active: true,
        });

        const res = await request(app.getHttpServer())
          .get('/api/rbac/roles/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.name).toBe('admin');
      });
    });

    describe('PUT /api/rbac/roles/:id', () => {
      it('should update a role', async () => {
        prismaMock.role.findUnique.mockResolvedValue({ id: 1, name: 'editor' });
        prismaMock.role.update.mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data }),
        );

        const res = await request(app.getHttpServer())
          .put('/api/rbac/roles/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ description: 'Updated description' })
          .expect(200);

        expect(res.body.description).toBe('Updated description');
      });
    });

    describe('DELETE /api/rbac/roles/:id', () => {
      it('should delete a role', async () => {
        prismaMock.role.findUnique.mockResolvedValue({ id: 1, name: 'editor' });
        prismaMock.role.delete.mockResolvedValue({ id: 1 });

        const res = await request(app.getHttpServer())
          .delete('/api/rbac/roles/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('message');
      });
    });
  });

  // ── System Functionalities ────────────────────────────────────────

  describe('System Functionalities', () => {
    describe('POST /api/rbac/functionalities', () => {
      it('should create a functionality', async () => {
        prismaMock.systemFunctionality.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 1, ...data, created_at: new Date() }),
        );

        const res = await request(app.getHttpServer())
          .post('/api/rbac/functionalities')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'User Management', module: 'admin', route: '/admin/users' })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('User Management');
      });
    });

    describe('GET /api/rbac/functionalities', () => {
      it('should list all functionalities', async () => {
        prismaMock.systemFunctionality.findMany.mockResolvedValue([
          { id: 1, name: 'User Management', module: 'admin', is_active: true },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/rbac/functionalities')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('GET /api/rbac/functionalities/:id', () => {
      it('should get a functionality by id', async () => {
        prismaMock.systemFunctionality.findUnique.mockResolvedValue({
          id: 1, name: 'User Management', module: 'admin', is_active: true,
        });

        const res = await request(app.getHttpServer())
          .get('/api/rbac/functionalities/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.name).toBe('User Management');
      });
    });

    describe('PUT /api/rbac/functionalities/:id', () => {
      it('should update a functionality', async () => {
        prismaMock.systemFunctionality.findUnique.mockResolvedValue({ id: 1, name: 'User Management' });
        prismaMock.systemFunctionality.update.mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data }),
        );

        const res = await request(app.getHttpServer())
          .put('/api/rbac/functionalities/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ description: 'Updated desc' })
          .expect(200);

        expect(res.body.description).toBe('Updated desc');
      });
    });

    describe('DELETE /api/rbac/functionalities/:id', () => {
      it('should delete a functionality', async () => {
        prismaMock.systemFunctionality.findUnique.mockResolvedValue({ id: 1, name: 'User Management' });
        prismaMock.systemFunctionality.delete.mockResolvedValue({ id: 1 });

        const res = await request(app.getHttpServer())
          .delete('/api/rbac/functionalities/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('message');
      });
    });
  });

  // ── Role Permissions ──────────────────────────────────────────────

  describe('Role Permissions', () => {
    describe('POST /api/rbac/permissions', () => {
      it('should assign a permission (upsert)', async () => {
        prismaMock.rolePermission.upsert.mockImplementation(({ create }) =>
          Promise.resolve({ id: 1, ...create, enabled: true }),
        );

        const res = await request(app.getHttpServer())
          .post('/api/rbac/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role_name: 'admin', functionality_id: 1, enabled: true })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.role_name).toBe('admin');
      });
    });

    describe('GET /api/rbac/permissions', () => {
      it('should list permissions for a role', async () => {
        prismaMock.rolePermission.findMany.mockResolvedValue([
          { id: 1, role_name: 'admin', functionality_id: 1, enabled: true },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/rbac/permissions?role_name=admin')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('DELETE /api/rbac/permissions/:id', () => {
      it('should revoke a permission', async () => {
        prismaMock.rolePermission.findUnique.mockResolvedValue({ id: 1, role_name: 'admin', functionality_id: 1 });
        prismaMock.rolePermission.delete.mockResolvedValue({ id: 1 });

        const res = await request(app.getHttpServer())
          .delete('/api/rbac/permissions/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('message');
      });
    });
  });
});

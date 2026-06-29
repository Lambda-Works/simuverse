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

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  beforeAll(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      course: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      simulation: {
        count: jest.fn(),
      },
      scenario: {
        count: jest.fn(),
      },
      assessment: {
        count: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      systemFunctionality: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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
      return Promise.resolve(null);
    });
  });

  // ─── Teacher Permissions ────────────────────────────────────────────────

  describe('Teacher Permissions', () => {
    describe('GET /api/admin/teacher-permissions', () => {
      it('should return 401 without auth', async () => {
        await request(app.getHttpServer())
          .get('/api/admin/teacher-permissions')
          .expect(401);
      });

      it('should return default permissions', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/admin/teacher-permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('can_see_ai_config', false);
        expect(res.body).toHaveProperty('can_see_system_prompt', false);
      });
    });

    describe('PUT /api/admin/teacher-permissions', () => {
      it('should update permissions', async () => {
        const res = await request(app.getHttpServer())
          .put('/api/admin/teacher-permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ can_see_ai_config: true })
          .expect(200);

        expect(res.body).toHaveProperty('can_see_ai_config', true);
      });
    });
  });

  // ─── System Stats ──────────────────────────────────────────────────────

  describe('System Stats', () => {
    describe('GET /api/admin/stats', () => {
      it('should return system statistics', async () => {
        prismaMock.user.count.mockResolvedValue(10);
        prismaMock.course.count.mockResolvedValue(5);
        prismaMock.simulation.count
          .mockResolvedValueOnce(20)
          .mockResolvedValueOnce(3);
        prismaMock.scenario.count.mockResolvedValue(15);
        prismaMock.assessment.count.mockResolvedValue(8);
        prismaMock.user.groupBy.mockResolvedValue([
          { role: 'student', _count: { id: 8 } },
          { role: 'teacher', _count: { id: 2 } },
        ]);
        prismaMock.course.groupBy.mockResolvedValue([
          { category: 'admin', _count: { id: 3 } },
          { category: 'rrhh', _count: { id: 2 } },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('total_users', 10);
        expect(res.body).toHaveProperty('total_courses', 5);
        expect(res.body).toHaveProperty('total_simulations', 20);
        expect(res.body).toHaveProperty('active_simulations', 3);
        expect(Array.isArray(res.body.users_by_role)).toBe(true);
        expect(Array.isArray(res.body.courses_by_category)).toBe(true);
      });
    });
  });

  // ─── Roles ─────────────────────────────────────────────────────────────

  describe('Roles', () => {
    describe('GET /api/admin/roles', () => {
      it('should return all roles', async () => {
        prismaMock.role.findMany.mockResolvedValue([
          { id: 1, name: 'admin', description: 'Administrator', color: '#6366f1', is_active: true },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/admin/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('POST /api/admin/roles', () => {
      it('should create a role', async () => {
        prismaMock.role.create.mockResolvedValue({
          id: 1, name: 'editor', description: 'Content editor', color: '#10b981', is_active: true,
        });

        const res = await request(app.getHttpServer())
          .post('/api/admin/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'editor', description: 'Content editor', color: '#10b981' })
          .expect(201);

        expect(res.body).toHaveProperty('name', 'editor');
      });
    });

    describe('DELETE /api/admin/roles/:id', () => {
      it('should delete a role', async () => {
        prismaMock.role.delete.mockResolvedValue({});

        await request(app.getHttpServer())
          .delete('/api/admin/roles/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  // ─── Functionalities ───────────────────────────────────────────────────

  describe('Functionalities', () => {
    describe('GET /api/admin/functionalities', () => {
      it('should return all functionalities', async () => {
        prismaMock.systemFunctionality.findMany.mockResolvedValue([
          { id: 1, name: 'View Courses', module: 'courses', is_active: true },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/admin/functionalities')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('POST /api/admin/functionalities', () => {
      it('should create a functionality', async () => {
        prismaMock.systemFunctionality.create.mockResolvedValue({
          id: 1, name: 'Manage Users', module: 'users', is_active: true,
        });

        const res = await request(app.getHttpServer())
          .post('/api/admin/functionalities')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Manage Users', module: 'users' })
          .expect(201);

        expect(res.body).toHaveProperty('name', 'Manage Users');
      });
    });

    describe('DELETE /api/admin/functionalities/:id', () => {
      it('should delete a functionality', async () => {
        prismaMock.systemFunctionality.delete.mockResolvedValue({});

        await request(app.getHttpServer())
          .delete('/api/admin/functionalities/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  // ─── Role Permissions ───────────────────────────────────────────────────

  describe('Role Permissions', () => {
    describe('GET /api/admin/roles/:roleName/permissions', () => {
      it('should return permissions for a role', async () => {
        prismaMock.rolePermission = prismaMock.rolePermission || {};
        prismaMock.rolePermission.findMany = jest.fn().mockResolvedValue([
          { id: 1, role_name: 'teacher', functionality_id: 1, enabled: true, functionality: { id: 1, name: 'View Courses' } },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/admin/roles/teacher/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('POST /api/admin/roles/:roleName/permissions', () => {
      it('should upsert a role permission (ON CONFLICT)', async () => {
        prismaMock.rolePermission = prismaMock.rolePermission || {};
        prismaMock.rolePermission.upsert = jest.fn().mockResolvedValue({
          id: 1, role_name: 'teacher', functionality_id: 1, enabled: true,
        });

        const res = await request(app.getHttpServer())
          .post('/api/admin/roles/teacher/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ functionality_id: 1, enabled: true })
          .expect(201);

        expect(res.body).toHaveProperty('role_name', 'teacher');
        expect(res.body).toHaveProperty('enabled', true);
      });
    });

    describe('POST /api/admin/roles/:roleName/permissions/bulk', () => {
      it('should bulk upsert role permissions', async () => {
        prismaMock.rolePermission = prismaMock.rolePermission || {};
        prismaMock.rolePermission.upsert = jest.fn()
          .mockResolvedValueOnce({ id: 1, role_name: 'teacher', functionality_id: 1, enabled: true })
          .mockResolvedValueOnce({ id: 2, role_name: 'teacher', functionality_id: 2, enabled: false });

        const res = await request(app.getHttpServer())
          .post('/api/admin/roles/teacher/permissions/bulk')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permissions: [
              { functionality_id: 1, enabled: true },
              { functionality_id: 2, enabled: false },
            ],
          })
          .expect(201);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
      });
    });
  });
});

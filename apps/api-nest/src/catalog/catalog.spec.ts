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

describe('Catalog (e2e)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;
  let adminToken: string;

  beforeAll(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      techSheet: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      course: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      courseDocument: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      simulationAssignment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
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

  // ─── Categories ────────────────────────────────────────────────────────

  describe('Categories', () => {
    describe('GET /api/catalog/categories', () => {
      it('should return 401 without auth', async () => {
        await request(app.getHttpServer())
          .get('/api/catalog/categories')
          .expect(401);
      });

      it('should return all categories', async () => {
        prismaMock.category.findMany.mockResolvedValue([
          { id: 1, name: 'Administration', code: 'ADMIN', description: null, created_at: new Date(), updated_at: new Date() },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/catalog/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
      });
    });

    describe('POST /api/catalog/categories', () => {
      it('should create a category', async () => {
        prismaMock.category.findFirst.mockResolvedValue(null);
        prismaMock.category.create.mockResolvedValue({
          id: 1, name: 'IT', code: 'IT', description: 'Tech', created_at: new Date(), updated_at: new Date(),
        });

        const res = await request(app.getHttpServer())
          .post('/api/catalog/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'IT', code: 'IT', description: 'Tech' })
          .expect(201);

        expect(res.body).toHaveProperty('id', 1);
        expect(res.body).toHaveProperty('code', 'IT');
      });

      it('should return 409 for duplicate code', async () => {
        prismaMock.category.findFirst.mockResolvedValue({
          id: 1, name: 'IT', code: 'IT',
        });

        await request(app.getHttpServer())
          .post('/api/catalog/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'IT New', code: 'IT' })
          .expect(409);
      });
    });

    describe('PUT /api/catalog/categories/:id', () => {
      it('should update a category', async () => {
        prismaMock.category.findUnique.mockResolvedValue({
          id: 1, name: 'IT', code: 'IT',
        });
        prismaMock.category.findFirst.mockResolvedValue(null);
        prismaMock.category.update.mockResolvedValue({
          id: 1, name: 'IT Updated', code: 'IT', description: null, created_at: new Date(), updated_at: new Date(),
        });

        const res = await request(app.getHttpServer())
          .put('/api/catalog/categories/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'IT Updated' })
          .expect(200);

        expect(res.body).toHaveProperty('name', 'IT Updated');
      });

      it('should return 404 for non-existent category', async () => {
        prismaMock.category.findUnique.mockResolvedValue(null);

        await request(app.getHttpServer())
          .put('/api/catalog/categories/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'X' })
          .expect(404);
      });
    });

    describe('DELETE /api/catalog/categories/:id', () => {
      it('should delete a category', async () => {
        prismaMock.category.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.category.delete.mockResolvedValue({});

        await request(app.getHttpServer())
          .delete('/api/catalog/categories/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  // ─── Tech Sheets ───────────────────────────────────────────────────────

  describe('Tech Sheets', () => {
    describe('GET /api/catalog/tech-sheets', () => {
      it('should return all tech sheets', async () => {
        prismaMock.techSheet.findMany.mockResolvedValue([
          { id: 1, name: 'Sheet 1', course_id: 'c1', processed: false, created_at: new Date() },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/catalog/tech-sheets')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('POST /api/catalog/tech-sheets', () => {
      it('should create a tech sheet', async () => {
        prismaMock.course.findFirst.mockResolvedValue({ id: 'course-uuid' });
        prismaMock.techSheet.create.mockResolvedValue({
          id: 1, name: 'Sheet', course_id: 'course-uuid', processed: false, created_at: new Date(),
        });

        const res = await request(app.getHttpServer())
          .post('/api/catalog/tech-sheets')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Sheet', course_id: 'course-uuid' })
          .expect(201);

        expect(res.body).toHaveProperty('id', 1);
      });

      it('should return 400 if course not found', async () => {
        prismaMock.course.findFirst.mockResolvedValue(null);

        await request(app.getHttpServer())
          .post('/api/catalog/tech-sheets')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Sheet', course_id: 'nonexistent' })
          .expect(400);
      });
    });

    describe('POST /api/catalog/tech-sheets/:id/process', () => {
      it('should process a tech sheet', async () => {
        prismaMock.techSheet.findUnique.mockResolvedValue({
          id: 1, name: 'Sheet', course_id: 'c1', processed: false,
          competencies: null, kpi_requirements: null,
        });
        prismaMock.techSheet.update.mockResolvedValue({
          id: 1, processed: true, processed_at: new Date(),
        });

        const res = await request(app.getHttpServer())
          .post('/api/catalog/tech-sheets/1/process')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201);

        expect(res.body).toHaveProperty('processed', true);
      });
    });

    describe('POST /api/catalog/tech-sheets/:id/analyze', () => {
      it('should analyze a tech sheet', async () => {
        prismaMock.techSheet.findUnique.mockResolvedValue({
          id: 1, name: 'Sheet', course_id: 'c1', file_url: 'http://example.com/file.pdf',
          description: 'Test', competencies: [{ name: 'Comp1' }], kpi_requirements: [{ name: 'KPI1' }],
        });
        prismaMock.techSheet.update.mockResolvedValue({ id: 1, processed: true });

        const res = await request(app.getHttpServer())
          .post('/api/catalog/tech-sheets/1/analyze')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201);

        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('config');
      });

      it('should return 400 if no course assigned', async () => {
        prismaMock.techSheet.findUnique.mockResolvedValue({
          id: 1, name: 'Sheet', course_id: null, file_url: null, description: null,
        });

        await request(app.getHttpServer())
          .post('/api/catalog/tech-sheets/1/analyze')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);
      });
    });
  });

  // ─── Documents ─────────────────────────────────────────────────────────

  describe('Documents', () => {
    describe('GET /api/catalog/documents', () => {
      it('should return all documents', async () => {
        prismaMock.courseDocument.findMany.mockResolvedValue([
          { id: 1, course_id: 'c1', document_name: 'Doc', document_type: 'other', created_at: new Date() },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/catalog/documents')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should filter by course_id', async () => {
        prismaMock.courseDocument.findMany.mockResolvedValue([]);

        await request(app.getHttpServer())
          .get('/api/catalog/documents?course_id=c1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(prismaMock.courseDocument.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { course_id: 'c1' } }),
        );
      });
    });

    describe('POST /api/catalog/documents', () => {
      it('should create a document', async () => {
        prismaMock.courseDocument.create.mockResolvedValue({
          id: 1, course_id: 'c1', document_name: 'Doc', document_type: 'case', created_at: new Date(),
        });

        const res = await request(app.getHttpServer())
          .post('/api/catalog/documents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ course_id: 'c1', document_name: 'Doc', document_type: 'case' })
          .expect(201);

        expect(res.body).toHaveProperty('id', 1);
      });
    });

    describe('DELETE /api/catalog/documents/:id', () => {
      it('should delete a document', async () => {
        prismaMock.courseDocument.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.courseDocument.delete.mockResolvedValue({});

        await request(app.getHttpServer())
          .delete('/api/catalog/documents/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  // ─── Assignments ───────────────────────────────────────────────────────

  describe('Assignments', () => {
    describe('GET /api/catalog/assignments', () => {
      it('should return all assignments', async () => {
        prismaMock.simulationAssignment.findMany.mockResolvedValue([
          { id: 1, student_id: 's1', course_id: 'c1', status: 'pending', created_at: new Date() },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/catalog/assignments')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should filter by student_id', async () => {
        prismaMock.simulationAssignment.findMany.mockResolvedValue([]);

        await request(app.getHttpServer())
          .get('/api/catalog/assignments?student_id=s1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(prismaMock.simulationAssignment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { student_id: 's1' } }),
        );
      });
    });

    describe('POST /api/catalog/assignments', () => {
      it('should create an assignment', async () => {
        prismaMock.simulationAssignment.create.mockResolvedValue({
          id: 1, simulation_id: 'sim1', student_id: 's1', course_id: 'c1',
          assigned_by: 'admin', status: 'pending', attempts_used: 0, created_at: new Date(),
        });

        const res = await request(app.getHttpServer())
          .post('/api/catalog/assignments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            simulation_id: 'sim1', student_id: 's1', course_id: 'c1', assigned_by: 'admin',
          })
          .expect(201);

        expect(res.body).toHaveProperty('status', 'pending');
        expect(res.body).toHaveProperty('attempts_used', 0);
      });
    });

    describe('GET /api/catalog/assignments/student/:studentId', () => {
      it('should return assignments for a student', async () => {
        prismaMock.simulationAssignment.findMany.mockResolvedValue([
          { id: 1, student_id: 's1', course_id: 'c1', status: 'pending' },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/catalog/assignments/student/s1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('student_id', 's1');
      });
    });

    describe('GET /api/catalog/assignments/course/:courseId', () => {
      it('should return assignments for a course', async () => {
        prismaMock.simulationAssignment.findMany.mockResolvedValue([
          { id: 1, student_id: 's1', course_id: 'c1', status: 'pending' },
        ]);

        const res = await request(app.getHttpServer())
          .get('/api/catalog/assignments/course/c1')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });
    });
  });
});

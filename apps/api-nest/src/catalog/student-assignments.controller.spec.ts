import { Test, TestingModule } from '@nestjs/testing';
import { StudentAssignmentsController } from './student-assignments.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('StudentAssignmentsController — RBAC Phase A', () => {
  let controller: StudentAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentAssignmentsController],
      providers: [{ provide: PrismaService, useValue: {} }],
    }).compile();

    controller = module.get(StudentAssignmentsController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, StudentAssignmentsController);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', StudentAssignmentsController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

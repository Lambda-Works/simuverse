import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RbacService } from '../rbac/rbac.service';

describe('AssignmentsController — RBAC Phase A', () => {
  let controller: AssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        { provide: AssignmentsService, useValue: {} },
        { provide: RbacService, useValue: {} },
      ],
    }).compile();

    controller = module.get(AssignmentsController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, AssignmentsController);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AssignmentsController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

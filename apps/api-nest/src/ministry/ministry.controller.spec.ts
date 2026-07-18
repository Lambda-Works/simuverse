import { Test, TestingModule } from '@nestjs/testing';
import { MinistryController } from './ministry.controller';
import { MinistryService } from './ministry.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RbacService } from '../rbac/rbac.service';

describe('MinistryController — RBAC Phase A', () => {
  let controller: MinistryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MinistryController],
      providers: [
        { provide: MinistryService, useValue: {} },
        { provide: RbacService, useValue: {} },
      ],
    }).compile();

    controller = module.get(MinistryController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and ministerio', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, MinistryController);
      expect(roles).toEqual(['admin', 'ministerio']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MinistryController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

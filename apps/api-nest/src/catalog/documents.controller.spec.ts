import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RbacService } from '../rbac/rbac.service';

describe('DocumentsController — RBAC Phase A', () => {
  let controller: DocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: {} },
        { provide: RbacService, useValue: {} },
      ],
    }).compile();

    controller = module.get(DocumentsController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, DocumentsController);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', DocumentsController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RbacService } from '../rbac/rbac.service';

describe('FilesController — RBAC Phase A', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        { provide: FilesService, useValue: {} },
        { provide: RbacService, useValue: {} },
      ],
    }).compile();

    controller = module.get(FilesController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, FilesController);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', FilesController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

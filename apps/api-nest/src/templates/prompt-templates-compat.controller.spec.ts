import { Test, TestingModule } from '@nestjs/testing';
import { PromptTemplatesCompatController } from './prompt-templates-compat.controller';
import { PromptTemplatesService } from './prompt-templates.service';
import { PromptConfigService } from './prompt-config.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RbacService } from '../rbac/rbac.service';

describe('PromptTemplatesCompatController — RBAC Phase A', () => {
  let controller: PromptTemplatesCompatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromptTemplatesCompatController],
      providers: [
        { provide: PromptTemplatesService, useValue: {} },
        { provide: PromptConfigService, useValue: {} },
        { provide: RbacService, useValue: {} },
      ],
    }).compile();

    controller = module.get(PromptTemplatesCompatController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, PromptTemplatesCompatController);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', PromptTemplatesCompatController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

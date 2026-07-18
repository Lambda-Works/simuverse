import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from './templates.controller';
import { FlowTemplatesService } from './flow-templates.service';
import { PromptTemplatesService } from './prompt-templates.service';
import { PromptConfigService } from './prompt-config.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('TemplatesController — RBAC Phase A', () => {
  let controller: TemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        { provide: FlowTemplatesService, useValue: {} },
        { provide: PromptTemplatesService, useValue: {} },
        { provide: PromptConfigService, useValue: {} },
      ],
    }).compile();

    controller = module.get(TemplatesController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, TemplatesController);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', TemplatesController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

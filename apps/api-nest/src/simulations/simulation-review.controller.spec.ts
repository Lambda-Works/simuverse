import { Test, TestingModule } from '@nestjs/testing';
import { SimulationReviewController } from './simulation-review.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('SimulationReviewController — RBAC Phase A', () => {
  let controller: SimulationReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationReviewController],
      providers: [{ provide: PrismaService, useValue: {} }],
    }).compile();

    controller = module.get(SimulationReviewController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, SimulationReviewController);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', SimulationReviewController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

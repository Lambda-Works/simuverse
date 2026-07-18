import { Test, TestingModule } from '@nestjs/testing';
import { SimulatedCompaniesController } from './simulated-companies.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('SimulatedCompaniesController — RBAC Phase A', () => {
  let controller: SimulatedCompaniesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulatedCompaniesController],
      providers: [{ provide: PrismaService, useValue: {} }],
    }).compile();

    controller = module.get(SimulatedCompaniesController);
  });

  describe('class-level @Roles', () => {
    it('has roles admin and teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, SimulatedCompaniesController);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', SimulatedCompaniesController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

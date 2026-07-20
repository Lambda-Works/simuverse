import { Test, TestingModule } from '@nestjs/testing';
import { SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../common/decorators/permissions.decorator';
import { RbacService } from '../rbac/rbac.service';

describe('SponsorsController — RBAC', () => {
  let controller: SponsorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SponsorsController],
      providers: [
        { provide: SponsorsService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: RbacService, useValue: {} },
      ],
    }).compile();

    controller = module.get(SponsorsController);
  });

  it('has roles admin and teacher at the class level', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, SponsorsController);
    expect(roles).toEqual(['admin', 'teacher']);
  });

  it('requires the sponsors.manage permission at the class level', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, SponsorsController);
    expect(permissions).toEqual(['sponsors.manage']);
  });

  it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
    const guards = Reflect.getMetadata('__guards__', SponsorsController) || [];
    const guardNames = guards.map((g: any) => g.name || g);
    expect(guardNames).toContain('JwtAuthGuard');
    expect(guardNames).toContain('RolesGuard');
  });
});

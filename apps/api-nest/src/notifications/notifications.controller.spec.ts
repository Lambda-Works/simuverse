import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('NotificationsController — RBAC Phase A', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: {} }],
    }).compile();

    controller = module.get(NotificationsController);
  });

  describe('class-level @Roles', () => {
    it('has role admin only', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, NotificationsController);
      expect(roles).toEqual(['admin']);
    });
  });

  describe('guard metadata', () => {
    it('has UseGuards with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', NotificationsController) || [];
      const guardNames = guards.map((g: any) => g.name || g);
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });
  });
});

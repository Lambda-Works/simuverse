import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RbacService } from '../rbac/rbac.service';

describe('UsersController — RBAC Phase A (method-level)', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: {} },
        { provide: RbacService, useValue: {} },
      ],
    }).compile();

    controller = module.get(UsersController);
  });

  describe('GET /findAll @Roles', () => {
    it('has role admin on findAll', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.findAll);
      expect(roles).toEqual(['admin']);
    });
  });

  describe('POST /create @Roles', () => {
    it('has role admin on createUser', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.createUser);
      expect(roles).toEqual(['admin']);
    });
  });

  describe('DELETE @Roles', () => {
    it('has role admin on remove', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.remove);
      expect(roles).toEqual(['admin']);
    });
  });

  describe('PUT /:id/reactivate @Roles', () => {
    it('has role admin on reactivate', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.reactivate);
      expect(roles).toEqual(['admin']);
    });
  });

  describe('DELETE /:id/hard @Roles', () => {
    it('has role admin on hardDelete', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.hardDelete);
      expect(roles).toEqual(['admin']);
    });
  });

  describe('GET /:id @Roles', () => {
    it('does NOT have @Roles on findOne (student self-check preserved)', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.findOne);
      expect(roles).toBeUndefined();
    });
  });

  describe('PUT /:id @Roles', () => {
    it('does NOT have @Roles on update (student self-check preserved)', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.update);
      expect(roles).toBeUndefined();
    });
  });
});

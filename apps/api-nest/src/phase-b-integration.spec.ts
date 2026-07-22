import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { PERMISSIONS_KEY } from './common/decorators/permissions.decorator';
import { RbacService } from './rbac/rbac.service';

describe('Phase B — PermissionsGuard integration (5+ controllers)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let rbacService: jest.Mocked<RbacService>;

  beforeEach(() => {
    reflector = new Reflector();
    rbacService = {
      hasPermissions: jest.fn(),
    } as any;
    guard = new PermissionsGuard(reflector, rbacService);
  });

  function mockContext(
    requiredPermissions: string[] | undefined,
    userRole?: string,
    userName?: string,
  ): ExecutionContext {
    const handler = () => {};
    if (requiredPermissions) {
      Reflect.defineMetadata(PERMISSIONS_KEY, requiredPermissions, handler);
    }
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { id: userName || 'test-user', role: userRole } : undefined,
        }),
      }),
      getHandler: () => handler,
      getClass: () => class {},
    } as any;
  }

  describe('ScenariosController — scenarios.manage', () => {
    it('teacher with scenarios.manage → 200', async () => {
      rbacService.hasPermissions.mockResolvedValue(true);
      const ctx = mockContext(['scenarios.manage'], 'teacher');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('student without scenarios.manage → 403', async () => {
      rbacService.hasPermissions.mockResolvedValue(false);
      const ctx = mockContext(['scenarios.manage'], 'student');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CatalogController — catalog.manage', () => {
    it('admin bypass → always 200', async () => {
      const ctx = mockContext(['catalog.manage'], 'admin');
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(rbacService.hasPermissions).not.toHaveBeenCalled();
    });

    it('teacher without catalog.manage → 403', async () => {
      rbacService.hasPermissions.mockResolvedValue(false);
      const ctx = mockContext(['catalog.manage'], 'teacher');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('TemplatesController — templates.manage', () => {
    it('teacher with templates.manage → 200', async () => {
      rbacService.hasPermissions.mockResolvedValue(true);
      const ctx = mockContext(['templates.manage'], 'teacher');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('student without templates.manage → 403', async () => {
      rbacService.hasPermissions.mockResolvedValue(false);
      const ctx = mockContext(['templates.manage'], 'student');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('FilesController — files.read', () => {
    it('teacher with files.read → 200', async () => {
      rbacService.hasPermissions.mockResolvedValue(true);
      const ctx = mockContext(['files.read'], 'teacher');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('student without files.read → 403', async () => {
      rbacService.hasPermissions.mockResolvedValue(false);
      const ctx = mockContext(['files.read'], 'student');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('NotificationsController — notifications.manage', () => {
    it('admin bypass → 200', async () => {
      const ctx = mockContext(['notifications.manage'], 'admin');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('teacher without notifications.manage → 403', async () => {
      rbacService.hasPermissions.mockResolvedValue(false);
      const ctx = mockContext(['notifications.manage'], 'teacher');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('UsersController — users.manage', () => {
    it('admin bypass → 200', async () => {
      const ctx = mockContext(['users.manage'], 'admin');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('teacher without users.manage → 403', async () => {
      rbacService.hasPermissions.mockResolvedValue(false);
      const ctx = mockContext(['users.manage'], 'teacher');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CoursesController — courses.manage', () => {
    it('teacher with courses.manage → 200', async () => {
      rbacService.hasPermissions.mockResolvedValue(true);
      const ctx = mockContext(['courses.manage'], 'teacher');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('student without courses.manage → 403', async () => {
      rbacService.hasPermissions.mockResolvedValue(false);
      const ctx = mockContext(['courses.manage'], 'student');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('RbacController — rbac.manage', () => {
    it('admin bypass → 200', async () => {
      const ctx = mockContext(['rbac.manage'], 'admin');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('teacher without rbac.manage → 403', async () => {
      rbacService.hasPermissions.mockResolvedValue(false);
      const ctx = mockContext(['rbac.manage'], 'teacher');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });
});

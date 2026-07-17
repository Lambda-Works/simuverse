import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RbacService } from '../../rbac/rbac.service';

describe('PermissionsGuard', () => {
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

  function createMockContext(userRole?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { role: userRole } : undefined,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('should allow when no @Permissions() metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext('teacher');
    expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow when empty permissions array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const context = createMockContext('teacher');
    expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow admin regardless of permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['manage_courses']);
    const context = createMockContext('admin');
    expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow when user has all required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['manage_courses', 'manage_users']);
    rbacService.hasPermissions.mockResolvedValue(true);
    const context = createMockContext('teacher');
    expect(guard.canActivate(context)).resolves.toBe(true);
    expect(rbacService.hasPermissions).toHaveBeenCalledWith('teacher', ['manage_courses', 'manage_users']);
  });

  it('should deny when user lacks one permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['manage_courses', 'manage_users']);
    rbacService.hasPermissions.mockResolvedValue(false);
    const context = createMockContext('teacher');
    expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should deny when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['manage_courses']);
    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

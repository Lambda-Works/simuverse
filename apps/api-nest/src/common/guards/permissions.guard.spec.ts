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
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.manage']);
    const context = createMockContext('admin');
    expect(guard.canActivate(context)).resolves.toBe(true);
    // Admin bypass: hasPermissions should NOT be called
    expect(rbacService.hasPermissions).not.toHaveBeenCalled();
  });

  it('should allow when user has at least one required code', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['scenarios.manage', 'scenarios.read']);
    rbacService.hasPermissions.mockResolvedValue(true);
    const context = createMockContext('teacher');
    expect(guard.canActivate(context)).resolves.toBe(true);
    expect(rbacService.hasPermissions).toHaveBeenCalledWith('teacher', ['scenarios.manage', 'scenarios.read']);
  });

  it('should deny when user has no matching code (403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['catalog.manage']);
    rbacService.hasPermissions.mockResolvedValue(false);
    const context = createMockContext('student');
    expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should deny when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.manage']);
    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should pass codes from decorator to hasPermissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['files.read', 'files.upload']);
    rbacService.hasPermissions.mockResolvedValue(true);
    const context = createMockContext('teacher');
    guard.canActivate(context);
    expect(rbacService.hasPermissions).toHaveBeenCalledWith('teacher', ['files.read', 'files.upload']);
  });
});

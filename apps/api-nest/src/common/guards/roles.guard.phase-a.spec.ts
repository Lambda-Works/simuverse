import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard — Phase A behavioral tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function mockContext(requiredRoles?: string[], userRole?: string): ExecutionContext {
    const handler = () => {};
    Reflect.defineMetadata(ROLES_KEY, requiredRoles, handler);
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: userRole } }),
      }),
      getHandler: () => handler,
      getClass: () => class {},
    } as any;
  }

  it('allows access when no roles are required', () => {
    const ctx = mockContext(undefined, 'student');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows admin access to admin-only endpoints', () => {
    const ctx = mockContext(['admin'], 'admin');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows teacher access to admin+teacher endpoints', () => {
    const ctx = mockContext(['admin', 'teacher'], 'teacher');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('blocks student access to admin-only endpoints', () => {
    const ctx = mockContext(['admin'], 'student');
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('blocks student access to admin+teacher endpoints', () => {
    const ctx = mockContext(['admin', 'teacher'], 'student');
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows ministerio access to admin+ministerio endpoints', () => {
    const ctx = mockContext(['admin', 'ministerio'], 'ministerio');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('blocks teacher access to admin+ministerio endpoints', () => {
    const ctx = mockContext(['admin', 'ministerio'], 'teacher');
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('blocks access when user has no role', () => {
    const ctx = mockContext(['admin'], undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('class-level roles apply to all methods', () => {
    const classRoles = ['admin', 'teacher'];
    const handler = () => {};
    // No handler-level roles
    Reflect.defineMetadata(ROLES_KEY, undefined, handler);
    Reflect.defineMetadata(ROLES_KEY, classRoles, class {});
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'teacher' } }),
      }),
      getHandler: () => handler,
      getClass: () => class {},
    } as any;
    expect(guard.canActivate(ctx)).toBe(true);
  });
});

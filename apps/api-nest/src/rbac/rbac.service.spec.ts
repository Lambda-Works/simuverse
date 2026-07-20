import { RbacService } from './rbac.service';

describe('RbacService', () => {
  let service: RbacService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      rolePermission: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      systemFunctionality: {
        findFirst: jest.fn(),
      },
    };
    service = new RbacService(mockPrisma);
  });

  describe('hasPermission (code-based)', () => {
    it('should return true when code match exists and enabled', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });
      const result = await service.hasPermission('admin', 'users.manage');
      expect(result).toBe(true);
      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledWith({
        where: { code: 'users.manage' },
        select: { id: true },
      });
      expect(mockPrisma.rolePermission.findFirst).toHaveBeenCalledWith({
        where: {
          role_name: 'admin',
          functionality_id: 1,
          enabled: true,
        },
        select: { enabled: true },
      });
    });

    it('should return false when code does not exist', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue(null);
      const result = await service.hasPermission('teacher', 'nonexistent.code');
      expect(result).toBe(false);
    });

    it('should return false when code exists but role lacks permission', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 15 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue(null);
      const result = await service.hasPermission('student', 'catalog.manage');
      expect(result).toBe(false);
    });

    it('should return false when code exists but permission is disabled', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 15 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: false });
      const result = await service.hasPermission('student', 'catalog.manage');
      expect(result).toBe(false);
    });

    it('should work with different codes (backward compat pattern)', async () => {
      // Simulates: existing role_permissions rows still resolve with codes after migration
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 3 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });
      const result = await service.hasPermission('admin', 'courses.manage');
      expect(result).toBe(true);
      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledWith({
        where: { code: 'courses.manage' },
        select: { id: true },
      });
    });
  });

  describe('hasPermission cache', () => {
    it('should cache result and not call DB on second call', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });

      await service.hasPermission('admin', 'users.manage');
      await service.hasPermission('admin', 'users.manage');

      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache for specific role', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });

      await service.hasPermission('admin', 'users.manage');
      service.invalidatePermissionCache('admin');
      await service.hasPermission('admin', 'users.manage');

      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasPermissions', () => {
    it('should return true when ANY permission code matches', async () => {
      // Spec: "at least ONE of the specified codes enabled"
      mockPrisma.systemFunctionality.findFirst
        .mockResolvedValueOnce({ id: 6 })  // scenarios.manage
        .mockResolvedValueOnce({ id: null }); // scenarios.read doesn't exist
      mockPrisma.rolePermission.findFirst
        .mockResolvedValueOnce({ enabled: true });

      const result = await service.hasPermissions('teacher', ['scenarios.manage', 'scenarios.read']);
      expect(result).toBe(true);
    });

    it('should return false when NO permission codes match', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue(null);

      const result = await service.hasPermissions('student', ['nonexistent.a', 'nonexistent.b']);
      expect(result).toBe(false);
    });

    it('should return true when at least one code has enabled permission', async () => {
      mockPrisma.systemFunctionality.findFirst
        .mockResolvedValueOnce({ id: 7 })   // assignments.manage
        .mockResolvedValueOnce({ id: 7 });  // same
      mockPrisma.rolePermission.findFirst
        .mockResolvedValueOnce(null)          // not enabled
        .mockResolvedValueOnce({ enabled: true }); // enabled

      const result = await service.hasPermissions('teacher', ['assignments.manage', 'assignments.read']);
      expect(result).toBe(true);
    });
  });

  describe('assignPermission cache invalidation', () => {
    it('should invalidate cache after assign', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });
      mockPrisma.rolePermission.upsert.mockResolvedValue({});

      await service.hasPermission('admin', 'users.manage');
      await service.assignPermission({ role_name: 'admin', functionality_id: 1, enabled: true });
      await service.hasPermission('admin', 'users.manage');

      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('revokePermission cache invalidation', () => {
    it('should invalidate cache after revoke', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });
      mockPrisma.rolePermission.findUnique.mockResolvedValue({ id: 1, role_name: 'admin' });
      mockPrisma.rolePermission.delete.mockResolvedValue({});

      await service.hasPermission('admin', 'users.manage');
      await service.revokePermission(1);
      await service.hasPermission('admin', 'users.manage');

      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledTimes(2);
    });
  });
});

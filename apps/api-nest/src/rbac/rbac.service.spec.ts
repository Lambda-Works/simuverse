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

  describe('hasPermission', () => {
    it('should return true when permission exists and enabled', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });
      const result = await service.hasPermission('teacher', 'manage_courses');
      expect(result).toBe(true);
      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledWith({
        where: { name: 'manage_courses' },
        select: { id: true },
      });
      expect(mockPrisma.rolePermission.findFirst).toHaveBeenCalledWith({
        where: {
          role_name: 'teacher',
          functionality_id: 1,
          enabled: true,
        },
        select: { enabled: true },
      });
    });

    it('should return false when functionality does not exist', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue(null);
      const result = await service.hasPermission('student', 'nonexistent');
      expect(result).toBe(false);
    });

    it('should return false when permission does not exist', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue(null);
      const result = await service.hasPermission('student', 'manage_courses');
      expect(result).toBe(false);
    });

    it('should return false when permission exists but disabled', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: false });
      const result = await service.hasPermission('teacher', 'manage_courses');
      expect(result).toBe(false);
    });
  });

  describe('hasPermission cache', () => {
    it('should cache result and not call DB on second call', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });

      await service.hasPermission('teacher', 'manage_courses');
      await service.hasPermission('teacher', 'manage_courses');

      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache for specific role', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });

      await service.hasPermission('teacher', 'manage_courses');
      service.invalidatePermissionCache('teacher');
      await service.hasPermission('teacher', 'manage_courses');

      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasPermissions', () => {
    it('should return true when ALL permissions exist', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });
      const result = await service.hasPermissions('teacher', ['read', 'write']);
      expect(result).toBe(true);
    });

    it('should return false when ANY permission is missing', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst
        .mockResolvedValueOnce({ enabled: true })
        .mockResolvedValueOnce(null);
      const result = await service.hasPermissions('teacher', ['read', 'delete']);
      expect(result).toBe(false);
    });
  });

  describe('assignPermission cache invalidation', () => {
    it('should invalidate cache after assign', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });
      mockPrisma.rolePermission.upsert.mockResolvedValue({});

      await service.hasPermission('teacher', 'manage_courses');
      await service.assignPermission({ role_name: 'teacher', functionality_id: 1, enabled: true });
      await service.hasPermission('teacher', 'manage_courses');

      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('revokePermission cache invalidation', () => {
    it('should invalidate cache after revoke', async () => {
      mockPrisma.systemFunctionality.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ enabled: true });
      mockPrisma.rolePermission.findUnique.mockResolvedValue({ id: 1, role_name: 'teacher' });
      mockPrisma.rolePermission.delete.mockResolvedValue({});

      await service.hasPermission('teacher', 'manage_courses');
      await service.revokePermission(1);
      await service.hasPermission('teacher', 'manage_courses');

      expect(mockPrisma.systemFunctionality.findFirst).toHaveBeenCalledTimes(2);
    });
  });
});

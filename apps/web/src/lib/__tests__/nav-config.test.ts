import { ROLE_NAV, type AppRole } from '@/lib/nav-config';
import { describe, expect, it } from 'vitest';

describe('nav-config', () => {
  const ALL_ROLES: AppRole[] = ['student', 'teacher', 'admin', 'ministerio'];

  describe('ROLE_NAV has items for all roles', () => {
    for (const role of ALL_ROLES) {
      it(`${role} has at least 1 nav item`, () => {
        expect(ROLE_NAV[role]).toBeDefined();
        expect(ROLE_NAV[role].length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  describe('each nav item has required fields', () => {
    for (const role of ALL_ROLES) {
      it(`${role} items have label, href, and icon`, () => {
        for (const item of ROLE_NAV[role]) {
          expect(typeof item.label).toBe('string');
          expect(item.label.length).toBeGreaterThan(0);
          expect(typeof item.href).toBe('string');
          expect(item.href.startsWith('/')).toBe(true);
          expect(item.icon).toBeDefined();
        }
      });
    }
  });

  describe('student sees exactly 1 item', () => {
    it('has 1 item: Dashboard', () => {
      expect(ROLE_NAV.student).toHaveLength(1);
      expect(ROLE_NAV.student[0].href).toBe('/dashboard');
    });
  });

  describe('teacher sees 3 items', () => {
    it('has 3 items with correct hrefs', () => {
      expect(ROLE_NAV.teacher).toHaveLength(3);
      const hrefs = ROLE_NAV.teacher.map((i) => i.href);
      expect(hrefs).toContain('/dashboard');
      expect(hrefs).toContain('/evaluations');
      expect(hrefs).toContain('/legajos');
    });
  });

  describe('admin sees 4 items', () => {
    it('has 4 items including admin', () => {
      expect(ROLE_NAV.admin).toHaveLength(4);
      const hrefs = ROLE_NAV.admin.map((i) => i.href);
      expect(hrefs).toContain('/dashboard');
      expect(hrefs).toContain('/admin');
      expect(hrefs).toContain('/evaluations');
      expect(hrefs).toContain('/legajos');
    });
  });

  describe('ministerio sees 3 items', () => {
    it('has 3 items matching teacher', () => {
      expect(ROLE_NAV.ministerio).toHaveLength(3);
      const hrefs = ROLE_NAV.ministerio.map((i) => i.href);
      expect(hrefs).toContain('/dashboard');
      expect(hrefs).toContain('/evaluations');
      expect(hrefs).toContain('/legajos');
    });
  });
});

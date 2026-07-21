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
    it('has 1 item: Mis Cursos', () => {
      expect(ROLE_NAV.student).toHaveLength(1);
      expect(ROLE_NAV.student[0].href).toBe('/estudiante/cursos');
    });
  });

  describe('teacher sees cursos, sesiones, legajos', () => {
    it('has 3 items — no evaluaciones route', () => {
      expect(ROLE_NAV.teacher).toHaveLength(3);
      const hrefs = ROLE_NAV.teacher.map((i) => i.href);
      expect(hrefs).toContain('/profesor/cursos');
      expect(hrefs).toContain('/profesor/sesiones');
      expect(hrefs).toContain('/profesor/legajos');
      expect(hrefs).not.toContain('/profesor/evaluaciones');
    });
  });

  describe('admin sees cursos, sesiones, legajos', () => {
    it('has 3 items — no evaluaciones route', () => {
      expect(ROLE_NAV.admin).toHaveLength(3);
      const hrefs = ROLE_NAV.admin.map((i) => i.href);
      expect(hrefs).toContain('/admin/mis-cursos');
      expect(hrefs).toContain('/admin/sesiones');
      expect(hrefs).toContain('/admin/legajos');
      expect(hrefs).not.toContain('/admin/evaluaciones');
    });
  });

  describe('ministerio sees 2 items', () => {
    it('has 2 items — no evaluaciones route', () => {
      expect(ROLE_NAV.ministerio).toHaveLength(2);
      const hrefs = ROLE_NAV.ministerio.map((i) => i.href);
      expect(hrefs).toContain('/ministerio');
      expect(hrefs).toContain('/ministerio/legajos');
      expect(hrefs).not.toContain('/ministerio/evaluaciones');
    });
  });
});

import { ADMIN_NAV_GROUPS } from '@/lib/admin-nav';
import { describe, expect, it } from 'vitest';

describe('admin-nav', () => {
  describe('group structure', () => {
    it('has exactly 6 groups', () => {
      expect(ADMIN_NAV_GROUPS).toHaveLength(6);
    });

    it('each group has id, label, icon, and items array', () => {
      for (const group of ADMIN_NAV_GROUPS) {
        expect(typeof group.id).toBe('string');
        expect(group.id.length).toBeGreaterThan(0);
        expect(typeof group.label).toBe('string');
        expect(group.label.length).toBeGreaterThan(0);
        expect(group.icon).toBeDefined();
        expect(Array.isArray(group.items)).toBe(true);
        expect(group.items.length).toBeGreaterThan(0);
      }
    });

    it('all group ids are unique', () => {
      const ids = ADMIN_NAV_GROUPS.map((g) => g.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('total item count', () => {
    it('has exactly 20 admin sub-tab items across all groups', () => {
      const totalItems = ADMIN_NAV_GROUPS.reduce((sum, g) => sum + g.items.length, 0);
      expect(totalItems).toBe(20);
    });
  });

  describe('individual items', () => {
    it('every item has id, label, and icon', () => {
      for (const group of ADMIN_NAV_GROUPS) {
        for (const item of group.items) {
          expect(typeof item.id).toBe('string');
          expect(item.id.length).toBeGreaterThan(0);
          expect(typeof item.label).toBe('string');
          expect(item.label.length).toBeGreaterThan(0);
          expect(item.icon).toBeDefined();
        }
      }
    });

    it('all item ids are unique across groups', () => {
      const allIds = ADMIN_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));
      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });

  describe('expected groups exist', () => {
    it('has Content & Config group with 6 items', () => {
      const group = ADMIN_NAV_GROUPS.find((g) => g.id === 'contenido');
      expect(group).toBeDefined();
      expect(group!.items).toHaveLength(6);
    });

    it('has AI & Simulation group with 2 items', () => {
      const group = ADMIN_NAV_GROUPS.find((g) => g.id === 'ia');
      expect(group).toBeDefined();
      expect(group!.items).toHaveLength(2);
    });

    it('has Users & Access group with 4 items', () => {
      const group = ADMIN_NAV_GROUPS.find((g) => g.id === 'usuarios');
      expect(group).toBeDefined();
      expect(group!.items).toHaveLength(4);
    });

    it('has Operations group with 2 items', () => {
      const group = ADMIN_NAV_GROUPS.find((g) => g.id === 'operaciones');
      expect(group).toBeDefined();
      expect(group!.items).toHaveLength(2);
    });

    it('has Analysis group with 2 items', () => {
      const group = ADMIN_NAV_GROUPS.find((g) => g.id === 'analisis');
      expect(group).toBeDefined();
      expect(group!.items).toHaveLength(2);
    });

    it('has Organization group with 4 items', () => {
      const group = ADMIN_NAV_GROUPS.find((g) => g.id === 'organizacion');
      expect(group).toBeDefined();
      expect(group!.items).toHaveLength(4);
    });
  });
});

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * RED phase: Tests describe the EXPECTED behavior AFTER migration to apiClient.
 * These tests should FAIL while components use raw fetch().
 * They should PASS after migration.
 */

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'admin' },
    hasRole: (role: string) => role === 'admin',
    loading: false,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/data/flowTemplates', () => ({
  getAllTemplates: () => [],
  FLOW_TEMPLATES: [],
}));

const FULL_TEMPLATE = {
  id: 'tpl-1',
  title: 'Api Template',
  course_code: 'API-001',
  family: 'ventas',
  course_id: 'C1',
  is_active: true,
  version: '1.0',
  description: 'API template',
  tools: [],
  tags: [],
  inbox: { initial_messages: [] },
  crisis_events: [],
  evaluation: { criteria: [], min_score_to_pass: 70 },
};

describe('TemplatesPanel — apiClient migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('loadTemplates', () => {
    it('calls apiClient.get with /templates/prompt?active=true', async () => {
      const { default: TemplatesPanel } = await import('@/views/TemplatesPanel');
      const { render, waitFor } = await import('@testing-library/react');

      mockGet.mockResolvedValueOnce({ data: [FULL_TEMPLATE] });

      render(<TemplatesPanel />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/templates/prompt?active=true');
      });
    });
  });

  describe('handleSyncToDB', () => {
    it('calls apiClient.post with /templates/flow/bulk-import', async () => {
      const { default: TemplatesPanel } = await import('@/views/TemplatesPanel');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      mockGet.mockResolvedValue({ data: [] });
      mockPost.mockResolvedValueOnce({ data: { created: 1, updated: 0 } });

      render(<TemplatesPanel />);

      const syncButton = screen.getAllByRole('button').find(
        btn => btn.getAttribute('title')?.includes('Sincronizar')
      );
      fireEvent.click(syncButton!);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          '/templates/flow/bulk-import',
          expect.objectContaining({ templates: expect.any(Array) })
        );
      });
    });
  });

  describe('handleDuplicateTemplate', () => {
    it('calls apiClient.post with /templates/flow/{id}/duplicate', async () => {
      const { default: TemplatesPanel } = await import('@/views/TemplatesPanel');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      mockGet.mockResolvedValueOnce({ data: [FULL_TEMPLATE] });
      mockPost.mockResolvedValueOnce({ data: { ...FULL_TEMPLATE, id: 'tpl-1-copy' } });

      render(<TemplatesPanel />);

      await waitFor(() => {
        expect(screen.getByText('Api Template')).toBeInTheDocument();
      });

      const duplicateButtons = screen.getAllByRole('button').filter(
        btn => btn.getAttribute('title') === 'Duplicar plantilla'
      );
      fireEvent.click(duplicateButtons[0]);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          '/templates/flow/tpl-1/duplicate',
          expect.objectContaining({ name: expect.stringContaining('Copia') })
        );
      });
    });
  });

  describe('handleDeleteTemplate', () => {
    it('calls apiClient.delete with /templates/flow/{id}', async () => {
      const { default: TemplatesPanel } = await import('@/views/TemplatesPanel');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      const deleteTemplate = {
        id: 'tpl-del-123',
        title: 'ToDeleteX',
        course_code: 'DEL-001',
        family: 'ventas',
        course_id: 'C1',
        is_active: true,
        version: '1.0',
        description: 'to delete',
        tools: [],
        tags: [],
        inbox: { initial_messages: [] },
        crisis_events: [],
        evaluation: { criteria: [], min_score_to_pass: 70 },
      };

      mockGet.mockResolvedValueOnce({ data: [deleteTemplate] });
      mockDelete.mockResolvedValueOnce({ data: {} });

      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

      render(<TemplatesPanel />);

      await waitFor(() => {
        expect(screen.getByText('ToDeleteX')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button').filter(
        btn => btn.getAttribute('title') === 'Eliminar plantilla'
      );
      expect(deleteButtons.length).toBe(1);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('/templates/flow/tpl-del-123');
      });
    });
  });
});

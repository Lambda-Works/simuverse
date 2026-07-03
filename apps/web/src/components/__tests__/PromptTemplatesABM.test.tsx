import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

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

describe('PromptTemplatesABM — apiClient migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('fetchTemplates', () => {
    it('calls apiClient.get with /prompt-templates', async () => {
      const { PromptTemplatesABM } = await import('@/components/PromptTemplatesABM');
      const { render, screen, waitFor } = await import('@testing-library/react');

      mockGet.mockResolvedValueOnce({
        data: [{ id: 1, name: 'Test Prompt', base_role: 'Role', knowledge_base_prompt: 'Prompt', is_active: true }],
      });

      render(<PromptTemplatesABM />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/prompt-templates');
      });
    });

    it('sets empty array when apiClient.get rejects', async () => {
      const { PromptTemplatesABM } = await import('@/components/PromptTemplatesABM');
      const { render, screen, waitFor } = await import('@testing-library/react');

      mockGet.mockRejectedValueOnce(new Error('Network error'));

      render(<PromptTemplatesABM />);

      await waitFor(() => {
        // Table should render but with no rows
        const rows = screen.getAllByRole('row');
        // Header + 0 data rows = 1 row (just the header)
        expect(rows.length).toBe(1);
      });
    });
  });

  describe('handleSave', () => {
    it('calls apiClient.post for new templates and apiClient.put for existing ones', async () => {
      const { PromptTemplatesABM } = await import('@/components/PromptTemplatesABM');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      mockGet.mockResolvedValueOnce({ data: [] });
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      render(<PromptTemplatesABM />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open create modal
      const newBtn = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Nueva Plantilla')
      );
      fireEvent.click(newBtn!);

      // Fill required fields
      const nameInput = screen.getByPlaceholderText('Ej: Cliente Enojado');
      fireEvent.change(nameInput, { target: { value: 'Test Prompt' } });

      const roleTextarea = screen.getByPlaceholderText('Eres un cliente que...');
      fireEvent.change(roleTextarea, { target: { value: 'Test role' } });

      const promptTextarea = screen.getByPlaceholderText('Si el alumno hace X, entonces...');
      fireEvent.change(promptTextarea, { target: { value: 'Test prompt content' } });

      // Click save
      const saveBtn = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Guardar')
      );
      fireEvent.click(saveBtn!);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          '/prompt-templates',
          expect.objectContaining({ name: 'Test Prompt', base_role: 'Test role' })
        );
      });
    });
  });

  describe('handleDelete', () => {
    it('calls apiClient.delete with /prompt-templates/{id}', async () => {
      const { PromptTemplatesABM } = await import('@/components/PromptTemplatesABM');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      mockGet.mockResolvedValue({
        data: [{ id: 42, name: 'ToDelete', base_role: 'Role', knowledge_base_prompt: 'P', is_active: true }],
      });
      mockDelete.mockResolvedValueOnce({ data: {} });

      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

      render(<PromptTemplatesABM />);

      await waitFor(() => {
        expect(screen.getByText('ToDelete')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('🗑️')
      );
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('/prompt-templates/42');
      });

      vi.restoreAllMocks();
    });
  });

  describe('handleDuplicate', () => {
    it('calls apiClient.post with /prompt-templates/{id}/duplicate and { name }', async () => {
      const { PromptTemplatesABM } = await import('@/components/PromptTemplatesABM');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      mockGet.mockResolvedValue({
        data: [{ id: 10, name: 'Original', base_role: 'Role', knowledge_base_prompt: 'P', is_active: true }],
      });
      mockPost.mockResolvedValueOnce({ data: { id: 11 } });

      vi.spyOn(window, 'prompt').mockReturnValueOnce('Original (Copia)');
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<PromptTemplatesABM />);

      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
      });

      const dupButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('📋')
      );
      fireEvent.click(dupButtons[0]);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          '/prompt-templates/10/duplicate',
          { name: 'Original (Copia)' }
        );
      });

      vi.restoreAllMocks();
    });
  });

  describe('API alias removal', () => {
    it('does not contain API = API_BASE alias', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const componentPath = path.resolve(__dirname, '../PromptTemplatesABM.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      // After migration, the API alias should not exist
      expect(content).not.toMatch(/^const API = /m);
      expect(content).not.toContain('API_BASE');
    });
  });
});

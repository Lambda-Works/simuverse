import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const MOCK_TEMPLATE = {
  id: 't1',
  title: 'Template 1',
  course_code: 'CODE-001',
  family: 'ventas',
  version: '1.0',
  template_data: JSON.stringify({ modules: ['chat_ia'] }),
  is_active: true,
  created_at: '2024-01-01',
  course_id: 'C1',
  description: 'Test desc',
};

describe('TemplatesABM — apiClient migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('loadTemplates', () => {
    it('calls apiClient.get with /templates/flow', async () => {
      const { TemplatesABM } = await import('@/components/TemplatesABM');
      const { render, waitFor } = await import('@testing-library/react');

      mockGet.mockResolvedValueOnce({ data: [MOCK_TEMPLATE] });

      render(<TemplatesABM />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/templates/flow');
      });
    });

    it('sets empty array when apiClient.get rejects', async () => {
      const { TemplatesABM } = await import('@/components/TemplatesABM');
      const { render, screen, waitFor } = await import('@testing-library/react');

      mockGet.mockRejectedValueOnce(new Error('Network error'));

      render(<TemplatesABM />);

      await waitFor(() => {
        expect(screen.getByText('No hay plantillas guardadas.')).toBeInTheDocument();
      });
    });
  });

  describe('handleSave', () => {
    it('calls apiClient.post for new templates', async () => {
      const { TemplatesABM } = await import('@/components/TemplatesABM');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      mockGet.mockResolvedValue({ data: [] });
      mockPost.mockResolvedValueOnce({ data: { id: 'new-tpl' } });

      render(<TemplatesABM />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Open manual create dialog
      const manualBtns = screen.getAllByRole('button');
      const manualBtn = manualBtns.find(btn => btn.textContent?.includes('Manual'));
      fireEvent.click(manualBtn!);

      // Fill required fields
      const codeInput = screen.getByPlaceholderText('COURSE-VENTAS-001');
      fireEvent.change(codeInput, { target: { value: 'TEST-001' } });

      const titleInput = screen.getByPlaceholderText('Simulador de Atención al Cliente e-commerce');
      fireEvent.change(titleInput, { target: { value: 'Test Template' } });

      // Click save
      const saveBtn = screen.getByText('Guardar Plantilla');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          '/templates/flow',
          expect.objectContaining({ course_id: 'TEST-001', title: 'Test Template' })
        );
      });
    });
  });

  describe('handleDelete', () => {
    it('calls apiClient.delete with /templates/flow/{id}', async () => {
      const { TemplatesABM } = await import('@/components/TemplatesABM');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      mockGet.mockResolvedValueOnce({ data: [MOCK_TEMPLATE] });
      mockDelete.mockResolvedValueOnce({ data: {} });
      mockGet.mockResolvedValueOnce({ data: [] });

      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

      render(<TemplatesABM />);

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      const deleteBtns = screen.getAllByRole('button').filter(
        btn => btn.className.includes('text-red-600')
      );
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('/templates/flow/t1');
      });

      vi.restoreAllMocks();
    });
  });

  describe('handleDuplicate', () => {
    it('calls apiClient.post with /templates/flow and duplicated data', async () => {
      const { TemplatesABM } = await import('@/components/TemplatesABM');
      const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

      mockGet.mockResolvedValueOnce({ data: [MOCK_TEMPLATE] });
      mockPost.mockResolvedValueOnce({ data: {} });
      mockGet.mockResolvedValueOnce({ data: [] });

      render(<TemplatesABM />);

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      const duplicateBtn = screen.getByTitle('Duplicar');
      fireEvent.click(duplicateBtn);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          '/templates/flow',
          expect.objectContaining({
            title: expect.stringContaining('Copia'),
            course_code: expect.stringContaining('COPIA'),
          })
        );
      });
    });
  });

  describe('authHeaders removal', () => {
    it('does not contain authHeaders function', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const componentPath = path.resolve(__dirname, '../TemplatesABM.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).not.toContain('const authHeaders');
      expect(content).not.toContain('authHeaders()');
    });
  });
});

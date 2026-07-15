import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockPut = vi.fn();

vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    get: mockGet,
    put: mockPut,
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/admin-context', () => ({
  useAdmin: () => ({ readOnly: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('PromptTemplatesABM — course prompts from tech sheets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((url: string) => {
      if (url === '/courses') {
        return Promise.resolve({
          data: [{ id: 'c1', title: 'Curso RRHH', course_id: 'RRHH_01' }],
        });
      }
      if (url === '/tech-sheets') {
        return Promise.resolve({
          data: [
            {
              id: 10,
              name: 'Ficha RRHH',
              course_id: 'c1',
              processed: true,
              pipeline_status: 'completed',
            },
          ],
        });
      }
      if (url === '/tech-sheets/10/config') {
        return Promise.resolve({
          data: {
            prompts: {
              system_prompt: 'Sos un mentor de RRHH.',
              coaching_prompt: 'Guiá con preguntas.',
            },
          },
        });
      }
      if (url === '/prompt-config/c1') {
        return Promise.resolve({
          data: {
            base_role: 'Analista junior',
            course_context: 'Empresa Acme',
            knowledge_base_prompt: 'Sé paciente',
          },
        });
      }
      return Promise.resolve({ data: null });
    });
    mockPut.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads courses with analyzed tech sheets', async () => {
    const { PromptTemplatesABM } = await import('@/components/PromptTemplatesABM');
    const { render, screen, waitFor } = await import('@testing-library/react');

    render(<PromptTemplatesABM />);

    await waitFor(() => {
      expect(screen.getByText('Curso RRHH')).toBeInTheDocument();
    });
    expect(mockGet).toHaveBeenCalledWith('/courses');
    expect(mockGet).toHaveBeenCalledWith('/tech-sheets');
    expect(mockGet).toHaveBeenCalledWith('/tech-sheets/10/config');
  });

  it('saves prompts via PUT /tech-sheets/:id/prompts', async () => {
    const { PromptTemplatesABM } = await import('@/components/PromptTemplatesABM');
    const { render, screen, waitFor, fireEvent } = await import('@testing-library/react');

    render(<PromptTemplatesABM />);

    await waitFor(() => {
      expect(screen.getByText('Curso RRHH')).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole('button').filter(
      (btn) => btn.className.includes('text-blue-600'),
    );
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        '/tech-sheets/10/prompts',
        expect.objectContaining({
          system_prompt: 'Sos un mentor de RRHH.',
          coaching_prompt: 'Guiá con preguntas.',
          base_role: 'Analista junior',
        }),
      );
    });
  });

  it('shows empty state when no analyzed sheets', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/courses') return Promise.resolve({ data: [] });
      if (url === '/tech-sheets') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: null });
    });

    const { PromptTemplatesABM } = await import('@/components/PromptTemplatesABM');
    const { render, screen, waitFor } = await import('@testing-library/react');

    render(<PromptTemplatesABM />);

    await waitFor(() => {
      expect(screen.getByText(/No hay cursos con ficha técnica analizada/i)).toBeInTheDocument();
    });
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TechSheetsABM } from './TechSheetsABM';

// Mock the api module
vi.mock('@/lib/api', () => ({
  API_BASE: 'http://localhost:5001/api',
  authFetch: vi.fn(),
}));

describe('TechSheetsABM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('uses two-step upload: calls /api/files/upload then /api/tech-sheets', async () => {
    const { authFetch } = await import('@/lib/api');
    const mockAuthFetch = vi.mocked(authFetch);

    // Mock GET /courses and GET /tech-sheets
    mockAuthFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })) // courses
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })) // tech-sheets
      // Step 1: file upload returns file_url
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: 'file-123', file_url: '/api/files/file-123/download' }),
          { status: 200 }
        )
      )
      // Step 2: tech-sheet creation
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1, name: 'Test Sheet' }), { status: 200 })
      );

    render(<TechSheetsABM />);

    // Wait for initial data fetch
    await waitFor(() => {
      expect(screen.getByText('Fichas Técnicas (Ministerio)')).toBeTruthy();
    });

    // Open form
    fireEvent.click(screen.getByText('Nueva Ficha'));

    // Fill in name
    const nameInput = screen.getByPlaceholderText(/Ficha Técnica/);
    fireEvent.change(nameInput, { target: { value: 'Test Sheet' } });

    // Select course (we need courses to be loaded first, but they're empty)
    // So let's mock courses
    mockAuthFetch.mockReset();
    mockAuthFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'c1', course_id: 'c1', title: 'Math' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: 'file-123', file_url: '/api/files/file-123/download' }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1, name: 'Test Sheet' }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })); // refresh

    // Re-render
    const { unmount } = render(<TechSheetsABM />);
    unmount();

    render(<TechSheetsABM />);

    await waitFor(() => {
      expect(screen.getByText('Math')).toBeTruthy();
    });

    // Open form
    fireEvent.click(screen.getByText('Nueva Ficha'));

    // Fill name
    fireEvent.change(screen.getByPlaceholderText(/Ficha Técnica/), {
      target: { value: 'Test Sheet' },
    });

    // Select course
    fireEvent.click(screen.getByText('— Selecciona un curso (OBLIGATORIO) —'));
    fireEvent.click(screen.getByText('Math'));

    // Create a mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Mock dataTransfer for file input
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    fireEvent.change(fileInput);

    // Submit form
    fireEvent.click(screen.getByText('Subir Ficha'));

    await waitFor(() => {
      // Verify two-step: first call to /files/upload (FormData), then /tech-sheets (JSON)
      const calls = mockAuthFetch.mock.calls;
      const uploadCall = calls.find((call: any) =>
        typeof call[0] === 'string' && call[0].includes('/files/upload')
      );
      const createCall = calls.find((call: any) =>
        typeof call[0] === 'string' && call[0].includes('/tech-sheets') && call[1]?.method === 'POST'
      );

      expect(uploadCall).toBeTruthy();
      expect(createCall).toBeTruthy();
    });
  });
});

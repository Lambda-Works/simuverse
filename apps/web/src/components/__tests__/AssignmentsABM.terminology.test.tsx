import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock apiClient — return courses + scenarios with EVALUACIÓN type
vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.startsWith('/assignments')) return Promise.resolve({ data: [] });
      if (url.startsWith('/courses')) return Promise.resolve({ data: [{ id: 'c1', title: 'Course 1', category: 'general' }] });
      if (url.startsWith('/scenarios')) return Promise.resolve({ data: [
        { id: 's1', course_id: 'c1', title: 'Scenario 1', scenario_type: 'evaluation', difficulty: 'hard', categories: ['general'] },
      ]});
      if (url.startsWith('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    }),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

// Mock lucide-react
vi.mock('lucide-react', () => {
  const icon = (name: string) => Object.assign(({ className }: any) => React.createElement('span', { 'data-testid': `icon-${name}`, className }), { displayName: name });
  return { Pencil: icon('Pencil'), Plus: icon('Plus'), Send: icon('Send'), Trash2: icon('Trash2') };
});

import { AssignmentsABM } from '@/components/AssignmentsABM';

describe('AssignmentsABM terminology', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "SIMULACIÓN" instead of "EVALUACIÓN" for evaluation scenarios', async () => {
    render(<AssignmentsABM />);
    // Wait for initial load
    await screen.findByText('Asignación de Simulaciones');

    // Open the form
    fireEvent.click(screen.getByText('Nueva Asignación'));

    // Select a course from dropdown
    const select = screen.getByDisplayValue('-- Selecciona un curso --') || screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'c1' } });

    // Wait for scenarios to render
    await waitFor(() => {
      expect(screen.getByText('Scenario 1')).toBeDefined();
    });

    // Should show SIMULACIÓN, not EVALUACIÓN
    expect(screen.getByText('🎯 SIMULACIÓN')).toBeDefined();
    expect(screen.queryByText('🎯 EVALUACIÓN')).toBeNull();
  });
});

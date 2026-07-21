import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', role: 'admin' }, loading: false, hasRole: () => true }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock apiClient — inline data in factory (vi.mock is hoisted)
vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'Ana', email: 'ana@test.com', role: 'student', created_at: '2024-01-01', total_simulations: 5, completed_simulations: 3, total_evaluations: 4, best_score: 90, avg_score: 82, last_activity: '2024-06-01' },
      ],
    }),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const icon = (name: string) => Object.assign(({ className }: any) => React.createElement('span', { 'data-testid': `icon-${name}`, className }), { displayName: name });
  return { AlertCircle: icon('AlertCircle'), BarChart3: icon('BarChart3'), CheckCircle2: icon('CheckCircle2'), ChevronRight: icon('ChevronRight'), Clock: icon('Clock'), FileText: icon('FileText'), GraduationCap: icon('GraduationCap'), Search: icon('Search'), XCircle: icon('XCircle') };
});

// Mock shadcn Select to avoid internal Radix rendering issues
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'select' }, children),
  SelectContent: ({ children }: any) => React.createElement('div', null, children),
  SelectItem: ({ children, ...props }: any) => React.createElement('div', null, children),
  SelectTrigger: ({ children, ...props }: any) => React.createElement('div', null, children),
  SelectValue: (props: any) => React.createElement('span', null, props.placeholder || ''),
}));

// Must import AFTER mocks
import LegajosPage from '@/views/LegajosPage';

describe('LegajosPage terminology', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes "Con evaluaciones" and "Con Simulaciones Completadas", keeps single "Con simulaciones"', async () => {
    render(<LegajosPage />);
    await screen.findByText('Ana');
    expect(screen.getByText('Con simulaciones')).toBeDefined();
    expect(screen.queryByText('Con evaluaciones')).toBeNull();
    expect(screen.queryByText('Con Simulaciones Completadas')).toBeNull();
  });

  it('renders "Sim." instead of "Eval." in stats row', async () => {
    render(<LegajosPage />);
    await screen.findByText('Ana');
    expect(screen.getByText('Sim.')).toBeDefined();
    expect(screen.queryByText('Eval.')).toBeNull();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', role: 'admin' }, loading: false, hasRole: () => true }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ userId: 'user-1' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock sidebar-header-context
vi.mock('@/lib/sidebar-header-context', () => ({
  useSidebarHeader: () => ({ setBackTo: vi.fn() }),
}));

// Mock apiClient — inline data in factory (vi.mock is hoisted)
vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        student: { id: 'user-1', name: 'Test Student', email: 'test@test.com', role: 'student', created_at: '2024-01-01' },
        stats: { total_simulations: 2, total_evaluations: 1, passed_evaluations: 1, avg_score: 80, approval_rate: 50, best_score: 90 },
        simulations: [
          { simulation_id: 'sim-1', status: 'completed', started_at: '2024-06-01', completed_at: '2024-06-01', course_id: 'c1', course_title: 'Course 1', course_category: 'general', assessment_id: null, score: null, passed: null, criteria_met: null, assessment_comments: null, evaluated_at: null, evaluator_name: null, total_logs: 10, messages_sent: 5 },
        ],
      },
    }),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => {
  const icon = (name: string) => Object.assign(({ className }: any) => React.createElement('span', { 'data-testid': `icon-${name}`, className }), { displayName: name });
  const icons: Record<string, any> = {};
  for (const n of ['AlertTriangle','ArrowLeft','BarChart3','BookOpen','Brain','Calculator','CheckCircle','ChevronDown','ChevronUp','Clock','Info','Shield','Target','TrendingUp','Trophy','User','XCircle','Zap']) {
    icons[n] = icon(n);
  }
  return icons;
});

import StudentLedger from '@/views/StudentLedger';

describe('StudentLedger terminology', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT render "Evaluadas" stats entry', async () => {
    render(<StudentLedger />);
    await screen.findByText('Test Student');
    expect(screen.queryByText('Evaluadas')).toBeNull();
  });

  it('renders updated empty-simulation message when expanded', async () => {
    render(<StudentLedger />);
    await screen.findByText('Test Student');

    // Expand the simulation card by clicking on it
    fireEvent.click(screen.getByText('Course 1'));

    // Wait for expanded content to appear
    await waitFor(() => {
      expect(screen.getByText(/no tiene prácticas registradas por el usuario/)).toBeDefined();
    });
    expect(screen.queryByText(/no tiene evaluación registrada/)).toBeNull();
  });
});

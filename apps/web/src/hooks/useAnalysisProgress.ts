import { API_BASE, authFetch } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PipelineStatus =
  | 'idle'
  | 'running'
  | 'step_1'
  | 'step_2'
  | 'step_3'
  | 'step_4'
  | 'step_5'
  | 'step_6'
  | 'step_7'
  | 'completed'
  | 'failed'
  | 'validation_rejected'
  | null;

export interface PipelineOutput {
  step_1_markdown?: string;
  step_2_validation?: string;
  step_3_competencies?: string;
  step_4_kpis?: string;
  step_5_questions?: string;
  step_6_simulation_prompt?: string;
  step_7_coaching_prompt?: string;
  error_step?: number;
  error_message?: string;
}

interface UseAnalysisProgressResult {
  status: PipelineStatus;
  output: PipelineOutput | null;
  isLoading: boolean;
  error: string | null;
}

const TERMINAL_STATUSES: PipelineStatus[] = [
  'completed',
  'failed',
  'validation_rejected',
];

const POLL_INTERVAL_MS = 3000;

/**
 * Polls GET /api/tech-sheets/:id every 3 seconds to track pipeline progress.
 * Stops polling when status reaches a terminal state.
 */
export function useAnalysisProgress(
  techSheetId: number | null,
  enabled: boolean = false,
): UseAnalysisProgressResult {
  const [status, setStatus] = useState<PipelineStatus>(null);
  const [output, setOutput] = useState<PipelineOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (!techSheetId) return;

    try {
      const response = await authFetch(`${API_BASE}/tech-sheets/${techSheetId}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = body.message || body.error || `HTTP ${response.status}`;
        setError(msg);
        stopPolling();
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const newStatus: PipelineStatus = data.pipeline_status ?? null;
      const newOutput: PipelineOutput | null = data.pipeline_output ?? null;

      setStatus(newStatus);
      setOutput(newOutput);
      setError(null);

      if (newStatus && TERMINAL_STATUSES.includes(newStatus)) {
        stopPolling();
        setIsLoading(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
      stopPolling();
      setIsLoading(false);
    }
  }, [techSheetId, stopPolling]);

  useEffect(() => {
    if (!enabled || !techSheetId) {
      stopPolling();
      return;
    }

    setIsLoading(true);
    setError(null);

    // Initial poll immediately
    poll();

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [enabled, techSheetId, poll, stopPolling]);

  return { status, output, isLoading, error };
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnalysisProgress, PipelineStatus } from './useAnalysisProgress';

// Mock authFetch
vi.mock('@/lib/api', () => ({
  API_BASE: 'http://localhost:5001/api',
  authFetch: vi.fn(),
}));

import { authFetch } from '@/lib/api';
const mockAuthFetch = vi.mocked(authFetch);

function mockResponse(status: PipelineStatus, output: Record<string, unknown> | null = null) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        pipeline_status: status,
        pipeline_output: output,
      }),
  } as Response;
}

describe('useAnalysisProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockAuthFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not poll when disabled', () => {
    mockAuthFetch.mockResolvedValue(mockResponse('running'));

    renderHook(() => useAnalysisProgress(1, false));

    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  it('does not poll when techSheetId is null', () => {
    mockAuthFetch.mockResolvedValue(mockResponse('running'));

    renderHook(() => useAnalysisProgress(null, true));

    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  it('polls immediately and then every 3 seconds', async () => {
    mockAuthFetch.mockResolvedValue(mockResponse('step_1'));

    renderHook(() => useAnalysisProgress(1, true));

    // Immediate poll
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(1));
    expect(mockAuthFetch).toHaveBeenCalledWith('http://localhost:5001/api/tech-sheets/1');

    // After 3 seconds
    act(() => vi.advanceTimersByTime(3000));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));

    // After 6 seconds
    act(() => vi.advanceTimersByTime(3000));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(3));
  });

  it('stops polling when status is "completed"', async () => {
    mockAuthFetch.mockResolvedValue(mockResponse('completed'));

    renderHook(() => useAnalysisProgress(1, true));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(1));

    // Advance time — should NOT poll again
    act(() => vi.advanceTimersByTime(10000));
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
  });

  it('stops polling when status is "failed"', async () => {
    mockAuthFetch.mockResolvedValue(mockResponse('failed', { error_message: 'API timeout' }));

    const { result } = renderHook(() => useAnalysisProgress(1, true));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(1));
    expect(result.current.status).toBe('failed');

    act(() => vi.advanceTimersByTime(10000));
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
  });

  it('stops polling when status is "validation_rejected"', async () => {
    mockAuthFetch.mockResolvedValue(mockResponse('validation_rejected'));

    const { result } = renderHook(() => useAnalysisProgress(1, true));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(1));
    expect(result.current.status).toBe('validation_rejected');

    act(() => vi.advanceTimersByTime(10000));
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
  });

  it('continues polling through intermediate step statuses', async () => {
    const statuses: PipelineStatus[] = ['running', 'step_1', 'step_2', 'step_3'];
    let callCount = 0;

    mockAuthFetch.mockImplementation(() => {
      const status = statuses[Math.min(callCount, statuses.length - 1)];
      callCount++;
      return Promise.resolve(mockResponse(status));
    });

    const { result } = renderHook(() => useAnalysisProgress(1, true));

    // Each poll should update status
    await waitFor(() => expect(result.current.status).toBe('running'));

    act(() => vi.advanceTimersByTime(3000));
    await waitFor(() => expect(result.current.status).toBe('step_1'));

    act(() => vi.advanceTimersByTime(3000));
    await waitFor(() => expect(result.current.status).toBe('step_2'));

    act(() => vi.advanceTimersByTime(3000));
    await waitFor(() => expect(result.current.status).toBe('step_3'));

    // Still polling — 4 calls so far
    expect(mockAuthFetch).toHaveBeenCalledTimes(4);
  });

  it('returns pipeline_output data', async () => {
    const output = {
      step_1_markdown: '# Document',
      step_2_validation: 'Valid ministry document',
    };
    mockAuthFetch.mockResolvedValue(mockResponse('step_2', output));

    const { result } = renderHook(() => useAnalysisProgress(1, true));

    await waitFor(() => {
      expect(result.current.output).toEqual(output);
    });
  });

  it('sets error on network failure and stops polling', async () => {
    mockAuthFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAnalysisProgress(1, true));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
    expect(result.current.isLoading).toBe(false);

    // Should not retry
    act(() => vi.advanceTimersByTime(10000));
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
  });

  it('sets error on HTTP 500 and stops polling', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Internal server error' }),
    } as Response);

    const { result } = renderHook(() => useAnalysisProgress(1, true));

    await waitFor(() => {
      expect(result.current.error).toBe('Internal server error');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('cleans up interval on unmount', async () => {
    mockAuthFetch.mockResolvedValue(mockResponse('running'));

    const { unmount } = renderHook(() => useAnalysisProgress(1, true));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(1));

    unmount();

    // Advance time — should not trigger more calls
    act(() => vi.advanceTimersByTime(10000));
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
  });

  it('resets state when enabled toggles off then on', async () => {
    mockAuthFetch
      .mockResolvedValueOnce(mockResponse('running'))
      .mockResolvedValueOnce(mockResponse('completed'));

    const { result, rerender } = renderHook(
      ({ id, enabled }) => useAnalysisProgress(id, enabled),
      { initialProps: { id: 1, enabled: true } },
    );

    await waitFor(() => expect(result.current.status).toBe('running'));

    // Disable
    rerender({ id: 1, enabled: false });
    act(() => vi.advanceTimersByTime(5000));
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);

    // Re-enable
    rerender({ id: 1, enabled: true });
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));
  });
});

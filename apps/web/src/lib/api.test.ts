import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE, authFetch } from './api';

describe('authFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('omits Content-Type header when body is FormData', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', mockFetch);

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.pdf');

    await authFetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Record<string, string>;

    expect(headers).not.toHaveProperty('Content-Type');
  });

  it('sets Content-Type to application/json when body is not FormData', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', mockFetch);

    await authFetch(`${API_BASE}/tech-sheets`, {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    });

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Record<string, string>;

    expect(headers['Content-Type']).toBe('application/json');
  });

  it('includes Authorization header when token exists in localStorage', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', mockFetch);
    localStorage.setItem('token', 'test-jwt-token');

    await authFetch(`${API_BASE}/tech-sheets`);

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Record<string, string>;

    expect(headers['Authorization']).toBe('Bearer test-jwt-token');
  });

  it('does not set Authorization header when no token exists', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', mockFetch);

    await authFetch(`${API_BASE}/tech-sheets`);

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Record<string, string>;

    expect(headers).not.toHaveProperty('Authorization');
  });

  it('preserves existing headers passed in options', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', mockFetch);

    await authFetch(`${API_BASE}/tech-sheets`, {
      method: 'POST',
      headers: { 'X-Custom': 'value' },
    });

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Record<string, string>;

    expect(headers['X-Custom']).toBe('value');
  });
});

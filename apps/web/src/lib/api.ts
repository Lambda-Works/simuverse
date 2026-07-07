/**
 * API base URL — usa NEXT_PUBLIC_API_URL del .env.local, fallback a localhost:5001
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Fetch wrapper que automáticamente agrega el token JWT desde localStorage
 * Este es un reemplazo directo de fetch que incluye autenticación
 *
 * When body is FormData, Content-Type is NOT set — the browser sets
 * `multipart/form-data` with the correct boundary automatically.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
  };

  return fetch(url, { ...options, headers });
}

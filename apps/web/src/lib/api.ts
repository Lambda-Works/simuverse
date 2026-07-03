/**
 * API base URL — usa NEXT_PUBLIC_API_URL del .env.local, fallback a localhost:5001
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Fetch wrapper que automáticamente agrega el token JWT desde localStorage
 * Este es un reemplazo directo de fetch que incluye autenticación
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };

  return fetch(url, { ...options, headers });
}

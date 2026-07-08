'use client'

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { routeDemoRequest } from '@/services/demoData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** Helper – clear all auth data and redirect to /auth */
const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
  // Dispatch storage event so AuthProvider reacts in the same tab
  window.dispatchEvent(new Event('storage'));
  window.location.href = '/auth';
};

// ── Demo mode: auto-activa en Vercel o con NEXT_PUBLIC_DEMO_MODE=true ───
const DEMO_MODE = typeof window !== 'undefined' && (
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
  window.location.hostname.includes('vercel.app')
);

/** Wrap demo handler response so it looks like an Axios response */
function demoResponse(method: string, url: string, data?: unknown) {
  const result = routeDemoRequest(method, url, data);
  return Promise.resolve({
    data: result.data,
    status: result.status,
    statusText: result.statusText,
    headers: {},
    config: {} as any,
  });
}

class ApiClient {
  private client: AxiosInstance;

  /** Flag para evitar múltiples refreshes simultáneos */
  private isRefreshing = false;

  /** Cola de requests que fallaron con 401 mientras se estaba renovando el token */
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }> = [];

  private processQueue(error: unknown, token: string | null) {
    this.failedQueue.forEach((p) => {
      if (error) p.reject(error);
      else p.resolve(token!);
    });
    this.failedQueue = [];
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    // ── Request interceptor: inyectar JWT ──────────────────────────────────
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // ── Response interceptor: manejo de 401 con auto-refresh ──────────────
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Solo intentar refresh en 401 y si no es ya un retry
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          clearAuthAndRedirect();
          return Promise.reject(error);
        }

        // Si ya hay un refresh en progreso, encolar este request
        if (this.isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { token: newToken, refreshToken: newRefreshToken } = res.data;

          localStorage.setItem('token', newToken);
          if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

          // Notificar al AuthProvider que el token cambió
          window.dispatchEvent(new Event('storage'));

          this.processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.client(originalRequest);
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          clearAuthAndRedirect();
          return Promise.reject(refreshError);
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  get<T = any>(url: string, config?: any) {
    if (DEMO_MODE) return demoResponse('GET', url) as Promise<{ data: T }>;
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any) {
    if (DEMO_MODE) return demoResponse('POST', url, data) as Promise<{ data: T }>;
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: any) {
    if (DEMO_MODE) return demoResponse('PUT', url, data) as Promise<{ data: T }>;
    return this.client.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: any) {
    if (DEMO_MODE) return demoResponse('DELETE', url) as Promise<{ data: T }>;
    return this.client.delete<T>(url, config);
  }

  patch<T = any>(url: string, data?: any, config?: any) {
    if (DEMO_MODE) return demoResponse('PATCH', url, data) as Promise<{ data: T }>;
    return this.client.patch<T>(url, data, config);
  }
}

export const apiClient = new ApiClient();

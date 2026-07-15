'use client'

import { routeDemoRequest } from '@/services/demoData';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getFirebaseIdToken, isFirebaseConfigured, firebaseLogout } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** Helper – clear all auth data and redirect to /auth */
const clearAuthAndRedirect = async () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('pending_terms');
  try {
    await firebaseLogout();
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('storage'));
  window.location.href = '/auth';
};

const DEMO_MODE =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    window.location.hostname.includes('vercel.app'));

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
  private isRefreshing = false;
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
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(async (config) => {
      let token = sessionStorage.getItem('token');
      if (isFirebaseConfigured) {
        const fbToken = await getFirebaseIdToken(false);
        if (fbToken) {
          token = fbToken;
          sessionStorage.setItem('token', fbToken);
        }
      }
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

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
          let newToken: string | null = null;

          if (isFirebaseConfigured) {
            newToken = await getFirebaseIdToken(true);
          } else {
            const refreshToken = sessionStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            newToken = res.data.token;
            if (res.data.refreshToken) {
              sessionStorage.setItem('refreshToken', res.data.refreshToken);
            }
          }

          if (!newToken) throw new Error('Unable to refresh token');

          sessionStorage.setItem('token', newToken);
          window.dispatchEvent(new Event('storage'));
          this.processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.client(originalRequest);
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          await clearAuthAndRedirect();
          return Promise.reject(refreshError);
        } finally {
          this.isRefreshing = false;
        }
      },
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

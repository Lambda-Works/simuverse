'use client'

import { useEffect, useState } from 'react';

interface ServiceWorkerStatus {
  installed: boolean;
  active: boolean;
  updateAvailable: boolean;
  isOnline: boolean;
}

/**
 * Hook para registrar y manejar Service Worker
 * SSR-safe: navigator access is guarded with typeof checks
 */
export const useServiceWorker = () => {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    installed: false,
    active: false,
    updateAvailable: false,
    isOnline: false, // SSR-safe default; updated in useEffect on client
  });

  useEffect(() => {
    // Set isOnline from navigator (client-only)
    if (typeof navigator !== 'undefined') {
      setStatus((prev) => ({ ...prev, isOnline: navigator.onLine }));
    }

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker not supported');
      return;
    }

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered');
        setStatus((prev) => ({ ...prev, installed: true }));

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              setStatus((prev) => ({ ...prev, updateAvailable: true }));
              console.log('[PWA] New version available');
            }
          });
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      triggerSync();
      console.log('[PWA] Back online - syncing...');
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
      console.log('[PWA] Offline mode activated');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  /**
   * Trigger background sync
   */
  const triggerSync = async () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-actions');
        await (registration as any).sync.register('sync-logs');
        console.log('[PWA] Sync triggered');
      } catch (error) {
        console.error('[PWA] Sync failed:', error);
      }
    }
  };

  /**
   * Skip waiting - Force update
   */
  const skipWaiting = () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }
      });
    }
  };

  /**
   * Save data to IndexedDB
   */
  const saveToIndexedDB = (storeName: string, data: any) => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'SAVE_TO_INDEXEDDB',
        payload: { storeName, data },
      });
    }
  };

  /**
   * Cache URLs
   */
  const cacheUrls = (urls: string[]) => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CACHE_URLS',
        payload: { urls },
      });
    }
  };

  return {
    ...status,
    triggerSync,
    skipWaiting,
    saveToIndexedDB,
    cacheUrls,
  };
};

export default useServiceWorker;
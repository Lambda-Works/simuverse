import { useEffect, useState } from 'react';

interface ServiceWorkerStatus {
  installed: boolean;
  active: boolean;
  updateAvailable: boolean;
  isOnline: boolean;
}

/**
 * Hook para registrar y manejar Service Worker
 */
export const useServiceWorker = () => {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    installed: false,
    active: false,
    updateAvailable: false,
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Trigger background sync
   */
  const triggerSync = async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration.sync as any).register('sync-actions');
        await (registration.sync as any).register('sync-logs');
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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  /**
   * Save data to IndexedDB
   */
  const saveToIndexedDB = (storeName: string, data: any) => {
    if ('serviceWorker' in navigator) {
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
    if ('serviceWorker' in navigator) {
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

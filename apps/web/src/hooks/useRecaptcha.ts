'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        params: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void },
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
    ___onGrecaptchaLoad?: () => void;
    ___grecaptchaOnLoadQueue?: Array<() => void>;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

function ensureRecaptchaScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha?.render) return Promise.resolve();

  return new Promise((resolve) => {
    const queue = (window.___grecaptchaOnLoadQueue ||= []);
    queue.push(() => resolve());

    window.___onGrecaptchaLoad = () => {
      const pending = window.___grecaptchaOnLoadQueue || [];
      window.___grecaptchaOnLoadQueue = [];
      pending.forEach((cb) => cb());
    };

    if (!document.querySelector('script[data-recaptcha]')) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=___onGrecaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.recaptcha = '1';
      document.head.appendChild(script);
    } else if (window.grecaptcha?.render) {
      resolve();
    }
  });
}

export function useRecaptcha() {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const tryRender = useCallback(async () => {
    if (!SITE_KEY) {
      setReady(true);
      return;
    }
    if (!containerElRef.current || widgetIdRef.current !== null) return;

    await ensureRecaptchaScript();
    if (!containerElRef.current || !window.grecaptcha?.render || widgetIdRef.current !== null) return;

    // Avoid double-render if Google already injected a widget into this node
    if (containerElRef.current.childElementCount > 0) {
      setReady(true);
      return;
    }

    widgetIdRef.current = window.grecaptcha.render(containerElRef.current, {
      sitekey: SITE_KEY,
      callback: (t: string) => setToken(t),
      'expired-callback': () => setToken(null),
    });
    setReady(true);
  }, []);

  // Callback ref: Tabs unmount inactive panels, so we must render when the node appears
  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerElRef.current = node;
      if (node) {
        void tryRender();
      } else {
        // Panel unmounted (tab switch) — allow re-render on next mount
        widgetIdRef.current = null;
        setToken(null);
      }
    },
    [tryRender],
  );

  useEffect(() => {
    if (!SITE_KEY) {
      setReady(true);
      return;
    }
    void tryRender();
  }, [tryRender]);

  const reset = () => {
    setToken(null);
    if (widgetIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  };

  return {
    containerRef,
    token: SITE_KEY ? token : 'dev-bypass',
    ready,
    reset,
    enabled: !!SITE_KEY,
  };
}

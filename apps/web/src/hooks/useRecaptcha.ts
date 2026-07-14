'use client';

import { useEffect, useRef, useState } from 'react';

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
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export function useRecaptcha() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) {
      setReady(true);
      return;
    }

    const render = () => {
      if (!containerRef.current || !window.grecaptcha || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(null),
      });
      setReady(true);
    };

    if (window.grecaptcha) {
      render();
      return;
    }

    const existing = document.querySelector('script[data-recaptcha]');
    if (!existing) {
      window.___onGrecaptchaLoad = () => render();
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=___onGrecaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.recaptcha = '1';
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(interval);
          render();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

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

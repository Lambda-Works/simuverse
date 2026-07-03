'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearAuthPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear all auth data
    localStorage.clear();
    
    // Redirect to auth page after clearing
    setTimeout(() => {
      router.replace('/auth');
    }, 100);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Limpiando sesión...</p>
      </div>
    </div>
  );
}

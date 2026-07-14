'use client'

import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/useAuth'
import { InactivityProvider } from '@/hooks/useInactivityTimer'
import '@/lib/auth-fetch'; // Global fetch wrapper with JWT token
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <InactivityProvider>
            {children}
            <Sonner />
          </InactivityProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

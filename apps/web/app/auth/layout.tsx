import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ingresar',
  description: 'Iniciá sesión o registrate en SimuVerse con email, contraseña o Google.',
  openGraph: {
    title: 'Ingresar | SimuVerse',
    description: 'Acceso a la plataforma de simulaciones profesionalizantes.',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}

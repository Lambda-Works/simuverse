import type { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'SimuVerse — Motor de Simulación Modular',
    template: '%s | SimuVerse',
  },
  description:
    'Plataforma educativa de simulaciones profesionalizantes con IA para docentes y alumnos.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8080'),
  openGraph: {
    title: 'SimuVerse — Motor de Simulación Modular',
    description:
      'Simulaciones profesionalizantes con IA para formación técnica y práctica.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'SimuVerse',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={sourceSans.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

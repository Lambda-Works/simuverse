import type { Metadata } from 'next'
import TermsPublicPage from '@/views/TermsPublicPage'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones vigentes de SimuVerse.',
  openGraph: {
    title: 'Términos y Condiciones | SimuVerse',
    description: 'Consulta los términos vigentes de uso de la plataforma.',
  },
}

export default function TerminosPage() {
  return <TermsPublicPage />
}

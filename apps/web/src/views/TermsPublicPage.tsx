'use client'

import { apiClient } from '@/services/ApiClient'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TermsPublicPage() {
  const router = useRouter()
  const [terms, setTerms] = useState<{ title: string; version: string; content: string } | null>(null)

  useEffect(() => {
    apiClient
      .get('/auth/terms/current')
      .then((r) => setTerms(r.data))
      .catch(() => setTerms(null))
  }, [])

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <main className="min-h-screen bg-background">
      <article className="container mx-auto max-w-3xl px-4 py-12">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-3xl font-bold mb-2">
          {terms?.title || 'Términos y Condiciones'}
        </h1>
        {terms?.version && (
          <p className="text-sm text-muted-foreground mb-8">Versión {terms.version}</p>
        )}
        <div className="prose prose-neutral max-w-none whitespace-pre-wrap text-sm leading-relaxed">
          {terms?.content || 'No hay términos publicados todavía.'}
        </div>
      </article>
    </main>
  )
}

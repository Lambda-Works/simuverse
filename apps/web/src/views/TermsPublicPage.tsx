'use client'

import { apiClient } from '@/services/ApiClient'
import { useEffect, useState } from 'react'

export default function TermsPublicPage() {
  const [terms, setTerms] = useState<{ title: string; version: string; content: string } | null>(null)

  useEffect(() => {
    apiClient
      .get('/auth/terms/current')
      .then((r) => setTerms(r.data))
      .catch(() => setTerms(null))
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <article className="container mx-auto max-w-3xl px-4 py-12">
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

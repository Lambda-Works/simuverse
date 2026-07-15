'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MinisterioEvaluacionesPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/ministerio')
  }, [router])
  return null
}

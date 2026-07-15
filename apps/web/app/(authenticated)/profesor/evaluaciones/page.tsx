'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfesorEvaluacionesPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/profesor/cursos')
  }, [router])
  return null
}

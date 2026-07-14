'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminEvaluacionesPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/mis-cursos')
  }, [router])
  return null
}

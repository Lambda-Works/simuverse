'use client'
import { useParams } from 'next/navigation'
import SimulationPage from '@/src/pages/SimulationPage'
export default function SimulationRoute() {
  const params = useParams()
  return <SimulationPage courseId={params.courseId as string} />
}
'use client'
import SimulationPage from '@/views/SimulationPage'
import { useParams } from 'next/navigation'
export default function SimulationRoute() {
  const params = useParams()
  return <SimulationPage />
}
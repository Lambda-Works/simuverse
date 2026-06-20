'use client'
import { useParams } from 'next/navigation'
import CertificateView from '@/src/pages/CertificateView'
export default function CertificateRoute() {
  const params = useParams()
  return <CertificateView instanceId={params.instanceId as string} />
}
'use client'
import CertificateView from '@/views/CertificateView'
import { useParams } from 'next/navigation'
export default function CertificateRoute() {
  const params = useParams()
  return <CertificateView />
}
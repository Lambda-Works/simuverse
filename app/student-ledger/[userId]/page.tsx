'use client'
import { useParams } from 'next/navigation'
import StudentLedger from '@/views/StudentLedger'
export default function StudentLedgerRoute() {
  const params = useParams()
  return <StudentLedger userId={params.userId as string} />
}
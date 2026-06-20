'use client'
import { useParams } from 'next/navigation'
import StudentLedger from '@/src/pages/StudentLedger'
export default function StudentLedgerRoute() {
  const params = useParams()
  return <StudentLedger userId={params.userId as string} />
}
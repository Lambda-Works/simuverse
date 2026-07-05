'use client'
import { AdminProvider } from '@/lib/admin-context'
import AdminPanel from '@/views/AdminPanel'
export default function AdminPage() {
  return (
    <AdminProvider>
      <AdminPanel />
    </AdminProvider>
  )
}

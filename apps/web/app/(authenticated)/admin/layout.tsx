import { RoleGuard } from '@/components/RoleGuard';
import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'ministerio']}>{children}</RoleGuard>;
}

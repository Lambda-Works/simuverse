import { RoleGuard } from '@/components/RoleGuard';
import React from 'react';

export default function ProfesorLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['teacher']}>{children}</RoleGuard>;
}

import React from 'react';
import { RoleGuard } from '@/components/RoleGuard';

export default function ProfesorLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['teacher']}>{children}</RoleGuard>;
}

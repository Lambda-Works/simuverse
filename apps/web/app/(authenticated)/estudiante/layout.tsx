import { RoleGuard } from '@/components/RoleGuard';
import React from 'react';

export default function EstudianteLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['student']}>{children}</RoleGuard>;
}

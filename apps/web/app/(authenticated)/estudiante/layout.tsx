import React from 'react';
import { RoleGuard } from '@/components/RoleGuard';

export default function EstudianteLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['student']}>{children}</RoleGuard>;
}

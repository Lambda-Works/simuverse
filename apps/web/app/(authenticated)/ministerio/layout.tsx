import { RoleGuard } from '@/components/RoleGuard';
import React from 'react';

export default function MinisterioLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['ministerio']}>{children}</RoleGuard>;
}

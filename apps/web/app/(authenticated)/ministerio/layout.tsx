import React from 'react';
import { RoleGuard } from '@/components/RoleGuard';

export default function MinisterioLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['ministerio']}>{children}</RoleGuard>;
}

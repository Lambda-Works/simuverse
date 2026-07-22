'use client'

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export type AppRole = string;

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (user && !allowedRoles.includes(user.role as AppRole)) {
      // Si no tiene el rol permitido, enviarlo a la ruta que le corresponde a su rol
      switch (user.role) {
        case 'admin':
          router.replace('/admin/courses');
          break;
        case 'teacher':
        case 'supervisor':
          router.replace('/profesor/cursos');
          break;
        case 'student':
          router.replace('/estudiante/cursos');
          break;
        case 'ministerio':
          router.replace('/ministerio');
          break;
        default:
          // Rol desconocido — redirigir a una ruta por defecto en vez de logout
          router.replace('/profesor/cursos');
      }
    }
  }, [user, loading, isAuthenticated, allowedRoles, router]);

  if (loading || (!user && isAuthenticated)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado o no tiene permiso, no renderizar los hijos (evita pantallazos)
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role as AppRole))) {
    return null; 
  }

  return <>{children}</>;
}

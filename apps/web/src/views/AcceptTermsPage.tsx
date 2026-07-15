'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { authChangeEvent, useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/ApiClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AcceptTermsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [terms, setTerms] = useState<{ id: number; version: string; title: string; content: string } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem('pending_terms');
    if (pending) {
      try {
        setTerms(JSON.parse(pending));
        return;
      } catch {
        /* fall through */
      }
    }
    apiClient
      .get('/auth/terms/current')
      .then((r) => setTerms(r.data))
      .catch(() => setTerms(null));
  }, []);

  const handleAccept = async () => {
    if (!terms || !accepted) {
      toast.error('Debés aceptar los términos para continuar');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/accept-terms', { termsVersionId: terms.id });
      sessionStorage.removeItem('pending_terms');
      const profile = res.data;
      const nextUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        terms_accepted: true,
      };
      sessionStorage.setItem('user', JSON.stringify(nextUser));
      authChangeEvent.dispatchEvent(new Event('authChange'));
      toast.success('Términos aceptados');
      router.replace(
        profile.role === 'admin'
          ? '/admin/mis-cursos'
          : profile.role === 'teacher'
            ? '/profesor/cursos'
            : profile.role === 'ministerio'
              ? '/ministerio'
              : '/estudiante/cursos',
      );
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudieron aceptar los términos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Actualización de términos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hola {user?.name || ''}, hay una nueva versión de los términos y condiciones que debés aceptar para continuar.
          </p>
          {terms ? (
            <div className="max-h-64 overflow-y-auto rounded border p-3 text-sm whitespace-pre-wrap">
              <strong>
                {terms.title} (v{terms.version})
              </strong>
              {'\n\n'}
              {terms.content}
            </div>
          ) : (
            <p className="text-sm">No hay términos vigentes.</p>
          )}
          <div className="flex items-center gap-2">
            <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} />
            <label htmlFor="accept" className="text-sm cursor-pointer">
              He leído y acepto los términos
            </label>
          </div>
          <Button className="w-full" disabled={loading || !terms} onClick={handleAccept}>
            {loading ? 'Guardando...' : 'Continuar'}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

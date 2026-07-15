'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/ApiClient';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TermsVersion {
  id: number;
  version: string;
  title: string;
  content: string;
  is_current: boolean;
  published_at: string | null;
}

export function TermsABM() {
  const [items, setItems] = useState<TermsVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ version: '', title: '', content: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/terms');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar términos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async (publish: boolean) => {
    if (!form.version.trim() || !form.title.trim() || !form.content.trim()) {
      toast.error('Completá versión, título y contenido');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/terms/${editingId}`, { ...form, publish });
      } else {
        await apiClient.post('/terms', { ...form, publish });
      }
      toast.success(publish ? 'Términos publicados' : 'Borrador guardado');
      setForm({ version: '', title: '', content: '' });
      setEditingId(null);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await apiClient.post(`/terms/${id}/publish`);
      toast.success('Versión publicada');
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al publicar');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Términos y Condiciones</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Publicá nuevas versiones; los usuarios deberán aceptarlas para continuar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Editar versión' : 'Nueva versión'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Versión</Label>
              <Input
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="1.1"
              />
            </div>
            <div className="space-y-1">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Términos y Condiciones"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Contenido</Label>
            <Textarea
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Texto de los términos..."
            />
          </div>
          <div className="flex gap-2">
            <Button disabled={saving} onClick={() => handleSave(false)} variant="outline">
              Guardar borrador
            </Button>
            <Button disabled={saving} onClick={() => handleSave(true)}>
              Guardar y publicar
            </Button>
            {editingId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm({ version: '', title: '', content: '' });
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay versiones todavía.</p>
        ) : (
          items.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    v{t.version} — {t.title}{' '}
                    {t.is_current && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-2">
                        Vigente
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(t.id);
                      setForm({ version: t.version, title: t.title, content: t.content });
                    }}
                  >
                    Editar
                  </Button>
                  {!t.is_current && (
                    <Button size="sm" onClick={() => handlePublish(t.id)}>
                      Publicar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

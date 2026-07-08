'use client'
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Settings, Handshake, Link, Unlink } from 'lucide-react';

import { apiClient } from '@/services/ApiClient';
import { useAdmin } from '@/lib/admin-context';

interface Endorser {
  id: number;
  name: string;
  short_name: string;
  logo_url: string;
  description: string;
  endorsement_type: string;
  website: string;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
  category: string;
}

interface CourseEndorser {
  id: number;
  course_id: string;
  endorser_id: number;
  name: string;
  short_name: string;
  logo_url: string;
  endorsement_type: string;
}

const BRAND_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-orange-500', 'bg-rose-500', 'bg-teal-600', 'bg-indigo-500', 'bg-amber-600'];
const getColor = (name: string) => BRAND_COLORS[((name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0)) % BRAND_COLORS.length];
const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const ENDORSEMENT_TYPES = [
  { value: 'institution', label: '🏛️ Institución educativa' },
  { value: 'ministry', label: '📋 Ministerio / Ente gubernamental' },
  { value: 'company', label: '🏢 Empresa privada' },
  { value: 'professional_chamber', label: '⚖️ Colegio / Cámara profesional' },
  { value: 'ngo', label: '🤝 ONG / Asociación civil' },
];

const emptyForm = (): Omit<Endorser, 'id' | 'is_active'> => ({
  name: '', short_name: '', logo_url: '', description: '', endorsement_type: 'institution', website: '',
});

function LogoDisplay({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string; size?: 'sm' | 'md' }) {
  const [imgErr, setImgErr] = useState(false);
  const sizeMap = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm' };
  const cls = sizeMap[size];
  if (logoUrl && !imgErr) {
    return <img src={logoUrl} alt={name} className={`${cls} rounded-full object-cover border`} onError={() => setImgErr(true)} />;
  }
  return (
    <div className={`${cls} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${getColor(name)}`}>
      {getInitials(name)}
    </div>
  );
}

export function EndorsersABM() {
  const { readOnly } = useAdmin();
  const [endorsers, setEndorsers] = useState<Endorser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseEndorsers, setCourseEndorsers] = useState<CourseEndorser[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        apiClient.get('/endorsers').then(r => r.data),
        apiClient.get('/courses').then(r => r.data),
      ]);
      setEndorsers(Array.isArray(eRes) ? eRes : []);
      setCourses(Array.isArray(cRes) ? cRes : []);
    } catch { setEndorsers([]); setCourses([]); }
    setLoading(false);
  };

  const fetchCourseEndorsers = async (courseId: string) => {
    try {
      const r = await apiClient.get(`/course-endorsers/${courseId}`);
      const d = r.data;
      setCourseEndorsers(Array.isArray(d) ? d : []);
    } catch { setCourseEndorsers([]); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (selectedCourse) fetchCourseEndorsers(selectedCourse);
    else setCourseEndorsers([]);
  }, [selectedCourse]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/endorsers/${editingId}`, form);
      } else {
        await apiClient.post('/endorsers', form);
      }
      toast.success(editingId ? 'Avalador actualizado' : 'Avalador creado');
      setDialogOpen(false);
      setForm(emptyForm());
      setEditingId(null);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleEdit = (e: Endorser) => {
    setForm({ name: e.name, short_name: e.short_name || '', logo_url: e.logo_url || '', description: e.description || '', endorsement_type: e.endorsement_type || 'institution', website: e.website || '' });
    setEditingId(e.id);
    setDialogOpen(true);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('¿Desactivar este avalador?')) return;
    try {
      await apiClient.delete(`/endorsers/${id}`);
      toast.success('Avalador desactivado');
      fetchAll();
    } catch { toast.error('Error al desactivar'); }
  };

  const handleToggleLink = async (endorserId: number) => {
    if (!selectedCourse) return;
    setLinkLoading(true);
    const isLinked = courseEndorsers.some(ce => ce.endorser_id === endorserId);
    try {
      if (isLinked) {
        await apiClient.delete('/course-endorsers', { data: { course_id: selectedCourse, endorser_id: endorserId } });
        toast.success('Vínculo eliminado');
      } else {
        await apiClient.post('/course-endorsers', { course_id: selectedCourse, endorser_id: endorserId });
        toast.success('Avalador vinculado al curso');
      }
      fetchCourseEndorsers(selectedCourse);
    } catch { toast.error('Error al actualizar vínculo'); }
    setLinkLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-8">
      {/* Header + Add */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🤝 Avaladores</h2>
          <p className="text-gray-600 mt-1">Organizaciones o instituciones que avalan las simulaciones. Se pueden vincular a cursos específicos.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyForm()); setEditingId(null); } }}>
{!readOnly && <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Nuevo Avalador</Button>
            </DialogTrigger>}
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Avalador' : 'Nuevo Avalador'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                {form.logo_url
                  ? <img src={form.logo_url} alt="logo" className="w-14 h-14 rounded-full object-cover border" onError={() => {}} />
                  : <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${form.name ? getColor(form.name) : 'bg-gray-400'}`}>
                      {form.name ? getInitials(form.name) : '?'}
                    </div>
                }
                <div>
                  <p className="font-semibold">{form.name || 'Nombre del avalador'}</p>
                  <p className="text-xs text-gray-500">{ENDORSEMENT_TYPES.find(t => t.value === form.endorsement_type)?.label || ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nombre *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ministerio de Producción..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Sigla / Nombre corto</Label>
                  <Input value={form.short_name} onChange={e => setForm(p => ({ ...p, short_name: e.target.value }))} placeholder="MinProd" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de avalador</Label>
                  <Select value={form.endorsement_type} onValueChange={v => setForm(p => ({ ...p, endorsement_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENDORSEMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Sitio web</Label>
                  <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://ministerio.gob.ar" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>URL del Logo <span className="text-xs text-gray-400">(opcional)</span></Label>
                  <Input value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://... (logo público accesible)" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Descripción breve</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Organismo responsable de..." rows={2} />
                </div>
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Avalador'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de avaladores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {endorsers.map(e => (
          <Card key={e.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <LogoDisplay name={e.name} logoUrl={e.logo_url} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{e.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ENDORSEMENT_TYPES.find(t => t.value === e.endorsement_type)?.label || e.endorsement_type}</p>
                </div>
              </div>
              {e.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{e.description}</p>}
              {e.website && <a href={e.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mb-3 truncate">🌐 {e.website}</a>}
              <div className="flex justify-end gap-1">
                {!readOnly && <Button variant="outline" size="sm" onClick={() => handleEdit(e)}><Settings className="w-3 h-3" /></Button>}
                {!readOnly && <Button variant="ghost" size="sm" onClick={() => handleDeactivate(e.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {endorsers.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <Handshake className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No hay avaladores. Agregá el primero.</p>
        </div>
      )}

      {endorsers.length > 0 && (
        <>
          <Separator />
          {/* Vinculación a cursos */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold">🔗 Vincular avaladores a un curso</h3>
              <p className="text-sm text-gray-500 mt-1">Seleccioná un curso y marcá los avaladores que corresponden.</p>
            </div>

            <div className="max-w-sm">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un curso..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {courseEndorsers.length === 0 ? 'Este curso no tiene avaladores asignados aún.' : `${courseEndorsers.length} avalador${courseEndorsers.length > 1 ? 'es' : ''} vinculado${courseEndorsers.length > 1 ? 's' : ''}`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {endorsers.map(e => {
                    const isLinked = courseEndorsers.some(ce => ce.endorser_id === e.id);
                    return (
                      <div key={e.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isLinked ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'}`}
                        onClick={() => !linkLoading && handleToggleLink(e.id)}>
                        <LogoDisplay name={e.name} logoUrl={e.logo_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.name}</p>
                          <p className="text-xs text-gray-500">{e.short_name || ENDORSEMENT_TYPES.find(t => t.value === e.endorsement_type)?.label || ''}</p>
                        </div>
                        {isLinked
                          ? <span className="text-green-600 shrink-0"><Link className="w-4 h-4" /></span>
                          : <span className="text-gray-300 shrink-0"><Unlink className="w-4 h-4" /></span>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

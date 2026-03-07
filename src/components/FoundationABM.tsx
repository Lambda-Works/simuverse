import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Settings, GraduationCap } from 'lucide-react';

const API = 'http://localhost:5000/api';

interface FoundationConfig {
  id: number;
  name: string;
  short_name: string;
  logo_url: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  ministry_aval: string;
  is_active: boolean;
}

const BRAND_COLORS = ['bg-blue-600', 'bg-green-700', 'bg-purple-600', 'bg-teal-600', 'bg-indigo-600'];
const getColor = (name: string) => BRAND_COLORS[(name.charCodeAt(0) || 0) % BRAND_COLORS.length];
const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const emptyForm = (): Omit<FoundationConfig, 'id' | 'is_active'> => ({
  name: '',
  short_name: '',
  logo_url: '',
  address: '',
  city: 'Rosario',
  province: 'Santa Fe',
  country: 'Argentina',
  phone: '',
  email: '',
  website: '',
  ministry_aval: '',
});

export function FoundationABM() {
  const [foundations, setFoundations] = useState<FoundationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchFoundations = async () => {
    try {
      const r = await fetch(`${API}/foundation-config`);
      const d = await r.json();
      setFoundations(Array.isArray(d) ? d : []);
    } catch { setFoundations([]); }
    setLoading(false);
  };

  useEffect(() => { fetchFoundations(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const url = editingId ? `${API}/foundation-config/${editingId}` : `${API}/foundation-config`;
      const r = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Error al guardar'); }
      toast.success(editingId ? 'Institución actualizada' : 'Institución creada');
      setDialogOpen(false);
      setForm(emptyForm());
      setEditingId(null);
      fetchFoundations();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleEdit = (f: FoundationConfig) => {
    setForm({
      name: f.name, short_name: f.short_name || '', logo_url: f.logo_url || '',
      address: f.address || '', city: f.city || 'Rosario', province: f.province || 'Santa Fe',
      country: f.country || 'Argentina', phone: f.phone || '', email: f.email || '',
      website: f.website || '', ministry_aval: f.ministry_aval || '',
    });
    setEditingId(f.id);
    setDialogOpen(true);
  };

  const LogoDisplay = ({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string; size?: 'sm' | 'md' | 'lg' }) => {
    const [imgErr, setImgErr] = useState(false);
    const sizeMap = { sm: 'w-10 h-10 text-xs', md: 'w-14 h-14 text-sm', lg: 'w-20 h-20 text-2xl' };
    const cls = sizeMap[size];
    if (logoUrl && !imgErr) {
      return <img src={logoUrl} alt={name} className={`${cls} rounded-full object-cover border-2 border-white shadow`} onError={() => setImgErr(true)} />;
    }
    return (
      <div className={`${cls} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${getColor(name)} shadow`}>
        {getInitials(name)}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🎓 Fundación / Institución Educativa</h2>
          <p className="text-gray-600 mt-1">Datos de la institución que avala y emite los certificados. Su logo aparece en los certificados.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyForm()); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nueva Institución</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Institución' : 'Nueva Institución Educativa'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                {form.logo_url
                  ? <img src={form.logo_url} alt="logo" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" onError={() => {}} />
                  : <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ${form.name ? getColor(form.name) : 'bg-gray-400'} shadow`}>
                      {form.name ? getInitials(form.name) : '?'}
                    </div>
                }
                <div>
                  <p className="font-bold text-blue-900">{form.name || 'Nombre de la institución'}</p>
                  {form.short_name && <p className="text-sm text-blue-700">{form.short_name}</p>}
                  <p className="text-xs text-blue-600">{[form.city, form.province, form.country].filter(Boolean).join(', ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nombre completo *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="FUNDACIÓN EDUCATIVA PARA EL EMPLEO..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Sigla / Nombre corto</Label>
                  <Input value={form.short_name} onChange={e => setForm(p => ({ ...p, short_name: e.target.value }))} placeholder="FEPEI" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email institucional</Label>
                  <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@fundacion.org" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="3414827203" />
                </div>
                <div className="space-y-1.5">
                  <Label>Ciudad</Label>
                  <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Rosario" />
                </div>
                <div className="space-y-1.5">
                  <Label>Provincia</Label>
                  <Input value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))} placeholder="Santa Fe" />
                </div>
                <div className="space-y-1.5">
                  <Label>País</Label>
                  <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="Argentina" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Domicilio legal</Label>
                  <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="BVRD 27 DE FEBRERO 1718" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Sitio web</Label>
                  <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://fundacion.org.ar" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>URL del Logo <span className="text-xs text-gray-400">(opcional — aparece en certificados)</span></Label>
                  <Input value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://fundacion.org/logo.png" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Aval ministerial</Label>
                  <Textarea
                    value={form.ministry_aval}
                    onChange={e => setForm(p => ({ ...p, ministry_aval: e.target.value }))}
                    placeholder="Ministerio de Educación de la Provincia de Santa Fe — Dirección de Educación Técnica, Producción y Trabajo"
                    rows={2}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar Institución' : 'Crear Institución'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de instituciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {foundations.map(f => (
          <Card key={f.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center gap-4">
                <LogoDisplay name={f.name} logoUrl={f.logo_url} size="lg" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base leading-tight text-blue-900">{f.name}</CardTitle>
                  {f.short_name && <Badge className="mt-1 bg-blue-600 text-white text-xs">{f.short_name}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              {f.address && <p className="text-gray-600">📍 {f.address}, {f.city}, {f.province}</p>}
              {f.phone && <p className="text-gray-600">📞 {f.phone}</p>}
              {f.email && <p className="text-gray-600">✉️ {f.email}</p>}
              {f.website && <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block truncate">🌐 {f.website}</a>}
              {f.ministry_aval && (
                <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                  <p className="text-xs text-purple-700 font-medium">📋 Aval ministerial:</p>
                  <p className="text-xs text-purple-600 mt-0.5">{f.ministry_aval}</p>
                </div>
              )}
              <div className="flex justify-end mt-3">
                <Button variant="outline" size="sm" onClick={() => handleEdit(f)}>
                  <Settings className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {foundations.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No hay instituciones configuradas.</p>
          <p className="text-sm mt-1">La institución educativa aparece en los certificados emitidos.</p>
        </div>
      )}
    </div>
  );
}

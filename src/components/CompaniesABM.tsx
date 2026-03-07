import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Settings, Building2 } from 'lucide-react';

const API = 'http://localhost:5000/api';

interface SimulatedCompany {
  id: number;
  name: string;
  short_name: string;
  description: string;
  industry: string;
  logo_url: string;
  is_fictional: boolean;
  city: string;
  country: string;
  website: string;
}

const BRAND_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-orange-500',
  'bg-red-500', 'bg-teal-600', 'bg-indigo-500', 'bg-pink-500',
];

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const getBrandColor = (name: string) =>
  BRAND_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % BRAND_COLORS.length];

const emptyCompany = (): Omit<SimulatedCompany, 'id'> => ({
  name: '',
  short_name: '',
  description: '',
  industry: '',
  logo_url: '',
  is_fictional: false,
  city: 'Rosario',
  country: 'Argentina',
  website: '',
});

export function CompaniesABM() {
  const [companies, setCompanies] = useState<SimulatedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyCompany());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const fetchCompanies = async () => {
    try {
      const r = await fetch(`${API}/simulated-companies`);
      const d = await r.json();
      setCompanies(Array.isArray(d) ? d : []);
    } catch { setCompanies([]); }
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const url = editingId ? `${API}/simulated-companies/${editingId}` : `${API}/simulated-companies`;
      const r = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Error al guardar'); }
      toast.success(editingId ? 'Empresa actualizada' : 'Empresa creada');
      setDialogOpen(false);
      setForm(emptyCompany());
      setEditingId(null);
      fetchCompanies();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleEdit = (c: SimulatedCompany) => {
    setForm({
      name: c.name, short_name: c.short_name || '', description: c.description || '',
      industry: c.industry || '', logo_url: c.logo_url || '', is_fictional: !!c.is_fictional,
      city: c.city || '', country: c.country || 'Argentina', website: c.website || '',
    });
    setLogoError(false);
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta empresa? Se desvinculará de los cursos asociados.')) return;
    try {
      const r = await fetch(`${API}/simulated-companies/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Error al eliminar');
      toast.success('Empresa eliminada');
      fetchCompanies();
    } catch { toast.error('Error al eliminar'); }
  };

  const LogoDisplay = ({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string; size?: 'sm' | 'md' | 'lg' }) => {
    const [imgErr, setImgErr] = useState(false);
    const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-xl' };
    const cls = sizeMap[size];
    if (logoUrl && !imgErr) {
      return <img src={logoUrl} alt={name} className={`${cls} rounded-full object-cover border`} onError={() => setImgErr(true)} />;
    }
    return (
      <div className={`${cls} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${getBrandColor(name)}`}>
        {getInitials(name)}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando empresas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🏢 Empresas Simuladas</h2>
          <p className="text-gray-600 mt-1">Empresas reales o ficticias que se simulan en los cursos. Si no hay logo, se muestran las iniciales.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyCompany()); setEditingId(null); setLogoError(false); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nueva Empresa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Empresa' : 'Nueva Empresa Simulada'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Preview */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border">
                {form.logo_url && !logoError
                  ? <img src={form.logo_url} alt="preview" className="w-16 h-16 rounded-full object-cover border" onError={() => setLogoError(true)} />
                  : <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ${form.name ? getBrandColor(form.name) : 'bg-gray-400'}`}>
                      {form.name ? getInitials(form.name) : '?'}
                    </div>
                }
                <div>
                  <p className="font-semibold text-lg">{form.name || 'Nombre de la empresa'}</p>
                  <p className="text-sm text-gray-500">{form.industry || form.city || 'Industria / Ciudad'}</p>
                  {form.is_fictional && <Badge variant="outline" className="text-xs mt-1 border-orange-300 text-orange-700">Ficticia</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nombre * <span className="text-xs text-gray-400">(aparece en simulaciones y certificados)</span></Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="MercadoSolutions S.A." />
                </div>
                <div className="space-y-1.5">
                  <Label>Sigla / Nombre corto</Label>
                  <Input value={form.short_name} onChange={e => setForm(p => ({ ...p, short_name: e.target.value }))} placeholder="MSA" />
                </div>
                <div className="space-y-1.5">
                  <Label>Industria / Rubro</Label>
                  <Input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="E-commerce / Retail" />
                </div>
                <div className="space-y-1.5">
                  <Label>Ciudad</Label>
                  <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Rosario" />
                </div>
                <div className="space-y-1.5">
                  <Label>País</Label>
                  <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="Argentina" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Sitio web (opcional)</Label>
                  <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://empresa.com.ar" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>URL del Logo <span className="text-xs text-gray-400">(opcional — si no hay, se usan las iniciales)</span></Label>
                  <Input
                    value={form.logo_url}
                    onChange={e => { setLogoError(false); setForm(p => ({ ...p, logo_url: e.target.value })); }}
                    placeholder="https://empresa.com/logo.png"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Descripción breve</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Empresa líder en gestión de tiendas online en el Cono Sur..."
                    rows={2}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg bg-orange-50/50">
                  <div>
                    <Label className="text-orange-800">Empresa Ficticia</Label>
                    <p className="text-xs text-orange-600">Marca si la empresa fue inventada para la simulación</p>
                  </div>
                  <Switch checked={form.is_fictional} onCheckedChange={v => setForm(p => ({ ...p, is_fictional: v }))} />
                </div>
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar Empresa' : 'Crear Empresa'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(c => (
          <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <LogoDisplay name={c.name} logoUrl={c.logo_url} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.industry || '—'}{c.city ? ` · ${c.city}` : ''}</p>
                </div>
              </div>
              {c.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{c.description}</p>}
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mb-2 block truncate">{c.website}</a>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1 flex-wrap">
                  {c.is_fictional && <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">Ficticia</Badge>}
                  {c.short_name && <Badge variant="secondary" className="text-xs">{c.short_name}</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(c)}><Settings className="w-3.5 h-3.5" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No hay empresas configuradas.</p>
          <p className="text-sm mt-1">Creá la empresa que se simula en cada curso (puede ser ficticia o real).</p>
        </div>
      )}
    </div>
  );
}

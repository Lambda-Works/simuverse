import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, ArrowLeft, Trash2, Save, Settings, Users, Shield } from 'lucide-react';

const AVAILABLE_MODULES = [
  { id: 'chat_ia', label: 'Chat IA (Simulación Conversacional)' },
  { id: 'email_simulado', label: 'Email Simulado' },
  { id: 'documentos', label: 'Carpeta de Documentos' },
  { id: 'hoja_calculo', label: 'Hoja de Cálculo' },
  { id: 'crisis_engine', label: 'Motor de Crisis' },
  { id: 'evaluacion_auto', label: 'Evaluación Automática IA' },
];

const CATEGORIES = ['seguros', 'contable', 'rrhh', 'ventas', 'oratoria', 'legal', 'administracion', 'general'];

interface CourseForm {
  course_id: string;
  title: string;
  description: string;
  category: string;
  modules: string[];
  ai_config: {
    base_role: string;
    course_context: string;
    personality_traits: string[];
    knowledge_base_prompt: string;
  };
  eval_criteria: string[];
  crisis_events: Array<{ trigger_minutes: number; event_text: string; severity: string }>;
  is_active: boolean;
}

const emptyForm: CourseForm = {
  course_id: '',
  title: '',
  description: '',
  category: 'general',
  modules: ['chat_ia'],
  ai_config: {
    base_role: '',
    course_context: '',
    personality_traits: [],
    knowledge_base_prompt: '',
  },
  eval_criteria: [],
  crisis_events: [],
  is_active: true,
};

const AdminPanel = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CourseForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');
  const [newTrait, setNewTrait] = useState('');

  useEffect(() => {
    if (!loading && (!user || !hasRole('administrador'))) navigate('/dashboard');
  }, [user, loading, hasRole, navigate]);

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data);
  };

  useEffect(() => { if (user) fetchCourses(); }, [user]);

  const handleSave = async () => {
    if (!form.title || !form.course_id) {
      toast.error('Complete el ID y título del curso');
      return;
    }
    setSaving(true);
    const payload = {
      course_id: form.course_id,
      title: form.title,
      description: form.description,
      category: form.category,
      modules: form.modules as any,
      ai_config: form.ai_config as any,
      eval_criteria: form.eval_criteria as any,
      crisis_events: form.crisis_events as any,
      is_active: form.is_active,
      created_by: user!.id,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('courses').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('courses').insert(payload));
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingId ? 'Curso actualizado' : 'Curso creado');
      setDialogOpen(false);
      setForm({ ...emptyForm });
      setEditingId(null);
      fetchCourses();
    }
    setSaving(false);
  };

  const handleEdit = (course: any) => {
    setForm({
      course_id: course.course_id,
      title: course.title,
      description: course.description || '',
      category: course.category,
      modules: course.modules || [],
      ai_config: course.ai_config || emptyForm.ai_config,
      eval_criteria: course.eval_criteria || [],
      crisis_events: course.crisis_events || [],
      is_active: course.is_active,
    });
    setEditingId(course.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Curso eliminado'); fetchCourses(); }
  };

  const toggleModule = (mod: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.includes(mod) ? prev.modules.filter(m => m !== mod) : [...prev.modules, mod],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <span className="font-bold text-lg">Administración MSM</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm({ ...emptyForm }); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Nuevo Curso</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Curso' : 'Crear Nuevo Curso'}</DialogTitle>
                <DialogDescription>Configure los módulos, rol de IA y criterios de evaluación</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID del Curso</Label>
                    <Input value={form.course_id} onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))} placeholder="SEGUROS_01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Simulación de Seguros de Vida" />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="El alumno actuará como asesor de seguros..." />
                </div>

                {/* Modules */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Módulos (Lego)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_MODULES.map(mod => (
                      <label key={mod.id} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                        <Switch checked={form.modules.includes(mod.id)} onCheckedChange={() => toggleModule(mod.id)} />
                        <span className="text-sm">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* AI Config */}
                <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                  <Label className="text-base font-semibold">🤖 Configuración de IA</Label>
                  <div className="space-y-2">
                    <Label className="text-sm">Rol Base de la IA</Label>
                    <Input value={form.ai_config.base_role} onChange={e => setForm(p => ({ ...p, ai_config: { ...p.ai_config, base_role: e.target.value } }))} placeholder="Eres un cliente que busca un seguro de vida..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Contexto del Curso</Label>
                    <Textarea value={form.ai_config.course_context} onChange={e => setForm(p => ({ ...p, ai_config: { ...p.ai_config, course_context: e.target.value } }))} placeholder="Simulación en una oficina de seguros. El alumno es un asesor junior..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Base de Conocimiento (Prompt)</Label>
                    <Textarea value={form.ai_config.knowledge_base_prompt} onChange={e => setForm(p => ({ ...p, ai_config: { ...p.ai_config, knowledge_base_prompt: e.target.value } }))} placeholder="Información legal relevante, normativas, procedimientos..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Rasgos de Personalidad</Label>
                    <div className="flex gap-2">
                      <Input value={newTrait} onChange={e => setNewTrait(e.target.value)} placeholder="impaciente" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newTrait.trim()) { setForm(p => ({ ...p, ai_config: { ...p.ai_config, personality_traits: [...p.ai_config.personality_traits, newTrait.trim()] } })); setNewTrait(''); } } }} />
                      <Button type="button" variant="outline" size="sm" onClick={() => { if (newTrait.trim()) { setForm(p => ({ ...p, ai_config: { ...p.ai_config, personality_traits: [...p.ai_config.personality_traits, newTrait.trim()] } })); setNewTrait(''); } }}>+</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">{form.ai_config.personality_traits.map((t, i) => <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm(p => ({ ...p, ai_config: { ...p.ai_config, personality_traits: p.ai_config.personality_traits.filter((_, j) => j !== i) } }))}>{t} ×</Badge>)}</div>
                  </div>
                </div>

                {/* Eval criteria */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">📊 Criterios de Evaluación (KPIs)</Label>
                  <div className="flex gap-2">
                    <Input value={newCriterion} onChange={e => setNewCriterion(e.target.value)} placeholder="empatía, resolución, conocimiento técnico..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newCriterion.trim()) { setForm(p => ({ ...p, eval_criteria: [...p.eval_criteria, newCriterion.trim()] })); setNewCriterion(''); } } }} />
                    <Button type="button" variant="outline" size="sm" onClick={() => { if (newCriterion.trim()) { setForm(p => ({ ...p, eval_criteria: [...p.eval_criteria, newCriterion.trim()] })); setNewCriterion(''); } }}>+</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">{form.eval_criteria.map((c, i) => <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => setForm(p => ({ ...p, eval_criteria: p.eval_criteria.filter((_, j) => j !== i) }))}>{c} ×</Badge>)}</div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between">
                  <Label>Curso Activo</Label>
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                </div>

                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" /> {saving ? 'Guardando...' : editingId ? 'Actualizar Curso' : 'Crear Curso'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4">
          {courses.map(course => (
            <Card key={course.id} className="glass-card">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{course.title}</h3>
                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                    {course.is_active ? <span className="w-2 h-2 rounded-full bg-success" /> : <span className="w-2 h-2 rounded-full bg-muted-foreground" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{course.course_id} — {(course.modules as string[])?.join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(course.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {courses.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay cursos configurados. Cree el primero.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;

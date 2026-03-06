import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/ApiClient';
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
import { Plus, ArrowLeft, Trash2, Save, Settings, Users, Shield, FolderOpen, FileUp, UserCheck, BarChart3 } from 'lucide-react';
import { CategoriesABM } from '@/components/CategoriesABM';
import { DocumentsABM } from '@/components/DocumentsABM';
import { TechSheetsABM } from '@/components/TechSheetsABM';
import { AssignmentsABM } from '@/components/AssignmentsABM';
import { ReportsABM } from '@/components/ReportsABM';

const AVAILABLE_MODULES = [
  { id: 'chat_ia', label: 'Chat IA (Simulación Conversacional)' },
  { id: 'email_simulado', label: 'Email Simulado' },
  { id: 'documentos', label: 'Carpeta de Documentos' },
  { id: 'hoja_calculo', label: 'Hoja de Cálculo' },
  { id: 'crisis_engine', label: 'Motor de Crisis' },
  { id: 'evaluacion_auto', label: 'Evaluación Automática IA' },
];

const CATEGORIES = ['seguros', 'contable', 'rrhh', 'ventas', 'oratoria', 'legal', 'administracion', 'general'];

// ─── Plantillas de Prompts FEPEI (Lego de IA) ───────────────────────────────
const PROMPT_TEMPLATES = [
  {
    id: 'cliente_insatisfecho',
    label: '😠 Cliente insatisfecho (Atención al Cliente)',
    modules: ['chat_ia', 'email_simulado'],
    ai_config: {
      base_role: 'Eres un cliente enojado que tuvo un problema grave con el producto/servicio que compró. Estás frustrado y exigís una solución inmediata.',
      course_context: 'El alumno trabaja como asesor de atención al cliente. Debe gestionar el reclamo del cliente, mantener la calma y ofrecer una solución concreta.',
      personality_traits: ['impaciente', 'exigente', 'emocional'],
      knowledge_base_prompt: 'Si el alumno solo pide disculpas sin ofrecer una solución concreta, seguir insistiendo. Si el alumno explica el problema y ofrece una alternativa real, calmarse gradualmente.',
    },
  },
  {
    id: 'empleado_conflictivo',
    label: '👤 Empleado con conflicto (RRHH)',
    modules: ['chat_ia', 'email_simulado', 'documentos'],
    ai_config: {
      base_role: 'Eres un empleado con 15 años de antigüedad que se siente injustamente tratado. Estás en guardia, eres defensivo y emocional.',
      course_context: 'El alumno es responsable de RRHH y debe realizar una entrevista de retroalimentación con un empleado problemático. El desafío es que el empleado se sienta escuchado y llegar a un acuerdo.',
      personality_traits: ['defensivo', 'emocional', 'desconfiado', 'veterano'],
      knowledge_base_prompt: 'Si el alumno usa lenguaje acusatorio, ponerse más a la defensiva. Si el alumno escucha activamente y valida tus sentimientos, abrirse gradualmente. Mencionar años de servicio como argumento.',
    },
  },
  {
    id: 'auditor_afip',
    label: '📊 Auditor AFIP/ARCA (Contable/Impuestos)',
    modules: ['chat_ia', 'email_simulado', 'hoja_calculo', 'documentos'],
    ai_config: {
      base_role: 'Eres un Auditor Técnico de AFIP/ARCA, riguroso y formal. Detectaste inconsistencias en la declaración jurada del contribuyente y estás realizando una auditoría de control.',
      course_context: 'El alumno es el contador/asesor impositivo de la empresa. Debe responder a las observaciones del auditor con documentación correcta y argumentos técnicos.',
      personality_traits: ['riguroso', 'formal', 'metódico', 'no acepta evasivas'],
      knowledge_base_prompt: 'Solo aceptar respuestas que citen normativa específica (resoluciones AFIP, artículos del Código Tributario). Ignorar respuestas genéricas. Si el alumno cita correctamente la normativa, reconocer la validez.',
    },
  },
  {
    id: 'tech_lead',
    label: '💻 Tech Lead exigente (Tecnología/IT)',
    modules: ['chat_ia', 'email_simulado'],
    ai_config: {
      base_role: 'Eres un Tech Lead extremadamente eficiente que solo habla con datos y métricas. Sos escaso en palabras pero profundo en contenido. No tolerás respuestas imprecisas.',
      course_context: 'El alumno debe presentar un informe técnico o propuesta de solución IT al Tech Lead. Debe usar terminología precisa y justificar cada decisión con datos.',
      personality_traits: ['exigente', 'data-driven', 'conciso', 'impaciente con la impresión'],
      knowledge_base_prompt: 'Rechazar respuestas sin métricas concretas. Preguntar siempre "¿Cuál es el impacto en performance/costo/tiempo?". Si el alumno responde con datos sólidos, aprobar la propuesta.',
    },
  },
  {
    id: 'cliente_ecommerce',
    label: '🛒 Cliente e-commerce con reclamo (Tienda Online)',
    modules: ['chat_ia', 'email_simulado'],
    ai_config: {
      base_role: 'Eres un cliente exigente llamado Julián, que ha realizado una compra y tiene un problema con el proceso. Estás frustrado y aménazas con hacer un reclamo legal.',
      course_context: 'El alumno trabaja en soporte de una tienda online. Recibió un email de IT informando un problema técnico. Debe usar esa información para tranquilizar al cliente.',
      personality_traits: ['impaciente', 'amenazante', 'exigente', 'conoce sus derechos'],
      knowledge_base_prompt: 'Si el alumno solo pide disculpas, seguir insistiendo en el reclamo. Si el alumno explica el problema técnico y ofrece seguimiento manual, calmarse. Mencionar posible reclamo en Defensa del Consumidor si no hay solución.',
    },
  },
  {
    id: 'negociador_proveedor',
    label: '🤝 Negociación con Proveedor (Compras/Comercial)',
    modules: ['chat_ia', 'email_simulado', 'hoja_calculo'],
    ai_config: {
      base_role: 'Eres un representante de ventas de un proveedor estratégico. Tenés una posición dominante en el mercado y sos consciente de ello. Defendés tus precios con argumentos sólidos.',
      course_context: 'El alumno es el responsable de compras de una empresa. Debe negociar mejores condiciones (precio, plazo, volúmen) con el proveedor sin romper la relación comercial.',
      personality_traits: ['confiado', 'argumentativo', 'flexible ante buenas propuestas'],
      knowledge_base_prompt: 'Resistir descuentos menores al 5%. Ceder ante argumentos de volumen o exclusividad. Si el alumno negocia con datos de mercado, mostrar más apertura.',
    },
  },
];

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
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentTab, setCurrentTab] = useState<'courses' | 'categories' | 'documents' | 'techsheets' | 'assignments' | 'reports'>('courses');

  useEffect(() => {
    if (!loading && (!user || !hasRole('admin'))) navigate('/dashboard');
  }, [user, loading, hasRole, navigate]);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/courses');
      if (res.data) setCourses(res.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Error al cargar los cursos');
    }
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

    try {
      if (editingId) {
        await apiClient.put(`/courses/${editingId}`, payload);
      } else {
        await apiClient.post('/courses', payload);
      }
      toast.success(editingId ? 'Curso actualizado' : 'Curso creado');
      setDialogOpen(false);
      setForm({ ...emptyForm });
      setEditingId(null);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el curso');
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
    try {
      await apiClient.delete(`/courses/${id}`);
      toast.success('Curso eliminado');
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el curso');
    }
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
            <span className="font-bold text-lg">Administración SimuVerse 3.0</span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="border-t bg-muted/30 px-4">
          <div className="container mx-auto flex gap-1 overflow-x-auto">
            <Button
              variant={currentTab === 'courses' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('courses')}
              className="rounded-b-none"
            >
              <Settings className="w-4 h-4 mr-2" />
              Cursos
            </Button>
            <Button
              variant={currentTab === 'categories' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('categories')}
              className="rounded-b-none"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Categorías
            </Button>
            <Button
              variant={currentTab === 'documents' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('documents')}
              className="rounded-b-none"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Documentos
            </Button>
            <Button
              variant={currentTab === 'techsheets' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('techsheets')}
              className="rounded-b-none"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Fichas Técnicas
            </Button>
            <Button
              variant={currentTab === 'assignments' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('assignments')}
              className="rounded-b-none"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Asignaciones
            </Button>
            <Button
              variant={currentTab === 'reports' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('reports')}
              className="rounded-b-none"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Reportes
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Courses Tab */}
        {currentTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Gestión de Cursos</h2>
                <p className="text-gray-600 mt-1">Crea, edita y configura los cursos disponibles</p>
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

                    {/* Template quick-load */}
                    <div className="space-y-2 p-3 rounded-lg border border-dashed border-blue-300 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-blue-800">📝 Plantillas de Prompt (Lego)</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-blue-700 h-7 text-xs"
                          onClick={() => setShowTemplates(v => !v)}
                        >
                          {showTemplates ? '✕ Cerrar' : '▼ Elegir plantilla...'}
                        </Button>
                      </div>
                      {showTemplates && (
                        <div className="grid grid-cols-1 gap-1 mt-2">
                          {PROMPT_TEMPLATES.map(tpl => (
                            <button
                              key={tpl.id}
                              type="button"
                              className="text-left px-3 py-2 rounded-md text-sm hover:bg-blue-100 border border-transparent hover:border-blue-300 transition-colors"
                              onClick={() => {
                                setForm(p => ({
                                  ...p,
                                  ai_config: { ...tpl.ai_config },
                                  modules: [...new Set([...p.modules, ...tpl.modules])],
                                }));
                                setShowTemplates(false);
                              }}
                            >
                              {tpl.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {!showTemplates && (
                        <p className="text-xs text-blue-600">
                          Cargá un prompt base pre-armado y luego ajustá los campos a mano.
                        </p>
                      )}
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
          </div>
        )}

        {/* Categories Tab */}
        {currentTab === 'categories' && <CategoriesABM />}

        {/* Documents Tab */}
        {currentTab === 'documents' && <DocumentsABM />}

        {/* Tech Sheets Tab */}
        {currentTab === 'techsheets' && <TechSheetsABM />}

        {/* Assignments Tab */}
        {currentTab === 'assignments' && <AssignmentsABM />}

        {/* Reports Tab */}
        {currentTab === 'reports' && <ReportsABM />}
      </main>
    </div>
  );
};

export default AdminPanel;

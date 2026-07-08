'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAdmin } from '@/lib/admin-context';
import { Plus, ArrowLeft, Trash2, Save, Settings, Users, Shield, FolderOpen, FileUp, UserCheck, BarChart3, ClipboardList, Wand2, Copy, MessageSquare, Bell, CalendarDays, Users2, Building2, GraduationCap, Handshake, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { GlobalStatsDashboard } from '@/components/GlobalStatsDashboard';
import { CompaniesABM } from '@/components/CompaniesABM';
import { FoundationABM } from '@/components/FoundationABM';
import { EndorsersABM } from '@/components/EndorsersABM';
import { AccessRequestsPanel } from '@/components/AccessRequestsPanel';
import { SimulationCalendar } from '@/components/SimulationCalendar';
import { TeacherGroupsABM } from '@/components/TeacherGroupsABM';
import { CategoriesABM } from '@/components/CategoriesABM';
import { DocumentsABM } from '@/components/DocumentsABM';
import { TechSheetsABM } from '@/components/TechSheetsABM';
import { AssignmentsABM } from '@/components/AssignmentsABM';
import { ReportsABM } from '@/components/ReportsABM';
import { ScenariosABM } from '@/components/ScenariosABM';
import { TemplatesABM } from '@/components/TemplatesABM';
import { SimulationSessionViewer } from '@/components/SimulationSessionViewer';
import { UsersABM } from '@/components/UsersABM';
import { RolesABM } from '@/components/RolesABM';
import { PromptTemplatesABM } from '@/components/PromptTemplatesABM';
import { ConfigurePromptModal } from '@/components/ConfigurePromptModal';

const AVAILABLE_MODULES = [
  { id: 'chat_ia', label: 'Chat IA (Simulación Conversacional)' },
  { id: 'email_simulado', label: 'Email Simulado' },
  { id: 'documentos', label: 'Carpeta de Documentos' },
  { id: 'hoja_calculo', label: 'Hoja de Cálculo' },
  { id: 'crisis_engine', label: 'Motor de Crisis' },
  { id: 'evaluacion_auto', label: 'Evaluación Automática IA' },
];



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

interface CrisisEventConfig {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  options: [
    { text: string; score: number; feedback: string },
    { text: string; score: number; feedback: string },
    { text: string; score: number; feedback: string },
  ];
}

interface CourseForm {
  course_id: string;
  title: string;
  description: string;
  category: string;
  modules: string[];
  ai_config: {
    base_role?: string;
    course_context: string;
    personality_traits?: string[];
    knowledge_base_prompt?: string;
  };
  eval_criteria: string[];
  crisis_events: CrisisEventConfig[];
  is_active: boolean;
  tech_sheet_id: number | null;
  categories: string[];
  simulated_company_id: number | null;
}

const emptyForm: CourseForm = {
  course_id: '',
  title: '',
  description: '',
  category: 'general',
  modules: ['chat_ia'],
  ai_config: { course_context: '' },
  eval_criteria: [],
  crisis_events: [],
  is_active: true,
  tech_sheet_id: null,
  categories: [],
  simulated_company_id: null,
};

const AdminPanel = () => {
  const { user, hasRole, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [techSheets, setTechSheets] = useState<Array<{ id: number; name: string; processed: boolean }>>([]);
  const [simCompanies, setSimCompanies] = useState<Array<{ id: number; name: string; short_name?: string }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CourseForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');
  const [newTrait, setNewTrait] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCrisisForm, setShowCrisisForm] = useState(false);
  const [expandedCrisis, setExpandedCrisis] = useState<number | null>(null);
  const emtpyCrisisEvent: CrisisEventConfig = {
    title: '',
    description: '',
    severity: 'medium',
    options: [
      { text: '', score: 90, feedback: '' },
      { text: '', score: 55, feedback: '' },
      { text: '', score: 20, feedback: '' },
    ],
  };
  const [newCrisis, setNewCrisis] = useState<CrisisEventConfig>({ ...emtpyCrisisEvent, options: [...emtpyCrisisEvent.options] as CrisisEventConfig['options'] });
  const { currentTab, setCurrentTab, isInitialized } = useAdmin();
  const [showPromptConfigModal, setShowPromptConfigModal] = useState(false);
  const [selectedCourseForPromptConfig, setSelectedCourseForPromptConfig] = useState<any>(null);
  const [courseFilter, setCourseFilter] = useState<'all' | 'active' | 'inactive'>('all'); // Filtro de cursos

  useEffect(() => {
    if (!loading && (!user || (!hasRole('admin') && !hasRole('ministerio')))) router.push('/dashboard');
  }, [user, loading, hasRole, router]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await apiClient.get('/courses');
      if (res.data) setCourses(res.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Error al cargar los cursos');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCourses();
      // Cargar categorías
      apiClient.get('/categories')
        .then(r => setDbCategories(Array.isArray(r.data) ? r.data : []))
        .catch(() => {});
      // Cargar SOLO fichas técnicas válidas (con competencies o kpi_requirements)
      apiClient.get('/tech-sheets/valid/list')
        .then(r => r.data)
        .then(d => setTechSheets(Array.isArray(d) ? d.map((s: any) => ({ id: s.id, name: s.name, processed: s.processed })) : []))
        .catch(() => {});
      apiClient.get('/simulated-companies')
        .then(r => r.data)
        .then(d => setSimCompanies(Array.isArray(d) ? d.map((c: any) => ({ id: c.id, name: c.name, short_name: c.short_name })) : []))
        .catch(() => {});
    }
  }, [user]);

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
      category: form.categories[0] || form.category || 'general',
      categories: form.categories,
      modules: form.modules as any,
      ai_config: form.ai_config as any,
      eval_criteria: form.eval_criteria as any,
      crisis_events: form.crisis_events as any,
      is_active: form.is_active,
      tech_sheet_id: form.tech_sheet_id || null,
      simulated_company_id: form.simulated_company_id || null,
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
      category: course.category || 'general',
      categories: Array.isArray(course.categories) ? course.categories : (course.category ? [course.category] : ['general']),
      modules: course.modules || [],
      ai_config: course.ai_config || { course_context: '' },
      eval_criteria: course.eval_criteria || [],
      crisis_events: course.crisis_events || [],
      is_active: course.is_active,
      tech_sheet_id: course.tech_sheet_id || null,
      simulated_company_id: course.simulated_company_id || null,
    });
    setEditingId(course.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ ¿Estás seguro? Esta acción eliminará el curso y TODAS sus dependencias (escenarios, simulaciones, etc) de forma irreversible.')) {
      return;
    }
    try {
      const response = await apiClient.delete(`/admin/courses/${id}`);
      toast.success(response.data.message || 'Curso eliminado');
      fetchCourses();
    } catch (error: any) {
      // Manejo de errores específicos
      if (error.response?.status === 409) {
        // Conflicto: El curso tiene asignaciones activas
        const data = error.response.data;
        toast.error(
          `❌ No se puede eliminar.\n\n${data.reason}\n\n` +
          `Asignaciones activas: ${data.activeAssignments}\n` +
          `Asignaciones completadas: ${data.completedAssignments}\n\n` +
          `💡 ${data.suggestion}`
        );
      } else {
        toast.error(error.message || 'Error al eliminar el curso');
      }
    }
  };

  const handleDuplicate = async (course: any) => {
    // Generar ID único con timestamp + random para permitir duplicados múltiples
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const newId = `${course.course_id}-COPIA-${timestamp}-${random}`.substring(0, 50);
    
    const payload = {
      course_id: newId,
      title: course.title + ` (Copia ${new Date().toLocaleTimeString()})`,
      description: course.description || '',
      category: course.category,
      categories: Array.isArray(course.categories) ? course.categories : (course.category ? [course.category] : []),
      modules: course.modules || [],
      ai_config: course.ai_config || { course_context: '' },
      eval_criteria: course.eval_criteria || [],
      crisis_events: course.crisis_events || [],
      is_active: false, // Las copias comienzan como inactivas
      tech_sheet_id: course.tech_sheet_id || null,
      simulated_company_id: course.simulated_company_id || null,
      created_by: user!.id,
    };
    try {
      await apiClient.post('/courses', payload);
      toast.success(`Copia creada: "${payload.title}"`);
      fetchCourses();
    } catch (e: any) {
      toast.error(e.message || 'Error al duplicar el curso');
    }
  };

  const toggleModule = (mod: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.includes(mod) ? prev.modules.filter(m => m !== mod) : [...prev.modules, mod],
    }));
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {hasRole('ministerio') && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800 flex items-center gap-3">
            <Shield className="w-5 h-5 shrink-0" />
            <span><strong>Modo solo lectura — Ministerio.</strong> Podés ver toda la configuración pero no crear, editar ni eliminar.</span>
          </div>
        )}
        {/* Courses Tab */}
        {currentTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Gestión de Cursos</h2>
                <p className="text-gray-600 mt-1">Crea, edita y configura los cursos disponibles</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm({ ...emptyForm }); setEditingId(null); } }}>
                {!hasRole('ministerio') && (
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Nuevo Curso</Button>
                </DialogTrigger>
                )}
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Editar Curso' : hasRole('ministerio') ? 'Ver Curso' : 'Crear Nuevo Curso'}</DialogTitle>
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
                        <Label className="text-sm font-semibold">Categorías <span className="text-gray-400 font-normal">(una o varias)</span></Label>
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="checkbox"
                            checked={form.categories.length === dbCategories.length && dbCategories.length > 0}
                            onChange={() => setForm(p => ({ ...p, categories: p.categories.length === dbCategories.length ? [] : dbCategories.map(c => c.code) }))}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">Seleccionar todas</span>
                        </div>
                        <div className="border rounded-lg p-2 bg-white max-h-36 overflow-y-auto flex flex-wrap gap-2">
                          {dbCategories.map(cat => (
                            <label key={cat.code} className={`flex items-center gap-2 p-1 rounded cursor-pointer ${form.categories.includes(cat.code) ? 'bg-blue-50' : ''}`}>
                              <input 
                                type="checkbox"
                                checked={form.categories.includes(cat.code)}
                                onChange={() => setForm(p => ({ ...p, categories: p.categories.includes(cat.code) ? p.categories.filter(c => c !== cat.code) : [...p.categories, cat.code] }))}
                                className="rounded"
                              />
                              <span className="text-xs capitalize">{cat.name}</span>
                            </label>
                          ))}
                        </div>
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
                          <Input value={newTrait} onChange={e => setNewTrait(e.target.value)} placeholder="impaciente" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newTrait.trim()) { setForm(p => ({ ...p, ai_config: { ...p.ai_config, personality_traits: [...(p.ai_config.personality_traits || []), newTrait.trim()] } })); setNewTrait(''); } } }} />
                          <Button type="button" variant="outline" size="sm" onClick={() => { if (newTrait.trim()) { setForm(p => ({ ...p, ai_config: { ...p.ai_config, personality_traits: [...(p.ai_config.personality_traits || []), newTrait.trim()] } })); setNewTrait(''); } }}>+</Button>
                        </div>
                        <div className="flex flex-wrap gap-1">{(form.ai_config.personality_traits || []).map((t, i) => <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm(p => ({ ...p, ai_config: { ...p.ai_config, personality_traits: (p.ai_config.personality_traits || []).filter((_, j) => j !== i) } }))}>{t} ×</Badge>)}</div>
                      </div>
                    </div>

                    {/* Eval criteria */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">📊 Criterios de Evaluación (KPIs)</Label>

                      {/* Selector de Ficha Técnica (opcional) */}
                      <div className="p-4 rounded-lg border border-dashed border-purple-300 bg-purple-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                            📋 Ficha Técnica Ministerial
                            <span className="text-xs font-normal text-purple-600">(opcional)</span>
                          </Label>
                          {form.tech_sheet_id && (
                            <Badge variant="default" className="bg-purple-600">Asignada</Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-purple-700">
                          Asocia una ficha técnica para que sus competencias y KPIs se reflejen automáticamente en reportes y certificados.
                        </p>

                        {form.tech_sheet_id ? (
                          <div className="space-y-2">
                            <div className="bg-white rounded-md p-3 border border-purple-200 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-purple-900">
                                  ✅ {techSheets.find(s => s.id === form.tech_sheet_id)?.name || `Ficha #${form.tech_sheet_id}`}
                                </p>
                                <p className="text-xs text-purple-600 mt-1">
                                  {techSheets.find(s => s.id === form.tech_sheet_id)?.processed ? 
                                    '✓ Analizada y lista' : 
                                    '⏳ Pendiente de análisis'}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => setForm(p => ({ ...p, tech_sheet_id: null }))}
                              >
                                ✕ Desasignar
                              </Button>
                            </div>
                            
                            {techSheets.length > 1 && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-purple-700 font-semibold hover:text-purple-900">
                                  ⇄ Cambiar a otra ficha técnica
                                </summary>
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                  {techSheets.filter(s => s.id !== form.tech_sheet_id).map(s => (
                                    <button
                                      key={s.id}
                                      type="button"
                                      className="text-left px-3 py-2 rounded-md bg-white border border-purple-200 hover:bg-purple-100 transition-colors text-sm"
                                      onClick={() => setForm(p => ({ ...p, tech_sheet_id: s.id }))}
                                    >
                                      <span className="font-semibold">{s.processed ? '✅' : '⏳'} {s.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-purple-700 font-semibold">Sin ficha técnica asignada</p>
                            {techSheets.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2">
                                {techSheets.map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className="text-left px-3 py-2 rounded-md bg-white border border-purple-200 hover:bg-purple-100 transition-colors text-sm"
                                    onClick={() => setForm(p => ({ ...p, tech_sheet_id: s.id }))}
                                  >
                                    <span className="font-semibold">{s.processed ? '✅' : '⏳'} {s.name}</span>
                                    <p className="text-xs text-purple-600 mt-0.5">
                                      {s.processed ? 'Analizada' : 'Pendiente análisis'}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-purple-600 italic">
                                No hay fichas técnicas disponibles. Crea una en la sección "Fichas Técnicas".
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Input value={newCriterion} onChange={e => setNewCriterion(e.target.value)} placeholder="empatía, resolución, conocimiento técnico..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newCriterion.trim()) { setForm(p => ({ ...p, eval_criteria: [...p.eval_criteria, newCriterion.trim()] })); setNewCriterion(''); } } }} />
                        <Button type="button" variant="outline" size="sm" onClick={() => { if (newCriterion.trim()) { setForm(p => ({ ...p, eval_criteria: [...p.eval_criteria, newCriterion.trim()] })); setNewCriterion(''); } }}>+</Button>
                      </div>
                      <div className="flex flex-wrap gap-1">{form.eval_criteria.map((c, i) => <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => setForm(p => ({ ...p, eval_criteria: p.eval_criteria.filter((_, j) => j !== i) }))}>{c} ×</Badge>)}</div>
                    </div>

                    {/* ─── Crisis Engine Config ─────────────────────────────── */}
                    {form.modules.includes('crisis_engine') && (
                      <div className="space-y-3 p-4 rounded-lg border border-dashed border-orange-300 bg-orange-50/60 dark:bg-orange-950/20">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            🚨 Configuración del Motor de Crisis
                          </Label>
                          <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">
                            {form.crisis_events.length} evento{form.crisis_events.length !== 1 ? 's' : ''} personalizado{form.crisis_events.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {/* Info sobre eventos built-in */}
                        <div className="bg-white/60 dark:bg-black/20 rounded-md px-3 py-2 text-xs text-orange-700 dark:text-orange-400 space-y-1">
                          <p className="font-semibold">Eventos incorporados según categoría del curso:</p>
                          <ul className="space-y-0.5 ml-2">
                            <li>• <strong>administracion / contable:</strong> Error en liquidación de sueldos · Auditoría AFIP sorpresa</li>
                            <li>• <strong>rrhh:</strong> Renuncia masiva · Denuncia por acoso laboral</li>
                            <li>• <strong>informatica:</strong> Servidor de producción caído · Brecha de seguridad activa</li>
                            <li>• <strong>emprendimiento / ventas / legal / general:</strong> Proveedor cancela contrato · Competidor lanza producto similar</li>
                          </ul>
                          <p className="mt-1 text-orange-600">Los eventos personalizados que agregues tendrán <strong>prioridad</strong> sobre los incorporados.</p>
                        </div>

                        {/* Lista de eventos personalizados existentes */}
                        {form.crisis_events.length > 0 && (
                          <div className="space-y-2">
                            {form.crisis_events.map((evt, idx) => (
                              <div key={idx} className="border border-orange-200 bg-white/80 dark:bg-black/20 rounded-md overflow-hidden">
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-orange-50/60 transition-colors"
                                  onClick={() => setExpandedCrisis(expandedCrisis === idx ? null : idx)}
                                >
                                  <span className="text-sm font-medium truncate">{evt.title || `Evento #${idx + 1}`}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className={`text-xs ${evt.severity === 'high' ? 'border-red-300 text-red-600' : evt.severity === 'medium' ? 'border-yellow-300 text-yellow-600' : 'border-green-300 text-green-600'}`}>
                                      {evt.severity === 'high' ? 'Alta' : evt.severity === 'medium' ? 'Media' : 'Baja'}
                                    </Badge>
                                    {expandedCrisis === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </div>
                                </button>
                                {expandedCrisis === idx && (
                                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-orange-100">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Título</Label>
                                      <Input
                                        value={evt.title}
                                        onChange={e => setForm(p => { const ev = [...p.crisis_events]; ev[idx] = { ...ev[idx], title: e.target.value }; return { ...p, crisis_events: ev }; })}
                                        className="text-sm h-8"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Descripción de la crisis</Label>
                                      <Textarea
                                        value={evt.description}
                                        onChange={e => setForm(p => { const ev = [...p.crisis_events]; ev[idx] = { ...ev[idx], description: e.target.value }; return { ...p, crisis_events: ev }; })}
                                        rows={2}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Severidad</Label>
                                      <Select value={evt.severity} onValueChange={v => setForm(p => { const ev = [...p.crisis_events]; ev[idx] = { ...ev[idx], severity: v as any }; return { ...p, crisis_events: ev }; })}>
                                        <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="low">🟢 Baja</SelectItem>
                                          <SelectItem value="medium">🟡 Media</SelectItem>
                                          <SelectItem value="high">🔴 Alta</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-semibold">Opciones de respuesta (A · B · C)</Label>
                                      {evt.options.map((opt, oi) => (
                                        <div key={oi} className="grid grid-cols-[1fr_64px] gap-2 items-start">
                                          <div className="space-y-1">
                                            <Input
                                              placeholder={`Opción ${String.fromCharCode(65 + oi)}: texto de respuesta...`}
                                              value={opt.text}
                                              onChange={e => setForm(p => { const ev = [...p.crisis_events]; const ops = [...ev[idx].options] as CrisisEventConfig['options']; ops[oi] = { ...ops[oi], text: e.target.value }; ev[idx] = { ...ev[idx], options: ops }; return { ...p, crisis_events: ev }; })}
                                              className="text-xs h-7"
                                            />
                                            <Input
                                              placeholder="Feedback pedagógico..."
                                              value={opt.feedback}
                                              onChange={e => setForm(p => { const ev = [...p.crisis_events]; const ops = [...ev[idx].options] as CrisisEventConfig['options']; ops[oi] = { ...ops[oi], feedback: e.target.value }; ev[idx] = { ...ev[idx], options: ops }; return { ...p, crisis_events: ev }; })}
                                              className="text-xs h-7 text-muted-foreground"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs text-center block">Puntaje</Label>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={opt.score}
                                              onChange={e => setForm(p => { const ev = [...p.crisis_events]; const ops = [...ev[idx].options] as CrisisEventConfig['options']; ops[oi] = { ...ops[oi], score: parseInt(e.target.value) || 0 }; ev[idx] = { ...ev[idx], options: ops }; return { ...p, crisis_events: ev }; })}
                                              className="text-xs h-7 text-center"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="w-full mt-1 h-7 text-xs"
                                      onClick={() => setForm(p => ({ ...p, crisis_events: p.crisis_events.filter((_, j) => j !== idx) }))}
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" /> Eliminar evento
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Agregar nuevo evento */}
                        {!showCrisisForm ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                            onClick={() => { setShowCrisisForm(true); setNewCrisis({ ...emtpyCrisisEvent, options: [...emtpyCrisisEvent.options] as CrisisEventConfig['options'] }); }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Agregar evento personalizado
                          </Button>
                        ) : (
                          <div className="border border-orange-300 bg-white/80 dark:bg-black/20 rounded-md p-3 space-y-3">
                            <Label className="text-sm font-semibold">Nuevo evento de crisis</Label>
                            <Input placeholder="Título del evento" value={newCrisis.title} onChange={e => setNewCrisis(p => ({ ...p, title: e.target.value }))} className="text-sm" />
                            <Textarea placeholder="Descripción detallada de la situación de crisis..." value={newCrisis.description} onChange={e => setNewCrisis(p => ({ ...p, description: e.target.value }))} rows={2} className="text-sm" />
                            <Select value={newCrisis.severity} onValueChange={v => setNewCrisis(p => ({ ...p, severity: v as any }))}>
                              <SelectTrigger className="text-sm h-8"><SelectValue placeholder="Severidad" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">🟢 Baja</SelectItem>
                                <SelectItem value="medium">🟡 Media</SelectItem>
                                <SelectItem value="high">🔴 Alta</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold">3 opciones de respuesta (la A debe ser la mejor)</Label>
                              {newCrisis.options.map((opt, oi) => (
                                <div key={oi} className="grid grid-cols-[1fr_64px] gap-2 items-start">
                                  <div className="space-y-1">
                                    <Input
                                      placeholder={`Opción ${String.fromCharCode(65 + oi)}: texto...`}
                                      value={opt.text}
                                      onChange={e => setNewCrisis(p => { const ops = [...p.options] as CrisisEventConfig['options']; ops[oi] = { ...ops[oi], text: e.target.value }; return { ...p, options: ops }; })}
                                      className="text-xs h-7"
                                    />
                                    <Input
                                      placeholder="Feedback..."
                                      value={opt.feedback}
                                      onChange={e => setNewCrisis(p => { const ops = [...p.options] as CrisisEventConfig['options']; ops[oi] = { ...ops[oi], feedback: e.target.value }; return { ...p, options: ops }; })}
                                      className="text-xs h-7 text-muted-foreground"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-center block">Pts</Label>
                                    <Input
                                      type="number" min="0" max="100"
                                      value={opt.score}
                                      onChange={e => setNewCrisis(p => { const ops = [...p.options] as CrisisEventConfig['options']; ops[oi] = { ...ops[oi], score: parseInt(e.target.value) || 0 }; return { ...p, options: ops }; })}
                                      className="text-xs h-7 text-center"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                                onClick={() => {
                                  if (!newCrisis.title.trim()) return;
                                  setForm(p => ({ ...p, crisis_events: [...p.crisis_events, { ...newCrisis }] }));
                                  setShowCrisisForm(false);
                                }}
                              >
                                <Plus className="w-4 h-4 mr-1" /> Agregar
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCrisisForm(false)}>Cancelar</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empresa Simulada */}
                    {simCompanies.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">🏢 Empresa Simulada <span className="text-gray-400 font-normal">(opcional)</span></Label>
                        <Select
                          value={form.simulated_company_id?.toString() || 'none'}
                          onValueChange={v => setForm(p => ({ ...p, simulated_company_id: v === 'none' ? null : parseInt(v) }))}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Sin empresa simulada" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin empresa simulada</SelectItem>
                            {simCompanies.map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.short_name ? `${c.short_name} — ` : ''}{c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Active toggle */}
                    <div className="flex items-center justify-between">
                      <Label>Curso Activo</Label>
                      <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                    </div>

                    {!hasRole('ministerio') && (
                    <Button className="w-full" onClick={handleSave} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" /> {saving ? 'Guardando...' : editingId ? 'Actualizar Curso' : 'Crear Curso'}
                    </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filtro de Cursos */}
            <div className="flex gap-2 mb-4">
              <Button 
                variant={courseFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCourseFilter('all')}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Todos ({courses.length})
              </Button>
              <Button 
                variant={courseFilter === 'active' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCourseFilter('active')}
                className="gap-2"
              >
                <Badge variant="default" className="text-xs bg-green-600">✓</Badge>
                Activos ({courses.filter(c => c.is_active).length})
              </Button>
              <Button 
                variant={courseFilter === 'inactive' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCourseFilter('inactive')}
                className="gap-2"
              >
                <Badge variant="secondary" className="text-xs bg-gray-400">✕</Badge>
                Inactivos ({courses.filter(c => !c.is_active).length})
              </Button>
            </div>

            <div className="grid gap-4">
              {courses
                .filter(course => {
                  if (courseFilter === 'active') return course.is_active;
                  if (courseFilter === 'inactive') return !course.is_active;
                  return true; // 'all'
                })
                .map(course => (
                <Card key={course.id} className={`glass-card ${!course.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{course.title}</h3>
                        {Array.isArray(course.categories) && course.categories.length > 0
                          ? course.categories.map((cat: string) => <Badge key={cat} variant="secondary" className="text-xs capitalize">{cat}</Badge>)
                          : <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                        }
                        {course.is_active 
                          ? <Badge variant="default" className="text-xs bg-green-600">✓ Activo</Badge>
                          : <Badge variant="secondary" className="text-xs bg-gray-400">✕ Inactivo</Badge>
                        }
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{course.course_id} — {(course.modules as string[])?.join(', ')}</p>
                    </div>
                    <div className="flex gap-2">
                      {!hasRole('ministerio') && (
                        <>
                      <Button variant="outline" size="sm" title="Duplicar curso" onClick={() => handleDuplicate(course)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(course.id)} title="Eliminar curso y todas sus dependencias">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                        </>
                      )}
                      {hasRole('ministerio') && (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                          <Settings className="w-4 h-4" /> Ver
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {loadingCourses ? (
                <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p>Cargando cursos...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay cursos configurados. Cree el primero.</p>
                </div>
              ) : null}
              {!loadingCourses && courses.length > 0 && courses.filter(c => {
                if (courseFilter === 'active') return c.is_active;
                if (courseFilter === 'inactive') return !c.is_active;
                return true;
              }).length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No hay cursos {courseFilter === 'active' ? 'activos' : courseFilter === 'inactive' ? 'inactivos' : ''}.
                  </p>
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

        {/* Scenarios Tab */}
        {currentTab === 'scenarios' && <ScenariosABM />}

        {/* Templates Tab */}
        {currentTab === 'templates' && <TemplatesABM />}

        {/* Prompt Templates Tab */}
        {currentTab === 'prompt-templates' && <PromptTemplatesABM />}

        {/* Sessions Tab - Solo admin/teacher */}
        {currentTab === 'sessions' && <SimulationSessionViewer />}

        {/* Users Tab */}
        {currentTab === 'users' && <UsersABM />}

        {/* Roles & Permissions Tab */}
        {currentTab === 'roles' && <RolesABM />}

        {/* Stats Tab */}
        {currentTab === 'stats' && <GlobalStatsDashboard />}

        {/* Access Requests Tab */}
        {currentTab === 'requests' && <AccessRequestsPanel />}

        {/* Teacher Groups Tab */}
        {currentTab === 'groups' && <TeacherGroupsABM />}

        {/* Calendar Tab */}
        {currentTab === 'calendar' && <SimulationCalendar />}

        {/* Companies Tab */}
        {currentTab === 'companies' && <CompaniesABM />}

        {/* Foundation Tab */}
        {currentTab === 'foundation' && <FoundationABM />}

        {/* Endorsers Tab */}
        {currentTab === 'endorsers' && <EndorsersABM />}
      </main>
    </div>
  );
};

export default AdminPanel;

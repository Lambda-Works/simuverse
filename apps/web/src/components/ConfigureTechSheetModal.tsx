'use client'
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE, authFetch } from '@/lib/api';
import { apiClient } from '@/services/ApiClient';
import { BarChart3, Edit2, Mail, Package, Plus, ShieldAlert, Trash2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Competency {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

interface KPIConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  target_value: number;
  minimum_pass_value: number;
  competencies_required: string[];
  evaluation_questions: string[];
}

interface TaskConfig {
  id: string;
  kpi_id: string;
  type: 'practice';
  title: string;
  description: string;
  difficulty: 'very_low' | 'low' | 'medium';
  sequence: number;
  expected_duration_minutes: number;
}

interface EmailConfig {
  subject: string;
  body: string;
  trigger_condition: string;
  timing_minutes: number;
  practice_id?: string;
  practice_title?: string;
  trigger_mode?: 'time' | 'messages';
  trigger_value?: number;
}

interface SpreadsheetColumn {
  header: string;
  type: string;
  formula?: string;
}

interface SpreadsheetConfig {
  columns: SpreadsheetColumn[];
  sample_data: unknown[];
  practice_id?: string;
  practice_title?: string;
}

interface CrisisScenario {
  trigger: string;
  description: string;
  resolution_options: string[];
  practice_id?: string;
  practice_title?: string;
  trigger_mode?: 'time' | 'messages';
  trigger_value?: number;
}

interface CrisisConfig {
  scenarios: CrisisScenario[];
}

interface AssetsConfig {
  emails: EmailConfig[];
  spreadsheet: SpreadsheetConfig;
  crisis: CrisisConfig;
}

interface AnalyzedKPIsConfig {
  tech_sheet_id: number;
  analyzed_at: Date;
  competencies: Competency[];
  kpis: KPIConfig[];
  tasks: TaskConfig[];
  prompts: {
    system_prompt: string;
    coaching_prompt: string;
  };
  assets: AssetsConfig;
}

const DIFFICULTY_LABELS: Record<TaskConfig['difficulty'], string> = {
  very_low: 'Muy baja',
  low: 'Baja',
  medium: 'Media',
};

function normalizeDifficulty(raw: string | undefined): TaskConfig['difficulty'] {
  const key = String(raw || '').toLowerCase();
  if (key === 'very_low' || key === 'easy' || key === 'basica') return 'very_low';
  if (key === 'low' || key === 'intermedia') return 'low';
  if (key === 'medium' || key === 'hard' || key === 'avanzada') return 'medium';
  return 'medium';
}

/** Map pipeline spreadsheet (Spanish keys) to SpreadsheetConfig (English keys). */
function mapSpreadsheet(raw: any): SpreadsheetConfig {
  if (!raw || typeof raw !== 'object') return { columns: [], sample_data: [] };
  return {
    columns: (raw.columnas || raw.columns || []).map((c: any) => ({
      header: c.encabezado || c.header || '',
      type: c.tipo || c.type || 'string',
    })),
    sample_data: raw.datos_ejemplo || raw.sample_data || [],
    practice_id: raw.practice_id,
    practice_title: raw.practice_title,
  };
}

/** Map pipeline crisis array (Spanish keys) to CrisisConfig. */
function mapCrisis(raw: any): CrisisConfig {
  const arr = Array.isArray(raw) ? raw : [];
  return {
    scenarios: arr.map((s: any) => ({
      trigger: s.detonante || s.trigger || '',
      description: s.descripcion || s.description || '',
      resolution_options: s.opciones_resolucion || s.resolution_options || [],
      practice_id: s.practice_id,
      practice_title: s.practice_title,
      trigger_mode: s.trigger_mode,
      trigger_value: s.trigger_value,
    })),
  };
}

/** Reverse-map AssetsConfig back to pipeline_output shape (Spanish keys). */
function unmapAssets(assets: AssetsConfig): Record<string, any> {
  return {
    step_8_emails: assets.emails.map((e) => ({
      subject: e.subject,
      body: e.body,
      trigger_condition: e.trigger_condition,
      timing_minutes: e.timing_minutes,
      practice_id: e.practice_id,
      practice_title: e.practice_title,
      trigger_mode: e.trigger_mode,
      trigger_value: e.trigger_value,
    })),
    step_9_spreadsheet: {
      columnas: assets.spreadsheet.columns.map((c) => ({
        encabezado: c.header,
        tipo: c.type,
      })),
      datos_ejemplo: assets.spreadsheet.sample_data,
      practice_id: assets.spreadsheet.practice_id,
      practice_title: assets.spreadsheet.practice_title,
    },
    step_10_crisis: assets.crisis.scenarios.map((s) => ({
      detonante: s.trigger,
      descripcion: s.description,
      opciones_resolucion: s.resolution_options,
      practice_id: s.practice_id,
      practice_title: s.practice_title,
      trigger_mode: s.trigger_mode,
      trigger_value: s.trigger_value,
    })),
  };
}

interface ConfigureTechSheetModalProps {
  techSheetId: number;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigureTechSheetModal({
  techSheetId,
  courseId,
  isOpen,
  onClose,
}: ConfigureTechSheetModalProps) {
  const [config, setConfig] = useState<AnalyzedKPIsConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('competencies');
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const overlayMouseDown = useRef(false);

  useEffect(() => {
    if (isOpen && !config) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // Fetch pipeline status from tech sheet endpoint
      try {
        const sheetResponse = await authFetch(`${API_BASE}/tech-sheets/${techSheetId}`);
        if (sheetResponse.ok) {
          const sheetData = await sheetResponse.json();
          setPipelineStatus(sheetData.pipeline_status || null);
        }
      } catch {
        // Non-critical — config still loads
      }

      const response = await apiClient.get(
        `/tech-sheets/${techSheetId}/config`
      );
      if (response.data) {
        const data = response.data;
        // Normalizar: asegurar defaults para KPIs y tareas
        setConfig({
          tech_sheet_id: techSheetId,
          analyzed_at: new Date(),
          competencies: (data.competencies || []).map((c: any) => ({
            id: c.id || crypto.randomUUID(),
            name: c.name || '',
            description: c.description || '',
            level: c.level || 'basic',
          })),
          kpis: (data.kpis || []).map((k: any) => ({
            id: k.id || crypto.randomUUID(),
            name: k.name || '',
            description: k.description || '',
            category: k.category || '',
            weight: k.weight ?? 0,
            target_value: k.target_value ?? 0,
            minimum_pass_value: k.minimum_pass_value ?? 0,
            competencies_required: k.competencies_required || [],
            evaluation_questions: k.evaluation_questions || [],
          })),
          tasks: (data.tasks || []).map((t: any) => ({
            id: t.id || crypto.randomUUID(),
            kpi_id: t.kpi_id || '',
            type: 'practice' as const,
            title: t.title || '',
            description: t.description || '',
            difficulty: normalizeDifficulty(t.difficulty),
            sequence: t.sequence ?? 0,
            expected_duration_minutes: t.expected_duration_minutes ?? 0,
          })),
          prompts: {
            system_prompt: data.prompts?.system_prompt || data.prompts?.system || '',
            coaching_prompt: data.prompts?.coaching_prompt || '',
          },
          assets: {
            emails: data.assets?.emails || data.pipeline_output?.step_8_emails || [],
            spreadsheet: data.assets?.spreadsheet || mapSpreadsheet(data.pipeline_output?.step_9_spreadsheet),
            crisis: data.assets?.crisis || mapCrisis(data.pipeline_output?.step_10_crisis),
          },
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      await apiClient.put(
        `/tech-sheets/${techSheetId}/config`,
        {
          competencies: config.competencies,
          kpis: config.kpis,
          tasks: config.tasks,
          prompts: config.prompts,
          pipeline_output: unmapAssets(config.assets),
        }
      );
      setEditing(false);
      toast.success('Configuracion guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuracion');
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl p-6">
          <p>Cargando configuración...</p>
        </Card>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl p-6">
          <p>Configuración no encontrada. Ejecuta análisis primero.</p>
          <Button onClick={onClose} className="mt-4">Cerrar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onMouseDown={(e) => { overlayMouseDown.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (e.target === e.currentTarget && overlayMouseDown.current) onClose(); overlayMouseDown.current = false; }}
    >
      <Card className="w-full max-w-4xl m-4 p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Configurar Ficha Tecnica</h2>
            {pipelineStatus && (
              <Badge
                variant={
                  pipelineStatus === 'completed'
                    ? 'default'
                    : pipelineStatus === 'failed' || pipelineStatus === 'validation_rejected'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {pipelineStatus === 'completed'
                  ? 'Analizado'
                  : pipelineStatus === 'running'
                  ? 'Analizando...'
                  : pipelineStatus === 'failed'
                  ? 'Error'
                  : pipelineStatus === 'validation_rejected'
                  ? 'Rechazado'
                  : pipelineStatus}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="competencies">Competencias</TabsTrigger>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="tasks">Tareas</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="assets">Contenido</TabsTrigger>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
          </TabsList>

          {/* COMPETENCIAS */}
          <TabsContent value="competencies" className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg">Competencias Detectadas</h3>
            <div className="space-y-3 max-h-96 overflow-auto">
              {config.competencies.map((comp) => (
                <Card key={comp.id} className="p-4 flex justify-between items-start">
                  <div className="flex-1">
                    {editing ? (
                      <>
                        <Input
                          value={comp.name}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              competencies: config.competencies.map((c) =>
                                c.id === comp.id ? { ...c, name: e.target.value } : c
                              ),
                            });
                          }}
                          placeholder="Nombre"
                          className="mb-2"
                        />
                        <Textarea
                          value={comp.description}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              competencies: config.competencies.map((c) =>
                                c.id === comp.id ? { ...c, description: e.target.value } : c
                              ),
                            });
                          }}
                          placeholder="Descripción"
                          rows={2}
                        />
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">{comp.name}</p>
                        <p className="text-sm text-gray-600">{comp.description}</p>
                        <p className="text-xs text-gray-400 mt-1">Nivel: {comp.level}</p>
                      </>
                    )}
                  </div>
                  {editing && (
                    <Button
                      onClick={() => {
                        setConfig({
                          ...config,
                          competencies: config.competencies.filter(
                            (c) => c.id !== comp.id
                          ),
                        });
                      }}
                      variant="outline"
                      className="ml-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </Card>
              ))}
            </div>
            {editing && (
              <Button
                onClick={() => {
                  const newComp: Competency = {
                    id: `comp-${Date.now()}`,
                    name: 'Nueva Competencia',
                    description: '',
                    level: 'intermediate',
                  };
                  setConfig({
                    ...config,
                    competencies: [...config.competencies, newComp],
                  });
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Competencia
              </Button>
            )}
          </TabsContent>

          {/* KPIs */}
          <TabsContent value="kpis" className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg">Indicadores de Desempeño (KPIs)</h3>
            <div className="space-y-3 max-h-96 overflow-auto">
              {config.kpis.map((kpi) => (
                <Card key={kpi.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      {editing ? (
                        <Input
                          value={kpi.name}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              kpis: config.kpis.map((k) =>
                                k.id === kpi.id ? { ...k, name: e.target.value } : k
                              ),
                            });
                          }}
                          placeholder="Nombre del KPI"
                          className="mb-2"
                        />
                      ) : (
                        <p className="font-semibold">{kpi.name}</p>
                      )}
                    </div>
                    {editing && (
                      <Button
                        onClick={() => {
                          setConfig({
                            ...config,
                            kpis: config.kpis.filter((k) => k.id !== kpi.id),
                          });
                        }}
                        variant="outline"
                        className="ml-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <label className="text-gray-600">Peso:</label>
                      {editing ? (
                        <Input
                          type="number"
                          value={kpi.weight ?? 0}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              kpis: config.kpis.map((k) =>
                                k.id === kpi.id
                                  ? { ...k, weight: parseFloat(e.target.value) }
                                  : k
                              ),
                            });
                          }}
                          className="mt-1"
                        />
                      ) : (
                        <p>{(kpi.weight ?? 0).toFixed(1)}%</p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-600">Meta:</label>
                      {editing ? (
                        <Input
                          type="number"
                          value={kpi.target_value ?? 0}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              kpis: config.kpis.map((k) =>
                                k.id === kpi.id
                                  ? { ...k, target_value: parseFloat(e.target.value) }
                                  : k
                              ),
                            });
                          }}
                          className="mt-1"
                        />
                      ) : (
                        <p>{kpi.target_value ?? 0}%</p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-600">Mínimo:</label>
                      {editing ? (
                        <Input
                          type="number"
                          value={kpi.minimum_pass_value}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              kpis: config.kpis.map((k) =>
                                k.id === kpi.id
                                  ? { ...k, minimum_pass_value: parseFloat(e.target.value) }
                                  : k
                              ),
                            });
                          }}
                          className="mt-1"
                        />
                      ) : (
                        <p>{kpi.minimum_pass_value}%</p>
                      )}
                    </div>
                  </div>

                  {!editing && (
                    <>
                      <p className="text-xs text-gray-500 mt-2">
                        Tareas: {config.tasks.filter((t) => t.kpi_id === kpi.id).length}
                      </p>
                      <p className="text-xs text-gray-500">
                        Preguntas: {kpi.evaluation_questions.length}
                      </p>
                    </>
                  )}
                </Card>
              ))}
            </div>
            {editing && (
              <Button
                onClick={() => {
                  const newKPI: KPIConfig = {
                    id: `kpi-${Date.now()}`,
                    name: 'Nuevo KPI',
                    description: '',
                    category: 'performance',
                    weight: 33.33,
                    target_value: 95,
                    minimum_pass_value: 70,
                    competencies_required: [],
                    evaluation_questions: [],
                  };
                  setConfig({
                    ...config,
                    kpis: [...config.kpis, newKPI],
                  });
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar KPI
              </Button>
            )}
          </TabsContent>

          {/* TAREAS */}
          <TabsContent value="tasks" className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg">Tareas de Simulación</h3>
            <p className="text-sm text-gray-600">
              Total: {config.tasks.length} tareas
            </p>
            <div className="space-y-3 max-h-96 overflow-auto">
              {config.tasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-4 border-blue-200 bg-blue-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-xs font-semibold px-2 py-1 bg-white rounded">
                          Práctica
                        </span>
                        {editing ? (
                          <select
                            className="text-xs border rounded px-2 py-1 bg-white"
                            value={task.difficulty}
                            onChange={(e) => {
                              const difficulty = e.target.value as TaskConfig['difficulty'];
                              setConfig({
                                ...config,
                                tasks: config.tasks.map((t) =>
                                  t.id === task.id ? { ...t, difficulty } : t,
                                ),
                              });
                            }}
                          >
                            <option value="very_low">Muy baja</option>
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                          </select>
                        ) : (
                          <span className="text-xs text-gray-600">
                            Dificultad: {DIFFICULTY_LABELS[task.difficulty] || task.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-sm line-clamp-2">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.expected_duration_minutes} min | Secuencia: {task.sequence}
                      </p>
                    </div>
                    {editing && (
                      <Button
                        onClick={() => {
                          setConfig({
                            ...config,
                            tasks: config.tasks.filter((t) => t.id !== task.id),
                          });
                        }}
                        variant="outline"
                        className="ml-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            {editing && (
              <Button
                onClick={() => {
                  const newTask: TaskConfig = {
                    id: `task-${Date.now()}`,
                    kpi_id: config.kpis[0]?.id || '',
                    type: 'practice',
                    title: 'Nueva Tarea',
                    description: '',
                    difficulty: 'very_low',
                    sequence: config.tasks.length + 1,
                    expected_duration_minutes: 15,
                  };
                  setConfig({
                    ...config,
                    tasks: [...config.tasks, newTask],
                  });
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Tarea
              </Button>
            )}
          </TabsContent>

          {/* PROMPTS */}
          <TabsContent value="prompts" className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg">Prompts para IA</h3>

            <div className="space-y-4">
              <div>
                <label className="font-semibold block mb-2">System Prompt</label>
                {editing ? (
                  <Textarea
                    value={config.prompts.system_prompt}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        prompts: {
                          ...config.prompts,
                          system_prompt: e.target.value,
                        },
                      });
                    }}
                    rows={4}
                  />
                ) : (
                  <Card className="p-4 bg-gray-50 text-sm max-h-32 overflow-auto">
                    {config.prompts.system_prompt}
                  </Card>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-2">Coaching Prompt</label>
                {editing ? (
                  <Textarea
                    value={config.prompts.coaching_prompt}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        prompts: {
                          ...config.prompts,
                          coaching_prompt: e.target.value,
                        },
                      });
                    }}
                    rows={4}
                  />
                ) : (
                  <Card className="p-4 bg-gray-50 text-sm max-h-32 overflow-auto">
                    {config.prompts.coaching_prompt}
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* CONTENIDO */}
          <TabsContent value="assets" className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Contenido Generado por Pipeline
            </h3>

            <Tabs defaultValue="emails" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="emails">
                  <Mail className="w-4 h-4 mr-1" /> Emails ({config.assets.emails.length})
                </TabsTrigger>
                <TabsTrigger value="spreadsheet">
                  <BarChart3 className="w-4 h-4 mr-1" /> Hoja Calculo
                </TabsTrigger>
                <TabsTrigger value="crisis">
                  <ShieldAlert className="w-4 h-4 mr-1" /> Crisis ({config.assets.crisis.scenarios.length})
                </TabsTrigger>
              </TabsList>

              {/* EMAILS SUB-TAB */}
              <TabsContent value="emails" className="mt-4">
                {config.assets.emails.length === 0 ? (
                  <Card className="p-4 bg-gray-50 text-sm text-gray-500">
                    No hay emails generados. Ejecuta el pipeline con el modulo de email activado.
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-[55vh] overflow-auto">
                    {config.assets.emails.map((email, idx) => (
                      <Card key={idx} className="p-3">
                        {/* Badge de estado de vinculacion */}
                        {!email.practice_id ? (
                          <Badge variant="destructive" className="mb-2">Sin vincular</Badge>
                        ) : (
                          <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                            Practica: {email.practice_title || 'Vinculada'}
                          </Badge>
                        )}
                        {editing ? (
                          <div className="space-y-2 mt-1">
                            {/* Selector de practica */}
                            <div>
                              <label className="text-xs text-gray-500">Practica:</label>
                              <Select
                                value={email.practice_id || ''}
                                onValueChange={(val) => {
                                  const task = config.tasks.find((t) => t.id === val);
                                  const newEmails = [...config.assets.emails];
                                  newEmails[idx] = {
                                    ...email,
                                    practice_id: val,
                                    practice_title: task?.title || '',
                                  };
                                  setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
                                }}
                              >
                                <SelectTrigger className="text-xs h-auto min-h-[32px] py-1 max-w-full"><SelectValue placeholder="Seleccionar practica" /></SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                                  {config.tasks.map((task) => (
                                    <SelectItem key={task.id} value={task.id} className="text-xs py-1.5">
                                      <span className="truncate block max-w-full">{task.title}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Trigger config */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-500">Modo de disparo:</label>
                                <div className="flex gap-2 mt-1">
                                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`email-trigger-mode-${idx}`}
                                      checked={email.trigger_mode !== 'messages'}
                                      onChange={() => {
                                        const newEmails = [...config.assets.emails];
                                        newEmails[idx] = { ...email, trigger_mode: 'time' };
                                        setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
                                      }}
                                    />
                                    Tiempo
                                  </label>
                                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`email-trigger-mode-${idx}`}
                                      checked={email.trigger_mode === 'messages'}
                                      onChange={() => {
                                        const newEmails = [...config.assets.emails];
                                        newEmails[idx] = { ...email, trigger_mode: 'messages' };
                                        setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
                                      }}
                                    />
                                    Mensajes
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">
                                  {email.trigger_mode === 'messages' ? 'Cant. mensajes' : 'Minutos'}:
                                </label>
                                <Input
                                  type="number"
                                  value={email.trigger_value ?? email.timing_minutes ?? 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const newEmails = [...config.assets.emails];
                                    newEmails[idx] = { ...email, trigger_value: val, timing_minutes: val };
                                    setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
                                  }}
                                  className="text-xs h-8"
                                />
                              </div>
                            </div>

                            <Input
                              value={email.subject}
                              onChange={(e) => {
                                const newEmails = [...config.assets.emails];
                                newEmails[idx] = { ...email, subject: e.target.value };
                                setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
                              }}
                              placeholder="Asunto"
                            />
                            <Textarea
                              value={email.body}
                              onChange={(e) => {
                                const newEmails = [...config.assets.emails];
                                newEmails[idx] = { ...email, body: e.target.value };
                                setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
                              }}
                              placeholder="Cuerpo del email"
                              rows={3}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                const newEmails = config.assets.emails.filter((_, i) => i !== idx);
                                setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <p className="font-semibold text-sm">{email.subject}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{email.body}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Disparo: {email.trigger_mode === 'messages' ? `${email.trigger_value || 0} msjs` : `${email.trigger_value || email.timing_minutes || 0} min`}
                            </p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const newEmail: EmailConfig = {
                        subject: 'Nuevo Email',
                        body: '',
                        trigger_condition: 'after_start',
                        timing_minutes: 0,
                        trigger_mode: 'time',
                        trigger_value: 0,
                      };
                      setConfig({
                        ...config,
                        assets: { ...config.assets, emails: [...config.assets.emails, newEmail] },
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Agregar Email
                  </Button>
                )}
              </TabsContent>

              {/* SPREADSHEET SUB-TAB */}
              <TabsContent value="spreadsheet" className="mt-4">
                {config.assets.spreadsheet.columns.length === 0 ? (
                  <Card className="p-4 bg-gray-50 text-sm text-gray-500">
                    No hay hoja de calculo generada. Ejecuta el pipeline con el modulo de calculo activado.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <Card className="p-3">
                      {!config.assets.spreadsheet.practice_id ? (
                        <Badge variant="destructive" className="mb-2">Sin vincular</Badge>
                      ) : (
                        <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                          Practica: {config.assets.spreadsheet.practice_title || 'Vinculada'}
                        </Badge>
                      )}
                      {editing && (
                        <div className="mt-1">
                          <label className="text-xs text-gray-500">Practica vinculada:</label>
                          <Select
                            value={config.assets.spreadsheet.practice_id || ''}
                            onValueChange={(val) => {
                              const task = config.tasks.find((t) => t.id === val);
                              setConfig({
                                ...config,
                                assets: {
                                  ...config.assets,
                                  spreadsheet: {
                                    ...config.assets.spreadsheet,
                                    practice_id: val,
                                    practice_title: task?.title || '',
                                  },
                                },
                              });
                            }}
                          >
                            <SelectTrigger className="text-xs h-auto min-h-[32px] py-1 max-w-full"><SelectValue placeholder="Seleccionar practica" /></SelectTrigger>
                            <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                              {config.tasks.map((task) => (
                                <SelectItem key={task.id} value={task.id} className="text-xs py-1.5">
                                  <span className="truncate block max-w-full">{task.title}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </Card>

                    <Card className="p-3 overflow-auto max-h-[55vh]">
                      <div className="min-w-full">
                        <div className="flex gap-2 border-b pb-2 mb-2">
                          {config.assets.spreadsheet.columns.map((col, idx) => (
                            <div key={idx} className="flex-1 min-w-[120px]">
                              {editing ? (
                                <Input
                                  value={col.header}
                                  onChange={(e) => {
                                    const newCols = [...config.assets.spreadsheet.columns];
                                    newCols[idx] = { ...col, header: e.target.value };
                                    setConfig({
                                      ...config,
                                      assets: {
                                        ...config.assets,
                                        spreadsheet: { ...config.assets.spreadsheet, columns: newCols },
                                      },
                                    });
                                  }}
                                  className="text-xs"
                                />
                              ) : (
                                <span className="text-xs font-semibold">{col.header}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {config.assets.spreadsheet.sample_data.map((row: any, rowIdx) => (
                          <div key={rowIdx} className="flex gap-2 py-1">
                            {config.assets.spreadsheet.columns.map((col, colIdx) => (
                              <div key={colIdx} className="flex-1 min-w-[120px] text-xs">
                                {editing ? (
                                  <Input
                                    value={String((row as any)[col.header] || '')}
                                    onChange={(e) => {
                                      const newData = [...config.assets.spreadsheet.sample_data];
                                      const prevRow = (typeof newData[rowIdx] === 'object' && newData[rowIdx] !== null)
                                        ? newData[rowIdx] as Record<string, any>
                                        : {};
                                      newData[rowIdx] = { ...prevRow, [col.header]: e.target.value };
                                      setConfig({
                                        ...config,
                                        assets: {
                                          ...config.assets,
                                          spreadsheet: { ...config.assets.spreadsheet, sample_data: newData },
                                        },
                                      });
                                    }}
                                    className="text-xs"
                                  />
                                ) : (
                                  <span>{String((row as any)[col.header] || '')}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* CRISIS SUB-TAB */}
              <TabsContent value="crisis" className="mt-4">
                {config.assets.crisis.scenarios.length === 0 ? (
                  <Card className="p-4 bg-gray-50 text-sm text-gray-500">
                    No hay escenarios de crisis generados. Ejecuta el pipeline con el modulo de crisis activado.
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-[55vh] overflow-auto">
                    {config.assets.crisis.scenarios.map((scenario, idx) => (
                      <Card key={idx} className="p-3">
                        {/* Badge de estado de vinculacion */}
                        {!scenario.practice_id ? (
                          <Badge variant="destructive" className="mb-2">Sin vincular</Badge>
                        ) : (
                          <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                            Practica: {scenario.practice_title || 'Vinculada'}
                          </Badge>
                        )}
                        {editing ? (
                          <div className="space-y-2 mt-1">
                            {/* Selector de practica */}
                            <div>
                              <label className="text-xs text-gray-500">Practica:</label>
                              <Select
                                value={scenario.practice_id || ''}
                                onValueChange={(val) => {
                                  const task = config.tasks.find((t) => t.id === val);
                                  const newScenarios = [...config.assets.crisis.scenarios];
                                  newScenarios[idx] = {
                                    ...scenario,
                                    practice_id: val,
                                    practice_title: task?.title || '',
                                  };
                                  setConfig({
                                    ...config,
                                    assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                  });
                                }}
                              >
                                <SelectTrigger className="text-xs h-auto min-h-[32px] py-1 max-w-full"><SelectValue placeholder="Seleccionar practica" /></SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                                  {config.tasks.map((task) => (
                                    <SelectItem key={task.id} value={task.id} className="text-xs py-1.5">
                                      <span className="truncate block max-w-full">{task.title}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Trigger config */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-500">Modo de disparo:</label>
                                <div className="flex gap-2 mt-1">
                                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`crisis-trigger-mode-${idx}`}
                                      checked={scenario.trigger_mode !== 'messages'}
                                      onChange={() => {
                                        const newScenarios = [...config.assets.crisis.scenarios];
                                        newScenarios[idx] = { ...scenario, trigger_mode: 'time' };
                                        setConfig({
                                          ...config,
                                          assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                        });
                                      }}
                                    />
                                    Tiempo
                                  </label>
                                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`crisis-trigger-mode-${idx}`}
                                      checked={scenario.trigger_mode === 'messages'}
                                      onChange={() => {
                                        const newScenarios = [...config.assets.crisis.scenarios];
                                        newScenarios[idx] = { ...scenario, trigger_mode: 'messages' };
                                        setConfig({
                                          ...config,
                                          assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                        });
                                      }}
                                    />
                                    Mensajes
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">
                                  {scenario.trigger_mode === 'messages' ? 'Cant. mensajes' : 'Minutos'}:
                                </label>
                                <Input
                                  type="number"
                                  value={scenario.trigger_value ?? 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const newScenarios = [...config.assets.crisis.scenarios];
                                    newScenarios[idx] = { ...scenario, trigger_value: val };
                                    setConfig({
                                      ...config,
                                      assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                    });
                                  }}
                                  className="text-xs h-8"
                                />
                              </div>
                            </div>

                            <Input
                              value={scenario.trigger}
                              onChange={(e) => {
                                const newScenarios = [...config.assets.crisis.scenarios];
                                newScenarios[idx] = { ...scenario, trigger: e.target.value };
                                setConfig({
                                  ...config,
                                  assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                });
                              }}
                              placeholder="Trigger del escenario"
                            />
                            <Textarea
                              value={scenario.description}
                              onChange={(e) => {
                                const newScenarios = [...config.assets.crisis.scenarios];
                                newScenarios[idx] = { ...scenario, description: e.target.value };
                                setConfig({
                                  ...config,
                                  assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                });
                              }}
                              placeholder="Descripcion del escenario"
                              rows={2}
                            />
                            <div>
                              <label className="text-xs text-gray-600">Opciones de resolucion:</label>
                              {scenario.resolution_options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex gap-1 mt-1">
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const newScenarios = [...config.assets.crisis.scenarios];
                                      const newOpts = [...scenario.resolution_options];
                                      newOpts[optIdx] = e.target.value;
                                      newScenarios[idx] = { ...scenario, resolution_options: newOpts };
                                      setConfig({
                                        ...config,
                                        assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                      });
                                    }}
                                    className="text-xs"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600"
                                    onClick={() => {
                                      const newScenarios = [...config.assets.crisis.scenarios];
                                      const newOpts = scenario.resolution_options.filter((_, i) => i !== optIdx);
                                      newScenarios[idx] = { ...scenario, resolution_options: newOpts };
                                      setConfig({
                                        ...config,
                                        assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                      });
                                    }}
                                  >
                                    X
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1"
                                onClick={() => {
                                  const newScenarios = [...config.assets.crisis.scenarios];
                                  newScenarios[idx] = {
                                    ...scenario,
                                    resolution_options: [...scenario.resolution_options, ''],
                                  };
                                  setConfig({
                                    ...config,
                                    assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                  });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Opcion
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                const newScenarios = config.assets.crisis.scenarios.filter((_, i) => i !== idx);
                                setConfig({
                                  ...config,
                                  assets: { ...config.assets, crisis: { scenarios: newScenarios } },
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <p className="font-semibold text-sm">{scenario.trigger}</p>
                            <p className="text-xs text-gray-600 mt-1">{scenario.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Disparo: {scenario.trigger_mode === 'messages' ? `${scenario.trigger_value || 0} msjs` : `${scenario.trigger_value || 0} min`}
                            </p>
                            <div className="mt-1">
                              <span className="text-xs text-gray-400">Resoluciones:</span>
                              <ul className="text-xs text-gray-500 ml-4 list-disc">
                                {scenario.resolution_options.map((opt, optIdx) => (
                                  <li key={optIdx}>{opt}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const newScenario = {
                        trigger: 'Nuevo Escenario',
                        description: '',
                        resolution_options: [],
                      };
                      setConfig({
                        ...config,
                        assets: {
                          ...config.assets,
                          crisis: { scenarios: [...config.assets.crisis.scenarios, newScenario] },
                        },
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Agregar Escenario
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* RESUMEN */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg">Resumen de Configuración</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-blue-50">
                <p className="text-sm text-gray-600">Competencias</p>
                <p className="text-2xl font-bold">{config.competencies.length}</p>
              </Card>
              <Card className="p-4 bg-green-50">
                <p className="text-sm text-gray-600">KPIs</p>
                <p className="text-2xl font-bold">{config.kpis.length}</p>
              </Card>
              <Card className="p-4 bg-purple-50">
                <p className="text-sm text-gray-600">Tareas Totales</p>
                <p className="text-2xl font-bold">{config.tasks.length}</p>
              </Card>
              <Card className="p-4 bg-yellow-50">
                <p className="text-sm text-gray-600">Prompts</p>
                <p className="text-2xl font-bold">
                  {[
                    config.prompts.system_prompt,
                    config.prompts.coaching_prompt,
                  ].filter(Boolean).length}
                </p>
              </Card>
              <Card className="p-4 bg-blue-50/70">
                <p className="text-sm text-gray-600">Emails</p>
                <p className="text-2xl font-bold">{config.assets.emails.length}</p>
              </Card>
              <Card className="p-4 bg-red-50">
                <p className="text-sm text-gray-600">Escenarios de Crisis</p>
                <p className="text-2xl font-bold">{config.assets.crisis.scenarios.length}</p>
              </Card>
            </div>

            <Card className="p-4">
              <p className="text-sm text-gray-600">
                Ficha #: <span className="font-semibold">{config.tech_sheet_id}</span>
              </p>
              <p className="text-sm text-gray-600">
                Analizada: {new Date(config.analyzed_at).toLocaleString()}
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6 justify-end">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="bg-blue-600">
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setEditing(false);
                  fetchConfig();
                }}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig} className="bg-green-600">
                Guardar Cambios
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

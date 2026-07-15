'use client'
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE, authFetch } from '@/lib/api';
import { apiClient } from '@/services/ApiClient';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
        }
      );
      setEditing(false);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto" onClick={onClose}>
      <Card className="w-full max-w-4xl m-4 p-6" onClick={(e) => e.stopPropagation()}>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="competencies">Competencias</TabsTrigger>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="tasks">Tareas</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
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
                        📋 Tareas: {config.tasks.filter((t) => t.kpi_id === kpi.id).length}
                      </p>
                      <p className="text-xs text-gray-500">
                        📝 Preguntas: {kpi.evaluation_questions.length}
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
                      <p className="font-semibold">{task.title}</p>
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

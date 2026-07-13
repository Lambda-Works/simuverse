'use client'
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/ApiClient';

interface Course {
  id: string;
  name: string;
}

interface TechSheet {
  id: number;
  name: string;
  description?: string;
}

interface KPI {
  id: string;
  name: string;
  description?: string;
  target_value?: number;
  minimum_pass_value?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  kpi_id?: string;
}

interface PromptTemplate {
  id: number;
  name: string;
  category?: string;
  base_role: string;
  course_context?: string;
  personality_traits?: string[];
  knowledge_base_prompt: string;
}

interface ConfigurePromptModalProps {
  course: Course;
  techSheet?: TechSheet;
  kpis?: KPI[];
  tasks?: Task[];
  onSave: (promptData: any) => void;
  onClose: () => void;
}

export const ConfigurePromptModal: React.FC<ConfigurePromptModalProps> = ({
  course,
  techSheet,
  kpis = [],
  tasks = [],
  onSave,
  onClose
}) => {
  const [mode, setMode] = useState<'template' | 'manual' | 'guided'>('template');
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [baseRole, setBaseRole] = useState('');
  const [courseContext, setCourseContext] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [traitInput, setTraitInput] = useState('');

  // Modalidad Guiada
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [aiRole, setAiRole] = useState('');
  const [situations, setSituations] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/prompt-templates');
      const data = response.data;
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSelectTemplate = async (templateId: number) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setBaseRole(template.base_role);
      setCourseContext(template.course_context || '');
      setTraits(template.personality_traits || []);
      setPrompt(template.knowledge_base_prompt);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!selectedKPIs.length || !aiRole) {
      toast.error('Debes seleccionar al menos un KPI y definir el rol IA');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiClient.post(`/prompt-config/${course.id}/generate`, {
        selectedKPIIds: selectedKPIs,
        selectedTaskIds: selectedTasks,
        aiRole,
        situations
      });

      const data = response.data;
      if (data.success) {
        setGeneratedPrompt(data.prompt);
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Error generando prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    const promptData = {
      base_role: baseRole,
      course_context: courseContext,
      personality_traits: traits,
      knowledge_base_prompt: prompt,
      tech_sheet_id: techSheet?.id,
      template_id: mode === 'template' ? selectedTemplate : undefined,
      generation_mode: mode,
      generated_by: mode === 'guided' ? 'admin' : undefined
    };

    try {
      await apiClient.post(`/prompt-config/${course.id}/save`, { promptData });
      toast.success('Configuración guardada exitosamente');
      onSave(promptData);
      onClose();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Error guardando configuración');
    }
  };

  const addTrait = () => {
    if (traitInput.trim()) {
      setTraits([...traits, traitInput.trim()]);
      setTraitInput('');
    }
  };

  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">⚙️ Configurar Prompts de IA</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold cursor-pointer hover:text-red-600"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <button
            onClick={() => setMode('template')}
            className={`px-4 py-2 font-semibold border-b-2 ${mode === 'template' ? 'border-blue-600' : 'border-transparent'}`}
          >
            📋 Ficha Técnica
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 font-semibold border-b-2 ${mode === 'manual' ? 'border-blue-600' : 'border-transparent'}`}
          >
            ✍️ Prompts
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          
          {/* TAB: FICHA TECNICA */}
          {mode === 'template' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">📋 Ficha Técnica</h3>
                {techSheet ? (
                  <div className="border p-4 rounded bg-gray-50">
                    <p className="font-semibold">{techSheet.name}</p>
                    <p className="text-sm text-gray-600 mt-2">{techSheet.description}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay ficha técnica asociada</p>
                )}
              </div>

              <div>
                <h3 className="font-bold mb-2">🎯 KPIs Definidos</h3>
                {kpis.length > 0 ? (
                  <div className="space-y-2">
                    {kpis.map(kpi => (
                      <div key={kpi.id} className="border p-3 rounded">
                        <div className="font-semibold text-sm">{kpi.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{kpi.description}</div>
                        <div className="text-xs mt-1">
                          Objetivo: {kpi.target_value || '—'}% | Mínimo: {kpi.minimum_pass_value || '—'}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay KPIs definidos</p>
                )}
              </div>

              <div>
                <h3 className="font-bold mb-2">✓ Tareas Asociadas</h3>
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div key={task.id} className="border p-3 rounded">
                        <div className="font-semibold text-sm">{task.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{task.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay tareas definidas</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: CONFIGURAR PROMPTS */}
          {mode === 'manual' && (
            <div className="space-y-6">
              {/* Modalidad */}
              <fieldset>
                <legend className="font-semibold mb-3">Modalidad de Configuración:</legend>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="template"
                      checked={mode === 'template'}
                      onChange={(e) => setMode('template')}
                    />
                    <span>📋 Usar Plantilla</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="manual"
                      checked={mode === 'manual'}
                      onChange={(e) => setMode('manual')}
                    />
                    <span>✍️ Escritura Manual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="guided"
                      checked={mode === 'guided'}
                      onChange={(e) => setMode('guided')}
                    />
                    <span>🤖 Generación Guiada</span>
                  </label>
                </div>
              </fieldset>

              {/* MODAL: Template Selection */}
              {mode === 'template' && (
                <div>
                  <label className="block font-semibold mb-2">Selecciona una plantilla:</label>
                  <select
                    value={selectedTemplate || ''}
                    onChange={(e) => handleSelectTemplate(parseInt(e.target.value))}
                    className="w-full border rounded p-2 mb-4"
                  >
                    <option value="">-- Selecciona plantilla --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>

                  {selectedTemplate && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                      <div>
                        <label className="block text-sm font-semibold">Base Role:</label>
                        <textarea
                          value={baseRole}
                          readOnly
                          className="w-full border rounded p-2 text-xs"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold">Course Context:</label>
                        <textarea
                          value={courseContext}
                          readOnly
                          className="w-full border rounded p-2 text-xs"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Personalidad:</label>
                        <div className="flex flex-wrap gap-2">
                          {traits.map((t, i) => (
                            <span key={i} className="bg-blue-200 px-2 py-1 rounded text-xs">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL: Manual Entry */}
              {mode === 'manual' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-1">Base Role *</label>
                    <textarea
                      value={baseRole}
                      onChange={(e) => setBaseRole(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Eres un cliente enojado..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Course Context</label>
                    <textarea
                      value={courseContext}
                      onChange={(e) => setCourseContext(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="El alumno es..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Personality Traits</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={traitInput}
                        onChange={(e) => setTraitInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTrait()}
                        className="flex-1 border rounded p-2"
                        placeholder="impaciente, exigente..."
                      />
                      <button
                        type="button"
                        onClick={addTrait}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Agregar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {traits.map((t, i) => (
                        <span
                          key={i}
                          className="bg-blue-100 px-3 py-1 rounded text-sm cursor-pointer hover:bg-blue-200"
                          onClick={() => removeTrait(i)}
                        >
                          {t} ✕
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Knowledge Base Prompt *</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Si el alumno..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* MODAL: Guided Generation */}
              {mode === 'guided' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">1️⃣ KPIs a evaluar</h3>
                    {kpis.length > 0 ? (
                      <div className="space-y-2">
                        {kpis.map(kpi => (
                          <label key={kpi.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedKPIs.includes(kpi.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedKPIs([...selectedKPIs, kpi.id]);
                                } else {
                                  setSelectedKPIs(selectedKPIs.filter(k => k !== kpi.id));
                                }
                              }}
                            />
                            <span className="text-sm">{kpi.name} ({kpi.target_value}%)</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No hay KPIs disponibles</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">2️⃣ Tareas a simular</h3>
                    {tasks.length > 0 ? (
                      <div className="space-y-2">
                        {tasks
                          .filter(t => selectedKPIs.includes(t.kpi_id || ''))
                          .map(task => (
                            <label key={task.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTasks.includes(task.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTasks([...selectedTasks, task.id]);
                                  } else {
                                    setSelectedTasks(selectedTasks.filter(t => t !== task.id));
                                  }
                                }}
                              />
                              <span className="text-sm">{task.title}</span>
                            </label>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Selecciona KPIs primero</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">3️⃣ ¿Qué rol toma la IA?</label>
                    <input
                      type="text"
                      value={aiRole}
                      onChange={(e) => setAiRole(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Ej: Cliente exigente, Auditor fiscal"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">4️⃣ Situaciones a presentar</label>
                    <textarea
                      value={situations}
                      onChange={(e) => setSituations(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Ej: El cliente reclama..."
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !selectedKPIs.length || !aiRole}
                    className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    {isGenerating ? '⏳ Generando...' : '🤖 Generar Prompt con IA'}
                  </button>

                  {generatedPrompt && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✨ Prompt Generado</h4>
                      <pre className="bg-white border p-3 rounded text-xs overflow-x-auto max-h-48">
                        {JSON.stringify(generatedPrompt, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            💾 Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

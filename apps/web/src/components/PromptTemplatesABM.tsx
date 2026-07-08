'use client'
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/ApiClient';

interface PromptTemplate {
  id: number;
  name: string;
  description?: string;
  category?: string;
  base_role: string;
  course_context?: string;
  personality_traits?: string[];
  knowledge_base_prompt: string;
  is_active: boolean;
  created_at?: string;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  base_role: string;
  course_context: string;
  personality_traits: string[];
  knowledge_base_prompt: string;
}

export const PromptTemplatesABM: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories] = useState(['service', 'audit', 'sales', 'management']);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [traitInput, setTraitInput] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'service',
    base_role: '',
    course_context: '',
    personality_traits: [],
    knowledge_base_prompt: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/prompt-templates');
      const data = response.data;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await apiClient.put(`/prompt-templates/${editingId}`, formData);
      } else {
        await apiClient.post('/prompt-templates', formData);
      }

      fetchTemplates();
      resetForm();
      toast.success(editingId ? 'Plantilla actualizada' : 'Plantilla creada');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error guardando plantilla');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Desactivar esta plantilla?')) {
      try {
        await apiClient.delete(`/prompt-templates/${id}`);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleDuplicate = async (id: number, name: string) => {
    const newName = prompt('Nombre para la copia:', `${name} (Copia)`);
    if (newName) {
      try {
        await apiClient.post(`/prompt-templates/${id}/duplicate`, { name: newName });

        fetchTemplates();
        toast.success('Plantilla duplicada exitosamente');
      } catch (error) {
        console.error('Error duplicating template:', error);
      }
    }
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || 'service',
      base_role: template.base_role,
      course_context: template.course_context || '',
      personality_traits: template.personality_traits || [],
      knowledge_base_prompt: template.knowledge_base_prompt
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'service',
      base_role: '',
      course_context: '',
      personality_traits: [],
      knowledge_base_prompt: ''
    });
    setEditingId(null);
    setShowModal(false);
    setTraitInput('');
  };

  const addTrait = () => {
    if (traitInput.trim()) {
      setFormData({
        ...formData,
        personality_traits: [...formData.personality_traits, traitInput.trim()]
      });
      setTraitInput('');
    }
  };

  const removeTrait = (index: number) => {
    setFormData({
      ...formData,
      personality_traits: formData.personality_traits.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📋 Plantillas de Prompts</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ➕ Nueva Plantilla
        </button>
      </div>

      {/* Tabs por categoría */}
      <div className="mb-6">
        <div className="flex gap-4 border-b mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              className="px-4 py-2 border-b-2 border-blue-600 font-semibold capitalize"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tabla de plantillas */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">Nombre</th>
                <th className="border p-3 text-left">Descripción</th>
                <th className="border p-3 text-left">Rol IA</th>
                <th className="border p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="border p-3 font-semibold">{template.name}</td>
                  <td className="border p-3 text-sm text-gray-600 max-w-xs truncate">
                    {template.description || '—'}
                  </td>
                  <td className="border p-3 text-xs text-gray-600 max-w-xs truncate">
                    {template.base_role.substring(0, 50)}...
                  </td>
                  <td className="border p-3 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="px-2 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDuplicate(template.id, template.name)}
                      className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">
              {editingId ? '✏️ Editar Plantilla' : '➕ Nueva Plantilla'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="Ej: Cliente Enojado"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded p-2 rows-2"
                  placeholder="Cuándo usar esta plantilla..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded p-2"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Rol de la IA *</label>
                <textarea
                  value={formData.base_role}
                  onChange={(e) => setFormData({ ...formData, base_role: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="Eres un cliente que..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Contexto del Curso</label>
                <textarea
                  value={formData.course_context}
                  onChange={(e) => setFormData({ ...formData, course_context: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="El alumno es..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Traits de Personalidad</label>
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
                  {formData.personality_traits.map((trait, i) => (
                    <span
                      key={i}
                      className="bg-blue-100 px-3 py-1 rounded text-sm cursor-pointer hover:bg-blue-200"
                      onClick={() => removeTrait(i)}
                    >
                      {trait} ✕
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Prompt Base (Knowledge) *</label>
                <textarea
                  value={formData.knowledge_base_prompt}
                  onChange={(e) => setFormData({ ...formData, knowledge_base_prompt: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="Si el alumno hace X, entonces..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  💾 Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

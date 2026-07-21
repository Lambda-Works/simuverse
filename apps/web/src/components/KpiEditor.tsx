'use client'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

export interface KPIConfig {
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

interface KpiEditorProps {
  kpis: KPIConfig[];
  tasks: Array<{ id: string; kpi_id: string }>;
  editing: boolean;
  onUpdate: (kpis: KPIConfig[]) => void;
}

export function KpiEditor({ kpis, tasks, editing, onUpdate }: KpiEditorProps) {
  const handleAdd = () => {
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
    onUpdate([...kpis, newKPI]);
  };

  const handleRemove = (id: string) => {
    onUpdate(kpis.filter(k => k.id !== id));
  };

  const handleUpdate = (id: string, field: keyof KPIConfig, value: string | number) => {
    onUpdate(kpis.map(k =>
      k.id === id ? { ...k, [field]: value } : k
    ));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Indicadores de Desempeno (KPIs)</h3>
      <div className="space-y-3 max-h-96 overflow-auto">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                {editing ? (
                  <Input
                    value={kpi.name}
                    onChange={(e) => handleUpdate(kpi.id, 'name', e.target.value)}
                    placeholder="Nombre del KPI"
                    className="mb-2"
                  />
                ) : (
                  <p className="font-semibold">{kpi.name}</p>
                )}
              </div>
              {editing && (
                <Button
                  onClick={() => handleRemove(kpi.id)}
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
                    onChange={(e) => handleUpdate(kpi.id, 'weight', parseFloat(e.target.value))}
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
                    onChange={(e) => handleUpdate(kpi.id, 'target_value', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                ) : (
                  <p>{kpi.target_value ?? 0}%</p>
                )}
              </div>
              <div>
                <label className="text-gray-600">Minimo:</label>
                {editing ? (
                  <Input
                    type="number"
                    value={kpi.minimum_pass_value}
                    onChange={(e) => handleUpdate(kpi.id, 'minimum_pass_value', parseFloat(e.target.value))}
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
                  Tareas: {tasks.filter((t) => t.kpi_id === kpi.id).length}
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
        <Button onClick={handleAdd} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Agregar KPI
        </Button>
      )}
    </div>
  );
}

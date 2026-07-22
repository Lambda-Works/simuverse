'use client'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

export interface Competency {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

interface CompetencyEditorProps {
  competencies: Competency[];
  editing: boolean;
  onUpdate: (competencies: Competency[]) => void;
}

export function CompetencyEditor({ competencies, editing, onUpdate }: CompetencyEditorProps) {
  const handleAdd = () => {
    const newComp: Competency = {
      id: `comp-${Date.now()}`,
      name: 'Nueva Competencia',
      description: '',
      level: 'intermediate',
    };
    onUpdate([...competencies, newComp]);
  };

  const handleRemove = (id: string) => {
    onUpdate(competencies.filter(c => c.id !== id));
  };

  const handleUpdate = (id: string, field: keyof Competency, value: string) => {
    onUpdate(competencies.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Competencias Detectadas</h3>
      <div className="space-y-3 max-h-96 overflow-auto">
        {competencies.map((comp) => (
          <Card key={comp.id} className="p-4 flex justify-between items-start">
            <div className="flex-1">
              {editing ? (
                <>
                  <Input
                    value={comp.name}
                    onChange={(e) => handleUpdate(comp.id, 'name', e.target.value)}
                    placeholder="Nombre"
                    className="mb-2"
                  />
                  <Textarea
                    value={comp.description}
                    onChange={(e) => handleUpdate(comp.id, 'description', e.target.value)}
                    placeholder="Descripcion"
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
                onClick={() => handleRemove(comp.id)}
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
        <Button onClick={handleAdd} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Competencia
        </Button>
      )}
    </div>
  );
}

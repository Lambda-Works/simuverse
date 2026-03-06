import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, Edit2, Plus, Zap, FileUp } from 'lucide-react';

interface TechSheet {
  id: number;
  name: string;
  ministry_code: string;
  description: string;
  processed: boolean;
  extracted_data: any;
  created_at: string;
  updated_at: string;
}

export function TechSheetsABM() {
  const [sheets, setSheets] = useState<TechSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<TechSheet | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    ministry_code: '',
    description: '',
  });

  // Fetch tech sheets
  useEffect(() => {
    fetchTechSheets();
  }, []);

  const fetchTechSheets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tech-sheets');
      const data = await response.json();
      setSheets(data);
    } catch (error) {
      console.error('Error fetching tech sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      const payload = {
        ...formData,
        uploaded_by: localStorage.getItem('userId') || 'system',
      };

      await fetch('http://localhost:5000/api/tech-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Reset form
      setFormData({ name: '', ministry_code: '', description: '' });
      setIsAddingNew(false);

      // Refresh list
      await fetchTechSheets();
    } catch (error) {
      console.error('Error saving tech sheet:', error);
      alert('Error al guardar la ficha técnica');
    }
  };

  const handleAnalyze = async (id: number) => {
    setProcessing(id);
    try {
      const response = await fetch(`http://localhost:5000/api/tech-sheets/${id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      alert('✅ Ficha técnica analizada con éxito. El sistema generó automáticamente:\n- Competencias\n- KPIs\n- Preguntas de evaluación\n- Prompts para el Chat IA');
      await fetchTechSheets();
    } catch (error) {
      console.error('Error analyzing tech sheet:', error);
      alert('Error al analizar la ficha técnica');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta ficha técnica?')) return;

    try {
      await fetch(`http://localhost:5000/api/tech-sheets/${id}`, {
        method: 'DELETE',
      });
      await fetchTechSheets();
    } catch (error) {
      console.error('Error deleting tech sheet:', error);
      alert('Error al eliminar la ficha técnica');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', ministry_code: '', description: '' });
    setIsAddingNew(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando fichas técnicas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fichas Técnicas (Ministerio)</h2>
          <p className="text-gray-600 mt-1">Sube fichas del ministerio. El sistema las analiza automáticamente con IA</p>
        </div>
        {!isAddingNew && (
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Ficha
          </Button>
        )}
      </div>

      {/* Info box */}
      <Card className="p-4 bg-purple-50 border border-purple-200">
        <div className="flex gap-3">
          <Zap className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-purple-900">✨ Procesamiento Automático</p>
            <p className="text-purple-800 mt-1">Cuando subes una ficha técnica, el sistema:</p>
            <ul className="text-purple-800 mt-2 ml-4 space-y-1">
              <li>✓ Analiza competencias requeridas</li>
              <li>✓ Extrae criterios de evaluación (KPIs)</li>
              <li>✓ Genera preguntas de simulación</li>
              <li>✓ Crea prompts para el Chat IA</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Form para agregar */}
      {isAddingNew && (
        <Card className="p-6 border border-blue-200 bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">Subir Nueva Ficha Técnica</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de la Ficha</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Ficha Técnica - Asesor de Seguros 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Código del Ministerio</label>
              <Input
                type="text"
                value={formData.ministry_code}
                onChange={(e) => setFormData({ ...formData, ministry_code: e.target.value })}
                placeholder="ej: MIN-2024-SEGUROS-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción o Contenido</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Pega el contenido de la ficha técnica aquí..."
                rows={8}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <FileUp className="w-4 h-4 mr-2" />
                Subir Ficha
              </Button>
              <Button type="button" onClick={handleCancel} variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de fichas */}
      <div className="grid grid-cols-1 gap-4">
        {sheets.map((sheet) => (
          <Card key={sheet.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-semibold text-lg">{sheet.name}</h4>
                    {sheet.ministry_code && (
                      <p className="text-sm text-gray-600">Código: {sheet.ministry_code}</p>
                    )}
                  </div>
                </div>

                {sheet.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{sheet.description}</p>
                )}

                {sheet.processed && sheet.extracted_data && (
                  <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm font-semibold text-green-900">✅ Analizado con IA</p>
                    <div className="text-sm text-green-800 mt-2">
                      {sheet.extracted_data.competencies && (
                        <p>📚 {sheet.extracted_data.competencies.length} competencias identificadas</p>
                      )}
                      {sheet.extracted_data.kpi_requirements && (
                        <p>🎯 {sheet.extracted_data.kpi_requirements.length} criterios de evaluación</p>
                      )}
                      {sheet.extracted_data.suggested_questions && (
                        <p>❓ {sheet.extracted_data.suggested_questions.length} preguntas generadas</p>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  Creado: {new Date(sheet.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                {!sheet.processed && (
                  <Button
                    onClick={() => handleAnalyze(sheet.id)}
                    disabled={processing === sheet.id}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {processing === sheet.id ? 'Analizando...' : 'Analizar'}
                  </Button>
                )}

                {sheet.processed && (
                  <Button disabled className="bg-green-600">
                    <Zap className="w-4 h-4 mr-2" />
                    Analizado
                  </Button>
                )}

                <Button
                  onClick={() => handleDelete(sheet.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sheets.length === 0 && !isAddingNew && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No hay fichas técnicas. Sube una ficha del ministerio para empezar.</p>
        </Card>
      )}

      {/* Detail modal preview */}
      {selectedSheet && selectedSheet.processed && selectedSheet.extracted_data && (
        <Card className="p-6 border-2 border-purple-600">
          <h3 className="text-xl font-bold mb-4">Datos Extraídos: {selectedSheet.name}</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">📚 Competencias</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {selectedSheet.extracted_data.competencies?.map((comp: string, i: number) => (
                  <li key={i}>{comp}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">🎯 Criterios de Evaluación (KPIs)</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {selectedSheet.extracted_data.kpi_requirements?.map((kpi: any, i: number) => (
                  <li key={i}>{kpi.name} (Umbral: {kpi.threshold}%)</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">❓ Preguntas Generadas</h4>
              <ol className="list-decimal list-inside text-sm text-gray-700">
                {selectedSheet.extracted_data.suggested_questions?.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>
          </div>

          <Button onClick={() => setSelectedSheet(null)} className="mt-4">
            Cerrar
          </Button>
        </Card>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Plus, Zap, FileUp, Paperclip, Link, Settings, Check } from 'lucide-react';
import { ConfigureTechSheetModal } from './ConfigureTechSheetModal';

interface TechSheet {
  id: number;
  name: string;
  course_id: string | null;
  ministry_code: string;
  description: string;
  file_url: string | null;
  processed: boolean;
  extracted_data: any;
  created_at: string;
  updated_at: string;
  competencies?: any;
  kpi_requirements?: any;
}

interface Course {
  id: string;
  course_id: string;
  title: string;
}

export function TechSheetsABM() {
  const [sheets, setSheets] = useState<TechSheet[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<TechSheet | null>(null);
  const [uploading, setUploading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configSheetId, setConfigSheetId] = useState<number | null>(null);
  const [configCourseId, setConfigCourseId] = useState<string | null>(null);
  const [editingSheetId, setEditingSheetId] = useState<number | null>(null);
  const [editingCompetencies, setEditingCompetencies] = useState<string>('');
  const [editingKpis, setEditingKpis] = useState<string>('');
  const [completionMode, setCompletionMode] = useState<'auto' | 'manual'>('auto');
  const [editingCourseId, setEditingCourseId] = useState<string>('');
  const [editingFileUrl, setEditingFileUrl] = useState<string>('');
  const [editingFileName, setEditingFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editingFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    ministry_code: '',
    description: '',
    file_url: '',
    file_name: '',
  });

  // Fetch tech sheets and courses
  useEffect(() => {
    fetchTechSheets();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses');
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchTechSheets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tech-sheets');
      const data = await response.json();
      setSheets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tech sheets:', error);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store file name for display; encode as base64 data URL for local preview
    // In production, this would upload to S3/storage and return a URL
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setFormData(prev => ({ ...prev, file_url: dataUrl, file_name: file.name }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      alert('Error al leer el archivo');
    }
  };

  const handleEditingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setEditingFileUrl(dataUrl);
        setEditingFileName(file.name);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      alert('Error al leer el archivo');
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
        name: formData.name,
        course_id: formData.course_id || null,
        ministry_code: formData.ministry_code,
        description: formData.description,
        file_url: formData.file_url || null,
        uploaded_by: localStorage.getItem('userId') || 'system',
      };

      const response = await fetch('http://localhost:5000/api/tech-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      const result = await response.json();
      console.log('✅ Ficha técnica creada:', result);

      // Reset form
      setFormData({ name: '', course_id: '', ministry_code: '', description: '', file_url: '', file_name: '' });
      setIsAddingNew(false);

      // Refresh list
      await fetchTechSheets();
      alert('✅ Ficha técnica guardada exitosamente');
    } catch (error) {
      console.error('Error saving tech sheet:', error);
      alert(`Error al guardar la ficha técnica: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleAnalyze = async (id: number) => {
    // Buscar la ficha técnica a analizar
    const sheet = sheets.find(s => s.id === id);
    if (!sheet) return;

    // ❌ VALIDACIÓN 1: Curso es obligatorio
    if (!sheet.course_id) {
      alert('❌ Error: Debes asociar la ficha técnica a un curso antes de analizarla.\n\nPor favor, edita la ficha y selecciona un curso.');
      return;
    }

    // ❌ VALIDACIÓN 2: Al menos 1 contenido (archivo, URL o descripción)
    const hasContent = sheet.file_url || sheet.description;
    if (!hasContent) {
      alert('❌ Error: La ficha técnica debe tener al menos uno de estos elementos:\n- Archivo adjunto (PDF/DOC)\n- URL del documento\n- Descripción/Contenido\n\nPor favor, agrega contenido antes de analizar.');
      return;
    }

    setProcessing(id);
    try {
      const response = await fetch(`http://localhost:5000/api/tech-sheets/${id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al analizar');
      }
      
      const data = await response.json();
      alert('✅ Ficha técnica analizada con éxito. El sistema generó automáticamente:\n- Competencias identificadas\n- KPIs extraídos\n- Preguntas de evaluación\n- Prompts para el Chat IA');
      await fetchTechSheets();
    } catch (error) {
      console.error('Error analyzing tech sheet:', error);
      alert(`❌ Error al analizar la ficha técnica: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

  const handleCompleteSheet = async (id: number) => {
    const sheet = sheets.find(s => s.id === id);
    if (!sheet) return;

    // Validar que tenga curso asignado
    const finalCourseId = editingCourseId || sheet.course_id;
    if (!finalCourseId) {
      alert('❌ Debes seleccionar un curso. Es obligatorio.');
      return;
    }

    // Parsear competencias y KPIs
    let competencies: string[] = [];
    let kpis: string[] = [];

    if (editingCompetencies.trim()) {
      competencies = editingCompetencies
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    if (editingKpis.trim()) {
      kpis = editingKpis
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    if (competencies.length === 0 && kpis.length === 0) {
      alert('❌ Debes agregar al menos una competencia o un KPI');
      return;
    }

    try {
      const updatedSheet = {
        ...sheet,
        course_id: finalCourseId,
        file_url: editingFileUrl || sheet.file_url,
        competencies: competencies.length > 0 ? competencies : sheet.competencies,
        kpi_requirements: kpis.length > 0 ? kpis : sheet.kpi_requirements,
      };

      const response = await fetch(`http://localhost:5000/api/tech-sheets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSheet),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar');
      }

      setEditingSheetId(null);
      setEditingCompetencies('');
      setEditingKpis('');
      setEditingCourseId('');
      setEditingFileUrl('');
      setEditingFileName('');
      setCompletionMode('auto');
      await fetchTechSheets();
      alert('✅ Ficha técnica completada. Ahora puedes analizar con IA.');
    } catch (error) {
      console.error('Error updating tech sheet:', error);
      alert(`❌ Error al completar la ficha: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', course_id: '', ministry_code: '', description: '', file_url: '', file_name: '' });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de la Ficha *</label>
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Asociar al Curso <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.course_id || ''}
                onValueChange={(val) => setFormData({ ...formData, course_id: val })}
              >
                <SelectTrigger className={formData.course_id ? '' : 'border-red-500 border-2'}>
                  <SelectValue placeholder="— Selecciona un curso (OBLIGATORIO) —" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No hay cursos disponibles. Crea un curso primero.</div>
                  ) : (
                    courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-red-500 mt-1">⚠️ OBLIGATORIO: Toda ficha técnica debe estar asociada a un curso. Un curso puede no tener ficha, pero una ficha siempre debe tener curso.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Paperclip className="w-4 h-4 inline mr-1" />
                Adjuntar Ficha del Ministerio (PDF)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {uploading ? 'Cargando...' : formData.file_name ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                </Button>
                {formData.file_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-700 flex items-center gap-1">
                      ✅ {formData.file_name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, file_url: '', file_name: '' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                      title="Eliminar archivo"
                    >
                      ✕
                    </Button>
                  </div>
                )}
                {!formData.file_name && (
                  <span className="text-xs text-gray-400">PDF, DOC o DOCX</span>
                )}
              </div>
              {/* O ingresar URL manual */}
              <div className="mt-2 flex gap-2 items-center">
                <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <Input
                  type="url"
                  value={formData.file_url.startsWith('data:') ? '' : formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value, file_name: '' })}
                  placeholder="O pegá la URL del documento (Google Drive, SharePoint, etc.)"
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contenido / Descripción de la Ficha</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Pega el contenido de la ficha técnica aquí (competencias, KPIs, criterios de evaluación...)..."
                rows={8}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={!formData.course_id}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!formData.course_id ? 'Debes seleccionar un curso primero' : 'Subir la ficha técnica'}
              >
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
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-0.5">
                      {sheet.ministry_code && <span>📋 {sheet.ministry_code}</span>}
                      {sheet.course_id && (
                        <span className="text-blue-700 font-medium">
                          🎓 {courses.find(c => c.id === sheet.course_id)?.title || sheet.course_id}
                        </span>
                      )}
                      {!sheet.course_id && <span className="text-gray-400 italic">Sin curso asociado</span>}
                      {sheet.file_url && (
                        <a
                          href={sheet.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 underline flex items-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <Paperclip className="w-3 h-3" /> Ver archivo adjunto
                        </a>
                      )}
                    </div>
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

              <div className="flex gap-2 ml-4 flex-wrap">
                {!sheet.processed && !sheet.competencies && !sheet.kpi_requirements && (
                  <Button
                    onClick={() => {
                      setEditingSheetId(sheet.id);
                      setEditingCompetencies('');
                      setEditingKpis('');
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Completar
                  </Button>
                )}

                {!sheet.processed && (sheet.competencies || sheet.kpi_requirements) && (
                  <Button
                    onClick={() => handleAnalyze(sheet.id)}
                    disabled={processing === sheet.id || !sheet.course_id}
                    title={!sheet.course_id ? 'Asocia un curso primero' : 'Analizar esta ficha técnica'}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {processing === sheet.id ? 'Analizando...' : 'Analizar'}
                  </Button>
                )}

                {!sheet.processed && !sheet.competencies && !sheet.kpi_requirements && (
                  <Button
                    onClick={() => handleAnalyze(sheet.id)}
                    disabled={processing === sheet.id || !sheet.course_id || (!sheet.file_url && !sheet.description)}
                    title={!sheet.course_id ? 'Asocia un curso primero' : (!sheet.file_url && !sheet.description) ? 'Agrega archivo, URL o descripción' : 'Analizar esta ficha técnica'}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {processing === sheet.id ? 'Analizando...' : 'Analizar'}
                  </Button>
                )}

                {sheet.processed && (
                  <>
                    <Button disabled className="bg-green-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Analizado
                    </Button>
                    {sheet.course_id && (
                      <Button
                        onClick={() => {
                          setConfigSheetId(sheet.id);
                          setConfigCourseId(sheet.course_id);
                          setConfigModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    )}
                  </>
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

      {/* Modal para completar fichas inválidas - CON TODO */}
      {editingSheetId && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Completar Ficha Técnica</h3>
              <button 
                onClick={() => {
                  setEditingSheetId(null);
                  setEditingCompetencies('');
                  setEditingKpis('');
                  setEditingCourseId('');
                  setEditingFileUrl('');
                  setEditingFileName('');
                  setCompletionMode('auto');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* CAMPO 1: ASOCIAR AL CURSO */}
            <div className="mb-6 pb-6 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asociar al Curso <span className="text-red-500">*</span>
              </label>
              <Select
                value={editingCourseId || sheets.find(s => s.id === editingSheetId)?.course_id || ''}
                onValueChange={(val) => setEditingCourseId(val)}
              >
                <SelectTrigger className={(editingCourseId || sheets.find(s => s.id === editingSheetId)?.course_id) ? '' : 'border-red-500 border-2'}>
                  <SelectValue placeholder="— Selecciona un curso (OBLIGATORIO) —" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No hay cursos disponibles. Crea un curso primero.</div>
                  ) : (
                    courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-red-500 mt-1">⚠️ OBLIGATORIO: Toda ficha técnica debe estar asociada a un curso.</p>
            </div>

            {/* CAMPO 2: ADJUNTAR ARCHIVO */}
            <div className="mb-6 pb-6 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Paperclip className="w-4 h-4 inline mr-1" />
                Adjuntar Ficha del Ministerio (PDF, DOC, DOCX)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  ref={editingFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleEditingFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => editingFileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {uploading ? 'Cargando...' : editingFileName ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                </Button>
                {editingFileName && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-700 flex items-center gap-1">
                      ✅ {editingFileName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFileUrl('');
                        setEditingFileName('');
                        if (editingFileInputRef.current) editingFileInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                      title="Eliminar archivo"
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Sube un archivo para que la IA lo analice automáticamente y extraiga competencias y KPIs.</p>
            </div>

            {/* OPCIÓN 1: ANÁLISIS AUTOMÁTICO - Si tiene archivo */}
            {(() => {
              const sheet = sheets.find(s => s.id === editingSheetId);
              const hasFile = editingFileUrl || (sheet?.file_url && sheet.file_url.length > 0);
              
              return hasFile ? (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">🤖 Opción 1: Análisis Automático (IA)</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        Tu ficha tiene un archivo adjunto. La IA puede analizar automáticamente el contenido y extraer competencias y KPIs.
                      </p>
                      <Button
                        onClick={async () => {
                          const finalCourseId = editingCourseId || sheet?.course_id;
                          if (!finalCourseId) {
                            alert('❌ Debes seleccionar un curso primero');
                            return;
                          }
                          if (!sheet) return;
                          setProcessing(sheet.id);
                          try {
                            // Primero actualizar con el curso
                            const updatedSheet = {
                              ...sheet,
                              course_id: finalCourseId,
                              file_url: editingFileUrl || sheet.file_url,
                            };
                            
                            const updateResponse = await fetch(`http://localhost:5000/api/tech-sheets/${sheet.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(updatedSheet),
                            });
                            
                            if (!updateResponse.ok) {
                              const error = await updateResponse.json();
                              throw new Error(error.error || 'Error al actualizar');
                            }
                            
                            // Luego analizar
                            const response = await fetch(`http://localhost:5000/api/tech-sheets/${sheet.id}/analyze`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || 'Error al analizar');
                            }
                            
                            alert('✅ Ficha analizada con éxito por IA. Se generaron automáticamente competencias, KPIs y preguntas.');
                            setEditingSheetId(null);
                            setEditingCompetencies('');
                            setEditingKpis('');
                            setEditingCourseId('');
                            setEditingFileUrl('');
                            setEditingFileName('');
                            setCompletionMode('auto');
                            await fetchTechSheets();
                          } catch (error) {
                            alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
                          } finally {
                            setProcessing(null);
                          }
                        }}
                        disabled={processing === sheet?.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {processing === sheet?.id ? 'Analizando...' : 'Analizar Archivo Automáticamente'}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">O si prefieres, rellena manualmente:</p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* OPCIÓN 2: COMPLETAR MANUALMENTE */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">✍️ Opción 2: Completar Manualmente</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competencias <span className="text-red-500">*</span> (separadas por coma)
                </label>
                <Textarea
                  value={editingCompetencies}
                  onChange={(e) => setEditingCompetencies(e.target.value)}
                  placeholder="Ej: Comunicación, Trabajo en equipo, Pensamiento crítico"
                  rows={3}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Escribe los nombres de las competencias separadas por comas. Se procesarán automáticamente.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Criterios de Evaluación / KPIs <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={editingKpis}
                  onChange={(e) => setEditingKpis(e.target.value)}
                  placeholder="Ej: Participación activa (80%), Entregas a tiempo (90%), Calidad del trabajo"
                  rows={3}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Escribe los criterios de evaluación. Al menos uno de los dos campos es obligatorio.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => handleCompleteSheet(editingSheetId)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
              <Button
                onClick={() => {
                  setEditingSheetId(null);
                  setEditingCompetencies('');
                  setEditingKpis('');
                  setEditingCourseId('');
                  setEditingFileUrl('');
                  setEditingFileName('');
                  setCompletionMode('auto');
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modal para configurar ficha técnica */}
      {configSheetId && configCourseId && (
        <ConfigureTechSheetModal
          techSheetId={configSheetId}
          courseId={configCourseId}
          isOpen={configModalOpen}
          onClose={() => {
            setConfigModalOpen(false);
            setConfigSheetId(null);
            setConfigCourseId(null);
          }}
        />
      )}
    </div>
  );
}

'use client'
import { toast } from 'sonner';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Plus, Zap, FileUp, Paperclip, Link, Settings, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { ConfigureTechSheetModal } from './ConfigureTechSheetModal';
import { API_BASE, authFetch } from '@/lib/api';
import { useAnalysisProgress, PipelineStatus, PipelineOutput } from '@/hooks/useAnalysisProgress';

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
  pipeline_status?: PipelineStatus;
  pipeline_output?: PipelineOutput | null;
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
  const [selectedSheet, setSelectedSheet] = useState<TechSheet | null>(null);
  const [uploading, setUploading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configSheetId, setConfigSheetId] = useState<number | null>(null);
  const [configCourseId, setConfigCourseId] = useState<string | null>(null);
  const [editingSheetId, setEditingSheetId] = useState<number | null>(null);
  const [editingCompetencies, setEditingCompetencies] = useState<string>('');
  const [editingKpis, setEditingKpis] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pipeline analysis tracking
  const [analyzingSheetId, setAnalyzingSheetId] = useState<number | null>(null);
  const { status: pollStatus, output: pollOutput, isLoading: pollLoading, error: pollError } =
    useAnalysisProgress(analyzingSheetId, analyzingSheetId !== null);

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

  // Refresh list and clear analyzing state when pipeline reaches terminal status
  useEffect(() => {
    if (pollStatus === 'completed') {
      fetchTechSheets();
      setAnalyzingSheetId(null);
      alert('Analisis completado exitosamente');
    } else if (pollStatus === 'failed' || pollStatus === 'validation_rejected') {
      setAnalyzingSheetId(null);
    }
  }, [pollStatus]);

  const fetchCourses = async () => {
    try {
      const response = await authFetch(`${API_BASE}/courses`);
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchTechSheets = async () => {
    try {
      const response = await authFetch(`${API_BASE}/tech-sheets`);
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

    // ✅ NUEVO: Validar tipo y tamaño en cliente
    const allowedTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'image/png', 'image/jpeg', 'text/plain'];

    if (!allowedTypes.includes(file.type)) {
      toast.error(`❌ Tipo de archivo no permitido: ${file.type}\n\nSoportados: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, TXT`);
      e.target.value = '';
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`❌ Archivo demasiado grande: ${(file.size / (1024 * 1024)).toFixed(2)} MB\n\nMáximo: 50 MB`);
      e.target.value = '';
      return;
    }

    // ✅ NUEVO: Solo almacenar nombre, NO base64
    setFormData(prev => ({ ...prev, file_name: file.name }));
    console.log(`✅ Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
  };

  const handleEditingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error('Error al leer el archivo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación: nombre es obligatorio
    const trimmedName = formData.name?.trim();
    if (!trimmedName) {
      toast.error('❌ El nombre de la ficha es obligatorio');
      return;
    }

    // Validación: al menos un campo de contenido
    if (!formData.course_id && !formData.description && !formData.file_url) {
      toast.error('❌ Debes rellenar: Curso (obligatorio) O al menos Descripción/Archivo');
      return;
    }

    try {
      const hasFile = fileInputRef.current?.files?.[0];
      let fileUrl: string | null = formData.file_url || null;

      // Step 1: Upload file if present
      if (hasFile) {
        const formDataObj = new FormData();
        formDataObj.append('file', hasFile);
        formDataObj.append('uploaded_by_id', JSON.parse(localStorage.getItem('user') || '{}').id || 'system');
        formDataObj.append('upload_type', 'tech_sheet');

        const uploadResponse = await authFetch(`${API_BASE}/files/upload`, {
          method: 'POST',
          body: formDataObj,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          const message = error.message || error.error || 'Error al subir archivo';
          throw new Error(message);
        }

        const uploadResult = await uploadResponse.json();
        fileUrl = uploadResult.file_url;
      }

      // Step 2: Create tech sheet with file_url
      const payload = {
        name: trimmedName,
        course_id: formData.course_id || undefined,
        ministry_code: formData.ministry_code || undefined,
        description: formData.description || undefined,
        file_url: fileUrl || undefined,
        uploaded_by: JSON.parse(localStorage.getItem('user') || '{}').id || 'system',
      };

      const createResponse = await authFetch(`${API_BASE}/tech-sheets`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        const message = error.message || error.error || 'Error al guardar';
        throw new Error(message);
      }

      const result = await createResponse.json();
      console.log('✅ Ficha técnica creada:', result);

      // Reset form
      setFormData({ name: '', course_id: '', ministry_code: '', description: '', file_url: '', file_name: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsAddingNew(false);

      // Refresh list
      await fetchTechSheets();
      toast.success('✅ Ficha técnica guardada exitosamente');
    } catch (error) {
      console.error('Error saving tech sheet:', error);
      toast.error(`❌ Error al guardar la ficha técnica: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleAnalyze = async (id: number) => {
    const sheet = sheets.find(s => s.id === id);
    if (!sheet) return;

    // Validation: course is required
    if (!sheet.course_id) {
      toast.error('❌ Error: Debes asociar la ficha técnica a un curso antes de analizarla.\n\nPor favor, edita la ficha y selecciona un curso.');
      return;
    }

    // Validation: at least 1 content
    const hasContent = sheet.file_url || sheet.description;
    if (!hasContent) {
      toast.error('❌ Error: La ficha técnica debe tener al menos uno de estos elementos:\n- Archivo adjunto (PDF/DOC)\n- URL del documento\n- Descripción/Contenido\n\nPor favor, agrega contenido antes de analizar.');
      return;
    }

    try {
      const response = await authFetch(`${API_BASE}/tech-sheets/${id}/analyze`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        const message = error.message || error.error || 'Error al analizar';
        throw new Error(message);
      }

      // Start polling for progress
      setAnalyzingSheetId(id);
    } catch (error) {
      console.error('Error analyzing tech sheet:', error);
      toast.error(`❌ Error al analizar la ficha técnica: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta ficha técnica?')) return;

    try {
      await authFetch(`${API_BASE}/tech-sheets/${id}`, {
        method: 'DELETE',
      });
      await fetchTechSheets();
    } catch (error) {
      console.error('Error deleting tech sheet:', error);
      toast.error('Error al eliminar la ficha técnica');
    }
  };

  const handleCompleteSheet = async (id: number) => {
    const sheet = sheets.find(s => s.id === id);
    if (!sheet) return;

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
      toast.error('❌ Debes agregar al menos una competencia o un KPI');
      return;
    }

    try {
      const updatedSheet = {
        name: sheet.name,
        description: sheet.description || undefined,
        ministry_code: sheet.ministry_code || undefined,
        context_scenario: sheet.context_scenario || undefined,
        competencies: competencies.length > 0 ? competencies : sheet.competencies,
        kpi_requirements: kpis.length > 0 ? kpis : sheet.kpi_requirements,
      };

      const response = await authFetch(`${API_BASE}/tech-sheets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedSheet),
      });

      if (!response.ok) {
        const error = await response.json();
        const message = error.message || error.error || 'Error al actualizar';
        throw new Error(message);
      }

      setEditingSheetId(null);
      setEditingCompetencies('');
      setEditingKpis('');
      await fetchTechSheets();
      toast.success('✅ Ficha técnica completada exitosamente.');
    } catch (error) {
      console.error('Error updating tech sheet:', error);
      toast.error(`❌ Error al completar la ficha: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

                {/* Analizar button — pipeline-aware */}
                {!sheet.processed && sheet.pipeline_status !== 'completed' && (
                  <Button
                    onClick={() => handleAnalyze(sheet.id)}
                    disabled={
                      analyzingSheetId === sheet.id ||
                      sheet.pipeline_status === 'running' ||
                      sheet.pipeline_status === 'completed' ||
                      !sheet.course_id
                    }
                    title={
                      !sheet.course_id
                        ? 'Asocia un curso primero'
                        : sheet.pipeline_status === 'running'
                        ? 'Analisis en progreso...'
                        : sheet.pipeline_status === 'completed'
                        ? 'Ya fue analizada'
                        : 'Analizar esta ficha tecnica'
                    }
                    className={
                      sheet.pipeline_status === 'completed'
                        ? 'bg-green-600'
                        : sheet.pipeline_status === 'running' || analyzingSheetId === sheet.id
                        ? 'bg-yellow-600'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {sheet.pipeline_status === 'running' || analyzingSheetId === sheet.id
                      ? 'Analizando...'
                      : sheet.pipeline_status === 'completed'
                      ? 'Analizado'
                      : 'Analizar'}
                  </Button>
                )}

                {sheet.pipeline_status === 'completed' && (
                  <>
                    <Button disabled className="bg-green-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Analizado
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('¿Re-analizar esta ficha? Se sobrescribirán los resultados existentes.')) {
                          handleAnalyze(sheet.id);
                        }
                      }}
                      disabled={analyzingSheetId === sheet.id}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-analizar
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

            {/* Pipeline progress indicator */}
            {analyzingSheetId === sheet.id && (
              <PipelineProgress status={pollStatus} output={pollOutput} error={pollError} />
            )}

            {/* Show progress for sheets that have pipeline status from DB */}
            {analyzingSheetId !== sheet.id && sheet.pipeline_status && sheet.pipeline_status !== 'idle' && sheet.pipeline_status !== 'completed' && (
              <PipelineProgressStatus status={sheet.pipeline_status} output={sheet.pipeline_output} />
            )}

            {/* Validation rejected banner */}
            {sheet.pipeline_status === 'validation_rejected' && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validacion Rechazada</AlertTitle>
                <AlertDescription>
                  {sheet.pipeline_output && typeof sheet.pipeline_output === 'object' && 'error_message' in sheet.pipeline_output
                    ? String((sheet.pipeline_output as PipelineOutput).error_message)
                    : 'El documento no fue validado como ficha tecnica del ministerio.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Failed status banner */}
            {sheet.pipeline_status === 'failed' && (
              <>
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error en el Analisis</AlertTitle>
                  <AlertDescription>
                    {sheet.pipeline_output && typeof sheet.pipeline_output === 'object' && 'error_message' in sheet.pipeline_output
                      ? String((sheet.pipeline_output as PipelineOutput).error_message)
                      : 'Ocurrio un error durante el analisis. Intenta nuevamente.'}
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => {
                    if (confirm('¿Reintentar el análisis?')) {
                      handleAnalyze(sheet.id);
                    }
                  }}
                  disabled={analyzingSheetId === sheet.id}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar análisis
                </Button>
              </>
            )}

            {/* Render markdown output for completed steps */}
            {sheet.pipeline_output && typeof sheet.pipeline_output === 'object' && (
              <StepOutput output={sheet.pipeline_output as PipelineOutput} />
            )}
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

      {/* Modal para completar fichas - OPCIÓN MANUAL SIMPLE */}
      {editingSheetId && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Completar Ficha Técnica</h3>
              <button
                onClick={() => {
                  setEditingSheetId(null);
                  setEditingCompetencies('');
                  setEditingKpis('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competencias (separadas por coma)
                </label>
                <Textarea
                  value={editingCompetencies}
                  onChange={(e) => setEditingCompetencies(e.target.value)}
                  placeholder="Ej: Comunicación, Trabajo en equipo, Pensamiento crítico"
                  rows={3}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Escribe los nombres de las competencias separadas por comas.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Criterios de Evaluación / KPIs (separados por coma)
                </label>
                <Textarea
                  value={editingKpis}
                  onChange={(e) => setEditingKpis(e.target.value)}
                  placeholder="Ej: Participación activa (80%), Entregas a tiempo (90%), Calidad del trabajo"
                  rows={3}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Escribe los criterios de evaluación.
                </p>
              </div>

              <p className="text-xs text-orange-600 font-medium">
                ⚠️ Al menos uno de los dos campos debe tener contenido.
              </p>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={() => handleCompleteSheet(editingSheetId)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button
                onClick={() => {
                  setEditingSheetId(null);
                  setEditingCompetencies('');
                  setEditingKpis('');
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

// ── Pipeline Progress Components ───────────────────────────────────

const PIPELINE_STEPS = [
  { key: 'step_1', label: 'Conversion', field: 'step_1_markdown' as const },
  { key: 'step_2', label: 'Validacion', field: 'step_2_validation' as const },
  { key: 'step_3', label: 'Competencias', field: 'step_3_competencies' as const },
  { key: 'step_4', label: 'KPIs', field: 'step_4_kpis' as const },
  { key: 'step_5', label: 'Preguntas', field: 'step_5_questions' as const },
  { key: 'step_6', label: 'Simulacion', field: 'step_6_simulation_prompt' as const },
  { key: 'step_7', label: 'Prompt de Evaluación', field: 'step_7_evaluation_prompt' as const },
  { key: 'step_8', label: 'Prompt de Coaching', field: 'step_8_coaching_prompt' as const },
];

function getStepStatus(
  pipelineStatus: PipelineStatus,
  stepIndex: number,
  output: PipelineOutput | null,
): 'pending' | 'running' | 'completed' | 'failed' {
  if (pipelineStatus === 'failed') {
    if (output?.error_step === stepIndex + 1) return 'failed';
    // Steps before the failed step are completed
    if (output?.error_step && stepIndex + 1 < output.error_step) return 'completed';
    return 'pending';
  }

  if (pipelineStatus === 'validation_rejected') {
    // Only step 2 (validation) matters
    if (stepIndex === 1) return 'failed';
    if (stepIndex === 0) return 'completed';
    return 'pending';
  }

  if (!pipelineStatus || pipelineStatus === 'idle') return 'pending';

  if (pipelineStatus === 'completed') return 'completed';

  // Running states: 'running', 'step_1' .. 'step_8'
  if (pipelineStatus === 'running') return stepIndex === 0 ? 'running' : 'pending';

  // Extract step number from 'step_N'
  const match = pipelineStatus.match(/^step_(\d+)$/);
  if (match) {
    const currentStep = parseInt(match[1], 10);
    const stepNum = stepIndex + 1;
    if (stepNum < currentStep) return 'completed';
    if (stepNum === currentStep) return 'running';
    return 'pending';
  }

  return 'pending';
}

function StepIcon({ status }: { status: 'pending' | 'running' | 'completed' | 'failed' }) {
  switch (status) {
    case 'completed':
      return <span className="text-green-600">✅</span>;
    case 'running':
      return <span className="text-blue-600 animate-spin">🔄</span>;
    case 'failed':
      return <span className="text-red-600">❌</span>;
    default:
      return <span className="text-gray-400">⏳</span>;
  }
}

/** Live progress indicator shown while polling is active */
function PipelineProgress({
  status,
  output,
  error,
}: {
  status: PipelineStatus;
  output: PipelineOutput | null;
  error: string | null;
}) {
  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-sm font-semibold text-blue-900">Analisis en progreso...</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PIPELINE_STEPS.map((step, i) => {
          const stepStatus = getStepStatus(status, i, output);
          return (
            <div key={step.key} className="flex items-center gap-1.5 text-xs">
              <StepIcon status={stepStatus} />
              <span className={stepStatus === 'completed' ? 'text-green-700' : stepStatus === 'running' ? 'text-blue-700 font-medium' : stepStatus === 'failed' ? 'text-red-700' : 'text-gray-500'}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-2">Error: {error}</p>
      )}
    </div>
  );
}

/** Static progress display for sheets with pipeline_status from DB */
function PipelineProgressStatus({
  status,
  output,
}: {
  status: PipelineStatus;
  output: PipelineOutput | null | unknown;
}) {
  const pipelineOutput = (output && typeof output === 'object' ? output : null) as PipelineOutput | null;
  return (
    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-900">Estado del pipeline</span>
        <Badge variant={status === 'completed' ? 'default' : status === 'failed' || status === 'validation_rejected' ? 'destructive' : 'secondary'}>
          {status}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PIPELINE_STEPS.map((step, i) => {
          const stepStatus = getStepStatus(status, i, pipelineOutput);
          return (
            <div key={step.key} className="flex items-center gap-1.5 text-xs">
              <StepIcon status={stepStatus} />
              <span className={stepStatus === 'completed' ? 'text-green-700' : stepStatus === 'failed' ? 'text-red-700' : 'text-gray-500'}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Render markdown output for completed steps */
function StepOutput({ output }: { output: PipelineOutput }) {
  const stepsWithOutput = PIPELINE_STEPS.filter(
    (step) => output[step.field],
  );

  if (stepsWithOutput.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {stepsWithOutput.map((step) => (
        <details key={step.key} className="group">
          <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1">
            <span>📄 {step.label}</span>
            <span className="text-gray-400 group-open:rotate-90 transition-transform">▶</span>
          </summary>
          <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded text-xs max-h-48 overflow-auto">
            <pre className="whitespace-pre-wrap font-mono text-gray-700">
              {String(output[step.field])}
            </pre>
          </div>
        </details>
      ))}
    </div>
  );
}

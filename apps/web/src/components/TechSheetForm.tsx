'use client'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE, authFetch } from '@/lib/api';
import { FileText, Link, Paperclip, Plus } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

interface Course {
  id: string;
  course_id: string;
  title: string;
}

interface TechSheetFormProps {
  courses: Course[];
  onSubmit: () => void;
}

export function TechSheetForm({ courses, onSubmit }: TechSheetFormProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    ministry_code: '',
    description: '',
    file_url: '',
    file_name: '',
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'image/png', 'image/jpeg', 'text/plain'];

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Tipo de archivo no permitido: ${file.type}\n\nSoportados: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, TXT`);
      e.target.value = '';
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Archivo demasiado grande: ${(file.size / (1024 * 1024)).toFixed(2)} MB\n\nMaximo: 50 MB`);
      e.target.value = '';
      return;
    }

    setFormData(prev => ({ ...prev, file_name: file.name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name?.trim();
    if (!trimmedName) {
      toast.error('El nombre de la ficha es obligatorio');
      return;
    }

    if (!formData.course_id && !formData.description && !formData.file_url) {
      toast.error('Debes rellenar: Curso (obligatorio) O al menos Descripcion/Archivo');
      return;
    }

    try {
      const hasFile = fileInputRef.current?.files?.[0];
      let fileUrl: string | null = formData.file_url || null;

      if (hasFile) {
        const formDataObj = new FormData();
        formDataObj.append('file', hasFile);
        formDataObj.append('uploaded_by_id', JSON.parse(sessionStorage.getItem('user') || '{}').id || 'system');
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

      const payload = {
        name: trimmedName,
        course_id: formData.course_id || undefined,
        ministry_code: formData.ministry_code || undefined,
        description: formData.description || undefined,
        file_url: fileUrl || undefined,
        uploaded_by: JSON.parse(sessionStorage.getItem('user') || '{}').id || 'system',
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

      setFormData({ name: '', course_id: '', ministry_code: '', description: '', file_url: '', file_name: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsAddingNew(false);

      await onSubmit();
      toast.success('Ficha tecnica guardada exitosamente');
    } catch (error) {
      console.error('Error saving tech sheet:', error);
      toast.error(`Error al guardar la ficha tecnica: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', course_id: '', ministry_code: '', description: '', file_url: '', file_name: '' });
    setIsAddingNew(false);
  };

  if (!isAddingNew) {
    return (
      <Button
        onClick={() => setIsAddingNew(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nueva Ficha
      </Button>
    );
  }

  return (
    <Card className="p-6 border border-blue-200 bg-blue-50">
      <h3 className="text-lg font-semibold mb-4">Subir Nueva Ficha Tecnica</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre de la Ficha *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ej: Ficha Tecnica - Asesor de Seguros 2024"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Codigo del Ministerio</label>
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
              <SelectValue placeholder="-- Selecciona un curso (OBLIGATORIO) --" />
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
          <p className="text-xs text-red-500 mt-1">OBLIGATORIO: Toda ficha tecnica debe estar asociada a un curso.</p>
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
              <FileText className="w-4 h-4 mr-2" />
              {uploading ? 'Cargando...' : formData.file_name ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
            </Button>
            {formData.file_name && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-700 flex items-center gap-1">
                  {formData.file_name}
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
                  X
                </Button>
              </div>
            )}
            {!formData.file_name && (
              <span className="text-xs text-gray-400">PDF, DOC o DOCX</span>
            )}
          </div>
          <div className="mt-2 flex gap-2 items-center">
            <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Input
              type="url"
              value={formData.file_url.startsWith('data:') ? '' : formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value, file_name: '' })}
              placeholder="O pega la URL del documento (Google Drive, SharePoint, etc.)"
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contenido / Descripcion de la Ficha</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Pega el contenido de la ficha tecnica aqui (competencias, KPIs, criterios de evaluacion...)..."
            rows={8}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={!formData.course_id}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!formData.course_id ? 'Debes seleccionar un curso primero' : 'Subir la ficha tecnica'}
          >
            <FileText className="w-4 h-4 mr-2" />
            Subir Ficha
          </Button>
          <Button type="button" onClick={handleCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

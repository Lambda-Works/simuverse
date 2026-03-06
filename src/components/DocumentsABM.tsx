import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, Edit2, Plus, FileText } from 'lucide-react';

interface Document {
  id: number;
  course_id: string;
  document_name: string;
  document_type: string;
  document_content: string;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
}

export function DocumentsABM() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    course_id: '',
    document_name: '',
    document_type: 'case',
    document_content: '',
  });

  // Fetch data
  useEffect(() => {
    fetchDocuments();
    fetchCourses();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents');
      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses');
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.course_id || !formData.document_name) {
      alert('Curso y nombre del documento son obligatorios');
      return;
    }

    try {
      const payload = {
        ...formData,
        uploaded_by: localStorage.getItem('userId') || 'system',
      };

      await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Reset form
      setFormData({
        course_id: '',
        document_name: '',
        document_type: 'case',
        document_content: '',
      });
      setIsAddingNew(false);

      // Refresh list
      await fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error al guardar el documento');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: 'DELETE',
      });
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const handleCancel = () => {
    setFormData({
      course_id: '',
      document_name: '',
      document_type: 'case',
      document_content: '',
    });
    setEditingId(null);
    setIsAddingNew(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando documentos...</div>;
  }

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  const typeLabels: Record<string, string> = {
    case: '📋 Caso',
    contract: '📜 Contrato',
    policy: '📋 Política',
    legal: '⚖️ Legal',
    procedure: '🔄 Procedimiento',
    other: '📄 Otro',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Documentos</h2>
          <p className="text-gray-600 mt-1">Carga documentos para que el Chat IA los use como base de conocimiento</p>
        </div>
        {!isAddingNew && (
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Documento
          </Button>
        )}
      </div>

      {/* Form para agregar */}
      {isAddingNew && (
        <Card className="p-6 border border-blue-200 bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">Nuevo Documento</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Curso</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">-- Selecciona un curso --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nombre del Documento</label>
              <Input
                type="text"
                value={formData.document_name}
                onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                placeholder="ej: Contrato Marco 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
              <select
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="case">📋 Caso de Estudio</option>
                <option value="contract">📜 Contrato</option>
                <option value="policy">📋 Política</option>
                <option value="legal">⚖️ Legal</option>
                <option value="procedure">🔄 Procedimiento</option>
                <option value="other">📄 Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contenido</label>
              <Textarea
                value={formData.document_content}
                onChange={(e) => setFormData({ ...formData, document_content: e.target.value })}
                placeholder="Pega el contenido del documento aquí..."
                rows={6}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Guardar Documento
              </Button>
              <Button type="button" onClick={handleCancel} variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de documentos */}
      <div className="grid grid-cols-1 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-lg">{doc.document_name}</h4>
                    <div className="flex gap-3 mt-1 text-sm">
                      <span className="text-gray-600">Tipo: {typeLabels[doc.document_type]}</span>
                      <span className="text-gray-600">Curso: {getCourseName(doc.course_id)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{doc.document_content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Creado: {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  onClick={() => handleDelete(doc.id)}
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

      {documents.length === 0 && !isAddingNew && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No hay documentos. Sube tu primer documento para empezar.</p>
        </Card>
      )}
    </div>
  );
}

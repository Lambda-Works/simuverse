'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, File, FileText, Upload } from 'lucide-react';
import React, { useState } from 'react';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'document' | 'image';
  size: string;
  uploadedAt: Date;
  required?: boolean;
}

interface DocumentationModuleProps {
  courseFamily?: string;
  documents?: Document[];
  onUpload?: (file: File) => Promise<void>;
}

const DocumentationModule: React.FC<DocumentationModuleProps> = ({
  courseFamily = 'general',
  documents: initialDocs = [],
  onUpload,
}) => {
  const [documents, setDocuments] = useState<Document[]>(
    initialDocs.length > 0
      ? initialDocs
      : [
          {
            id: '1',
            name: 'CCT 130/75 - Acuerdos Laborales',
            type: 'pdf',
            size: '2.5 MB',
            uploadedAt: new Date(),
            required: true,
          },
          {
            id: '2',
            name: 'Recibo de Sueldo Template',
            type: 'excel',
            size: '150 KB',
            uploadedAt: new Date(),
          },
        ]
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      if (onUpload) {
        await onUpload(selectedFile);
      }

      const newDoc: Document = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: selectedFile.type.includes('pdf') ? 'pdf' : 'document',
        size: `${(selectedFile.size / 1024).toFixed(0)} KB`,
        uploadedAt: new Date(),
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'excel':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'image':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <CardTitle>Carpeta Digital</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Upload Section */}
        <div className="mb-6 p-4 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium">Sube documentos requeridos</span>
            </div>

            <input
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700"
            />

            {selectedFile && (
              <div className="text-sm text-gray-600">
                Archivo seleccionado: <span className="font-medium">{selectedFile.name}</span>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {uploading ? 'Subiendo...' : 'Subir Archivo'}
            </Button>
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-700 mb-3">Documentos disponibles</h3>

          {documents.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">{doc.size}</span>
                        {doc.required && <Badge className="bg-red-100 text-red-800 text-xs">Requerido</Badge>}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={() => console.log('Descargar:', doc.name)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No hay documentos disponibles</p>
          )}
        </div>

        {/* Documentation Info */}
        <div className="mt-6 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-900">
            <strong>ℹ️ Nota:</strong> Los documentos marcados como "Requerido" deben ser cargados antes de
            completar la simulación.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentationModule;

'use client'
import React, { useState, useRef } from 'react';
import { FileText, Download, Upload, Eye } from 'lucide-react';

interface DocumentModuleProps {
  scenario: any;
  config: any;
  logAction: (actionType: string, description: string, metadata: Record<string, any>) => void;
  updateState: (state: Record<string, any>) => void;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url?: string;
  content?: string;
  uploadedAt?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  feedback?: string;
}

const DocumentModule: React.FC<DocumentModuleProps> = ({
  scenario,
  config,
  logAction,
  updateState,
}) => {
  const [documents, setDocuments] = useState<Document[]>(
    config.requiredDocuments || [
      { id: '1', name: 'Contrato de Trabajo', type: 'pdf', status: 'pending' },
      { id: '2', name: 'Beneficiarios de Pensión', type: 'csv', status: 'pending' },
      { id: '3', name: 'Validación AFP', type: 'pdf', status: 'pending' },
    ]
  );

  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (file: File, docId: string) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                url: URL.createObjectURL(file),
                content,
                uploadedAt: new Date().toISOString(),
                status: 'reviewed',
              }
            : doc
        )
      );

      logAction('document_upload', `Uploaded ${file.name}`, {
        moduleName: 'Document',
        documentId: docId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString(),
      });
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, docId: string) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, docId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, docId);
    }
  };

  const handleApproveDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, status: 'approved' } : doc
      )
    );

    logAction('document_approval', `Approved document ${docId}`, {
      moduleName: 'Document',
      documentId: docId,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectDocument = (docId: string, feedback: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, status: 'rejected', feedback } : doc
      )
    );

    logAction('document_rejection', `Rejected document ${docId}`, {
      moduleName: 'Document',
      documentId: docId,
      feedback,
      timestamp: new Date().toISOString(),
    });
  };

  const allApproved = documents.every((doc) => doc.status === 'approved');

  const handleSubmit = () => {
    updateState({
      documentsApproved: allApproved,
      documents: documents.filter((d) => d.url),
      lastDocumentAction: new Date().toISOString(),
    });

    logAction('documents_submitted', 'All documents submitted for final review', {
      moduleName: 'Document',
      totalDocuments: documents.length,
      approvedCount: documents.filter((d) => d.status === 'approved').length,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-emerald-600" />
        <h3 className="text-2xl font-bold">Gestión de Documentos</h3>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`border rounded-lg p-4 transition ${
              doc.status === 'approved'
                ? 'bg-green-50 border-green-200'
                : doc.status === 'rejected'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{doc.name}</h4>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  doc.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : doc.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {doc.status === 'pending'
                  ? 'Pendiente'
                  : doc.status === 'reviewed'
                    ? 'Revisado'
                    : doc.status === 'approved'
                      ? 'Aprobado'
                      : 'Rechazado'}
              </span>
            </div>

            {/* Upload Area or Document Info */}
            {!doc.url ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, doc.id)}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                  dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Arrastra el archivo aquí o{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    haz clic para seleccionar
                  </button>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileSelect(e, doc.id)}
                  className="hidden"
                  accept=".pdf,.csv,.xlsx,.doc,.docx"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">✓ Documento cargado</p>
                  <p className="text-xs text-gray-500">{doc.uploadedAt}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="p-2 hover:bg-blue-100 rounded transition"
                    title="Ver documento"
                  >
                    <Eye className="w-5 h-5 text-blue-600" />
                  </button>
                  <a
                    href={doc.url}
                    download={doc.name}
                    className="p-2 hover:bg-gray-100 rounded transition"
                    title="Descargar"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                  </a>
                </div>
              </div>
            )}

            {/* Document Actions */}
            {doc.url && doc.status !== 'approved' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApproveDocument(doc.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-semibold"
                >
                  ✓ Aprobar
                </button>
                <button
                  onClick={() => handleRejectDocument(doc.id, 'Requiere correcciones')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-semibold"
                >
                  ✗ Rechazar
                </button>
              </div>
            )}

            {/* Feedback */}
            {doc.feedback && (
              <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-600 text-sm text-red-800">
                <p className="font-semibold">Retroalimentación:</p>
                <p>{doc.feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">Progreso de Documentos</span>
          <span className="text-sm text-gray-600">
            {documents.filter((d) => d.url).length} / {documents.length}
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition"
            style={{
              width: `${(documents.filter((d) => d.url).length / documents.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!allApproved}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          allApproved
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {allApproved ? 'Enviar Documentos Aprobados' : 'Aprueba todos los documentos para continuar'}
      </button>
    </div>
  );
};

export default DocumentModule;

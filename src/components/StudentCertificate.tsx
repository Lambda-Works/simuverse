import React, { useState } from 'react';
import { Download, Mail, Eye, Loader } from 'lucide-react';
import { certificateService } from '../../services/CertificateService';

interface StudentCertificateProps {
  studentData: {
    id: number;
    name: string;
    email: string;
    simulationId: number;
    courseId: number;
    courseName: string;
    familyType: string;
    completionDate: string;
    score: number;
    completionTime: number;
    competencies: Array<{ name: string; score: number }>;
    actions: Array<{ type: string; count: number }>;
  };
  onLogAction?: (actionType: string, description: string, metadata: any) => void;
}

const StudentCertificate: React.FC<StudentCertificateProps> = ({
  studentData,
  onLogAction,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const url = await certificateService.getPreviewDataUrl(studentData);
      setPreviewUrl(url);

      onLogAction?.('certificate_preview', 'Viewed certificate preview', {
        studentId: studentData.id,
        simulationId: studentData.simulationId,
      });
    } catch (err) {
      setError('Error al generar vista previa del certificado');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      await certificateService.downloadCertificate(studentData);

      onLogAction?.('certificate_download', 'Downloaded certificate', {
        studentId: studentData.id,
        simulationId: studentData.simulationId,
        filename: `certificado_${studentData.name}.png`,
      });
    } catch (err) {
      setError('Error al descargar el certificado');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true);
      setError(null);
      const success = await certificateService.emailCertificate(
        studentData,
        studentData.email
      );

      if (success) {
        setEmailSent(true);
        onLogAction?.('certificate_email', 'Sent certificate via email', {
          studentId: studentData.id,
          simulationId: studentData.simulationId,
          email: studentData.email,
        });

        setTimeout(() => setEmailSent(false), 3000);
      } else {
        throw new Error('Failed to send email');
      }
    } catch (err) {
      setError('Error al enviar el certificado por correo');
      console.error(err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-2">🎓 Certificado de Competencia</h2>
        <p className="text-purple-100">
          Descarga o comparte tu certificado de haber completado la simulación empresarial
        </p>
      </div>

      {/* Student Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Datos del Estudiante</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Nombre:</span>
              <p className="font-medium text-gray-900">{studentData.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Curso:</span>
              <p className="font-medium text-gray-900">{studentData.courseName}</p>
            </div>
            <div>
              <span className="text-gray-600">Familia:</span>
              <p className="font-medium text-gray-900">{studentData.familyType}</p>
            </div>
            <div>
              <span className="text-gray-600">Desempeño:</span>
              <p className="font-medium text-green-600">{studentData.score}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Estadísticas</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Tiempo de Simulación:</span>
              <p className="font-medium text-gray-900">
                {Math.round(studentData.completionTime)} minutos
              </p>
            </div>
            <div>
              <span className="text-gray-600">Fecha de Completación:</span>
              <p className="font-medium text-gray-900">
                {new Date(studentData.completionDate).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <span className="text-gray-600">ID Simulación:</span>
              <p className="font-medium text-gray-900">{studentData.simulationId}</p>
            </div>
            <div>
              <span className="text-gray-600">Competencias Desarrolladas:</span>
              <p className="font-medium text-gray-900">{studentData.competencies.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Competencies Summary */}
      {studentData.competencies.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Competencias Desarrolladas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentData.competencies.map((comp) => (
              <div key={comp.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{comp.name}</span>
                    <span className="text-sm font-semibold text-indigo-600">{comp.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${comp.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePreview}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition font-semibold"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Eye className="w-5 h-5" />
              Ver Vista Previa
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition font-semibold"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Descargando...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Descargar PDF
            </>
          )}
        </button>

        <button
          onClick={handleSendEmail}
          disabled={isSendingEmail}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition font-semibold ${
            emailSent
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300'
          }`}
        >
          {isSendingEmail ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : emailSent ? (
            <>
              <Mail className="w-5 h-5" />
              ✓ Enviado a {studentData.email}
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              Enviar por Email
            </>
          )}
        </button>
      </div>

      {/* Preview Section */}
      {previewUrl && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Vista Previa del Certificado</h3>
          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <img
              src={previewUrl}
              alt="Certificate Preview"
              className="w-full h-auto"
              style={{ maxWidth: '100%' }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Este es un vista previa de tu certificado. Descárgalo o envíalo por correo para conservar una copia.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Información del Certificado</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Certificado official de FEPEI 360</li>
          <li>✓ Incluye código de verificación único</li>
          <li>✓ Gráfico radar de competencias</li>
          <li>✓ QR code para verificación digital</li>
          <li>✓ Válido para porfolio profesional</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentCertificate;

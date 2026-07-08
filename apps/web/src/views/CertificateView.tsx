'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Award, CheckCircle2, XCircle, BookOpen, Clock, Star } from 'lucide-react';

import { apiClient } from '@/services/ApiClient';

interface CertificateData {
  certificate_id: string;
  student_name: string;
  student_email: string;
  course_title: string;
  scenario_title: string;
  course_category: string;
  overall_score: number;
  kpi_results: Record<string, number>;
  eval_criteria: string[];
  // Ficha Técnica Ministerial
  ministry_sheet_name?: string;
  ministry_code?: string;
  ministry_kpis?: Array<{ name: string; description?: string; category?: string }>;
  completed_at: string;
  time_spent_minutes: number;
  instance_id: string;
}

const KPI_DESCRIPTIONS: Record<string, string> = {
  'comunicacion': 'Claridad y efectividad en la comunicación',
  'resolucion': 'Capacidad de resolución de problemas',
  'empatia': 'Demostración de empatía y escucha activa',
  'conocimiento_tecnico': 'Aplicación de conocimiento técnico específico',
  'gestion_tiempo': 'Gestión eficiente del tiempo disponible',
  'toma_decisiones': 'Calidad de las decisiones tomadas',
  'negociacion': 'Habilidades de negociación y persuasión',
  'documentacion': 'Uso correcto de documentación y procedimientos',
};

export default function CertificateView() {
  const params = useParams<{ instanceId: string }>();
  const instanceId = params.instanceId;
  const router = useRouter();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instanceId) return;
    apiClient.get(`/certificates/${instanceId}`)
      .then(r => {
        const data = r.data;
        setCert(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [instanceId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <XCircle className="w-16 h-16 text-red-400" />
      <h2 className="text-xl font-bold text-red-600">No se puede generar el certificado</h2>
      <p className="text-muted-foreground text-sm max-w-sm text-center">{error}</p>
      <Button onClick={() => router.back()} variant="outline">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
      </Button>
    </div>
  );

  if (!cert) return null;

  const scoreColor = cert.overall_score >= 85 ? '#16a34a' : cert.overall_score >= 70 ? '#d97706' : '#dc2626';
  const distinction = cert.overall_score >= 85;
  const kpiEntries = Object.entries(cert.kpi_results);
  const hasMinistryKPIs = cert.ministry_kpis && cert.ministry_kpis.length > 0;
  const completedDate = new Date(cert.completed_at).toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <>
      {/* Barra de acciones (no se imprime) */}
      <div className="print:hidden flex items-center justify-between px-6 py-3 bg-white border-b sticky top-0 z-10">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Certificado {cert.certificate_id}</span>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* Certificado imprimible */}
      <div className="min-h-screen bg-gray-100 print:bg-white flex items-start justify-center py-10 print:py-0">
        <div
          id="certificate"
          className="bg-white w-full max-w-3xl mx-auto shadow-2xl print:shadow-none"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          {/* Borde decorativo exterior */}
          <div className="m-4 border-4 border-double border-blue-800 p-6 print:m-3 print:p-5">

            {/* Encabezado */}
            <div className="text-center border-b-2 border-blue-800 pb-6 mb-6">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-blue-900 tracking-widest uppercase mb-1">
                SimuVerse
              </h1>
              <p className="text-xs text-gray-500 tracking-widest uppercase">Sistema de Simulaciones Educativas · MSM</p>
            </div>

            {/* Título del certificado */}
            <div className="text-center mb-8">
              <div className={`inline-block px-6 py-2 rounded-full mb-4 ${distinction ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-blue-50 border-2 border-blue-400'}`}>
                <span className={`text-sm font-bold tracking-widest uppercase ${distinction ? 'text-yellow-700' : 'text-blue-700'}`}>
                  {distinction ? '⭐ Certificado de Aprobación con Distinción' : '✅ Certificado de Aprobación'}
                </span>
              </div>
              <p className="text-gray-600 italic text-sm">Se certifica que</p>
            </div>

            {/* Nombre del alumno */}
            <div className="text-center mb-8">
              <div className="border-b-2 border-gray-400 inline-block pb-2 min-w-[400px]">
                <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'cursive' }}>
                  {cert.student_name}
                </h2>
              </div>
              <p className="text-gray-500 text-xs mt-2">{cert.student_email}</p>
            </div>

            {/* Cuerpo del texto */}
            <div className="text-center mb-8 px-8">
              <p className="text-gray-700 leading-relaxed text-sm">
                ha completado satisfactoriamente la simulación educativa
              </p>
              <p className="text-xl font-bold text-blue-900 mt-2 mb-1">
                "{cert.course_title}"
              </p>
              {cert.scenario_title && cert.scenario_title !== cert.course_title && (
                <p className="text-sm text-gray-500 italic mb-2">Escenario: {cert.scenario_title}</p>
              )}
              <p className="text-gray-700 text-sm">
                demostrando las competencias y habilidades requeridas para este curso.
              </p>
            </div>

            {/* Puntaje destacado */}
            <div className="flex justify-center mb-8">
              <div className="border-2 rounded-xl px-8 py-4 text-center" style={{ borderColor: scoreColor }}>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Puntaje Final</p>
                <p className="text-5xl font-bold" style={{ color: scoreColor }}>
                  {cert.overall_score.toFixed(1)}
                </p>
                <p className="text-xs font-semibold mt-1" style={{ color: scoreColor }}>
                  {distinction ? '⭐ APROBADO CON DISTINCIÓN' : '✅ APROBADO'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Umbral mínimo: 70.0</p>
              </div>
            </div>

            {/* ── SECCIÓN 1: KPIs ministeriales de la Ficha Técnica ── */}
            {hasMinistryKPIs && (
              <div className="mb-8 px-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-px flex-1 bg-purple-200" />
                  <h3 className="text-center text-sm font-bold text-purple-800 uppercase tracking-widest px-3">
                    📋 Competencias Ministeriales Acreditadas
                  </h3>
                  <div className="h-px flex-1 bg-purple-200" />
                </div>
                {cert.ministry_sheet_name && (
                  <p className="text-center text-[10px] text-purple-500 mb-3 italic">
                    Ficha Técnica: <strong>{cert.ministry_sheet_name}</strong>
                    {cert.ministry_code && <> · Código: <strong>{cert.ministry_code}</strong></>}
                    {' '}· Ministerio de Educación de la Provincia de Santa Fe
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {cert.ministry_kpis!.map((kpi, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-purple-50 border border-purple-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-purple-900">{kpi.name}</p>
                        {kpi.description && <p className="text-[10px] text-purple-600 mt-0.5">{kpi.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECCIÓN 2: KPIs del docente con puntaje numérico ── */}
            {kpiEntries.length > 0 && (
              <div className="mb-8 px-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-px flex-1 bg-gray-200" />
                  <h3 className="text-center text-sm font-bold text-gray-700 uppercase tracking-widest px-3">
                    📊 Indicadores de Desempeño (KPIs)
                  </h3>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="text-xs text-center text-gray-500 mb-4 italic">
                  Indicadores establecidos por el equipo docente · Umbral de aprobación: <strong>70 puntos</strong>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {kpiEntries.map(([kpi, score]) => {
                    const n = Number(score);
                    const passed = n >= 70;
                    const color = n >= 85 ? '#16a34a' : n >= 70 ? '#d97706' : '#dc2626';
                    const description = KPI_DESCRIPTIONS[kpi.toLowerCase().replace(/ /g, '_')] || '';
                    return (
                      <div key={kpi} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-xs text-gray-800 capitalize">{kpi.replace(/_/g, ' ')}</p>
                            {description && <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {passed ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color }} /> : <XCircle className="w-3.5 h-3.5" style={{ color }} />}
                            <span className="font-bold text-sm" style={{ color }}>{n.toFixed(0)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, n)}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SECCIÓN 3: Criterios del docente (sin puntaje numérico) ── */}
            {kpiEntries.length === 0 && cert.eval_criteria.length > 0 && (
              <div className="mb-8 px-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <h3 className="text-center text-sm font-bold text-gray-700 uppercase tracking-widest px-3">
                    Criterios de Evaluación
                  </h3>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <ul className="grid grid-cols-2 gap-2">
                  {cert.eval_criteria.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Datos de la simulación */}
            <div className="flex justify-center gap-8 text-center text-xs text-gray-500 mb-8">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="capitalize">{cert.course_category || 'General'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{cert.time_spent_minutes} minutos</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                <span>{cert.overall_score.toFixed(1)} / 100</span>
              </div>
            </div>

            {/* Firma y fecha */}
            <div className="flex justify-between items-end px-8 pt-6 border-t">
              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <div className="w-32 border-b-2 border-gray-400" />
                </div>
                <p className="text-xs text-gray-600 font-semibold">Dirección Académica</p>
                <p className="text-xs text-gray-400">SimuVerse — MSM</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Fecha de emisión</p>
                <p className="text-sm font-semibold text-gray-800 capitalize">{completedDate}</p>
                <p className="text-[10px] text-gray-400 mt-2">ID: {cert.certificate_id}</p>
              </div>
              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <div className="w-32 border-b-2 border-gray-400" />
                </div>
                <p className="text-xs text-gray-600 font-semibold">Responsable del Curso</p>
                <p className="text-xs text-gray-400">CentroSadosky</p>
              </div>
            </div>

            {/* Pie verificación */}
            <div className="text-center mt-4 pt-3 border-t">
              <p className="text-[10px] text-gray-400">
                Certificado verificable · Ref: {cert.certificate_id} · centrosadoskyregistracion@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate { position: fixed; top: 0; left: 0; width: 100%; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </>
  );
}

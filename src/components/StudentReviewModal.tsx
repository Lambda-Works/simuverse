import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Award, MessageSquare, XCircle, CheckCircle2, Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { API_BASE } from '@/lib/api';
const API = API_BASE;

interface ChatLog {
  id: number;
  turn_number: number;
  speaker: 'student' | 'ai' | 'system';
  message_text: string;
  is_correct: number | null;
  correct_answer: string | null;
  ai_solution: string | null;
  challenge_description: string | null;
  score_impact: number | null;
}

interface ReviewData {
  instance: any;
  logs: ChatLog[];
  evaluation: any | null;
  scenario: any | null;
}

interface Props {
  instanceId: string;
  studentId: string;
  courseTitle: string;
  open: boolean;
  onClose: () => void;
}

export function StudentReviewModal({ instanceId, studentId, courseTitle, open, onClose }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !instanceId) return;
    setLoading(true);
    fetch(`${API}/student-review/${instanceId}?student_id=${studentId}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, instanceId, studentId]);

  const score = data?.evaluation ? Number(data.evaluation.overall_score) : null;
  const passed = score !== null && score >= 70;
  const distinction = score !== null && score >= 85;
  const incorrectLogs = (data?.logs || []).filter(l => l.is_correct === 0);
  const correctLogs = (data?.logs || []).filter(l => l.is_correct === 1);

  let kpiResults: Record<string, number> = {};
  try {
    kpiResults = typeof data?.evaluation?.kpi_results === 'string'
      ? JSON.parse(data?.evaluation?.kpi_results)
      : (data?.evaluation?.kpi_results || {});
  } catch {}

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Revisión: {courseTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !data ? (
          <p className="text-center text-muted-foreground py-8">No se pudo cargar la revisión.</p>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Resumen de resultados */}
            {data.evaluation && (
              <div className={`p-4 rounded-xl mb-4 border-2 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {score?.toFixed(1)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {distinction ? '⭐ Aprobado con Distinción' : passed ? '✅ Aprobado' : '❌ No Aprobado'}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {correctLogs.length} correctas</span>
                        <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> {incorrectLogs.length} incorrectas</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.round((data.instance.time_spent_seconds || 0) / 60)} min</span>
                      </div>
                    </div>
                  </div>
                  {passed && (
                    <Button
                      onClick={() => { onClose(); router.push(`/certificate/${instanceId}`); }}
                      className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Award className="w-4 h-4" /> Ver Certificado
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Tabs defaultValue={incorrectLogs.length > 0 ? 'errors' : 'dialog'}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="dialog" className="flex-1">
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> Diálogo ({data.logs.length})
                </TabsTrigger>
                <TabsTrigger value="errors" className="flex-1">
                  <XCircle className="w-3.5 h-3.5 mr-1 text-red-500" /> Mis Errores ({incorrectLogs.length})
                </TabsTrigger>
                {Object.keys(kpiResults).length > 0 && (
                  <TabsTrigger value="kpis" className="flex-1">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> KPIs
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Tab: Diálogo completo */}
              <TabsContent value="dialog">
                {data.logs.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No hay registros de diálogo para esta sesión.</p>
                    <p className="text-xs mt-1">El historial de conversación detallado estará disponible en futuras simulaciones.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.logs.map(log => (
                      <div key={log.id} className={`flex ${log.speaker === 'student' ? 'justify-end' : log.speaker === 'system' ? 'justify-center' : 'justify-start'}`}>
                        {log.speaker === 'system' ? (
                          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-3 py-1.5 rounded-full max-w-xs text-center">
                            {log.message_text}
                          </div>
                        ) : (
                          <div className={`max-w-xs lg:max-w-md ${log.speaker === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className={`px-3 py-2 rounded-2xl text-sm ${log.speaker === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} ${log.is_correct === 0 ? 'ring-2 ring-red-400' : ''}`}>
                              {log.message_text}
                            </div>
                            {log.is_correct === 0 && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs max-w-xs">
                                <p className="text-red-600 font-semibold mb-0.5">❌ Respuesta incorrecta</p>
                                {log.correct_answer && <p className="text-green-700"><span className="font-medium">Esperada: </span>{log.correct_answer}</p>}
                              </div>
                            )}
                            {log.is_correct === 1 && <span className="text-xs text-green-600">✅</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Mis Errores */}
              <TabsContent value="errors">
                {incorrectLogs.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="font-semibold text-green-700">¡Sin errores registrados!</p>
                    <p className="text-muted-foreground text-sm mt-1">Respondiste correctamente todos los planteos evaluados.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Estos son los puntos donde puedes mejorar. Revisá la solución propuesta por la IA para entender el enfoque correcto.
                    </p>
                    {incorrectLogs.map((log, i) => (
                      <Card key={log.id} className="border-red-200 bg-red-50/30">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-red-100 text-red-700 border-red-300 border text-xs">Error #{i + 1} · Turno {log.turn_number}</Badge>
                          </div>
                          {log.challenge_description && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-600 mb-1">📋 Planteo:</p>
                              <p className="text-sm text-gray-700 bg-white border rounded p-2">{log.challenge_description}</p>
                            </div>
                          )}
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Tu respuesta:</p>
                            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded p-2">{log.message_text}</p>
                          </div>
                          {log.correct_answer && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-600 mb-1">✅ Respuesta esperada:</p>
                              <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded p-2">{log.correct_answer}</p>
                            </div>
                          )}
                          {log.ai_solution && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">💡 Solución completa de la IA:</p>
                              <p className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded p-2">{log.ai_solution}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab: KPIs */}
              {Object.keys(kpiResults).length > 0 && (
                <TabsContent value="kpis">
                  <div className="space-y-3">
                    {data.evaluation?.overall_feedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-4">
                        💬 {data.evaluation.overall_feedback}
                      </div>
                    )}
                    {Object.entries(kpiResults).map(([kpi, val]) => {
                      const n = Number(val);
                      const color = n >= 85 ? 'bg-green-500' : n >= 70 ? 'bg-yellow-500' : 'bg-red-500';
                      const textColor = n >= 85 ? 'text-green-700' : n >= 70 ? 'text-yellow-700' : 'text-red-600';
                      return (
                        <div key={kpi}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium capitalize">{kpi.replace(/_/g, ' ')}</span>
                            <span className={`font-bold ${textColor}`}>{n.toFixed(0)} / 100 {n >= 70 ? '✅' : '❌'}</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, n)}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Umbral mínimo: 70 puntos</p>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

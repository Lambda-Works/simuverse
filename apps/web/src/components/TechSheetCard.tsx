'use client'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PipelineOutput, PipelineStatus } from '@/hooks/useAnalysisProgress';
import { AlertTriangle, Edit2, FileText, Paperclip, RefreshCw, Settings, Trash2, Zap } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { PipelineStatus as PipelineStatusComponent } from './PipelineStatus';
import { StepOutput } from './StepOutput';

export interface TechSheet {
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

interface TechSheetCardProps {
  sheet: TechSheet;
  courses: Course[];
  isAnalyzing: boolean;
  analyzingSheetId: number | null;
  pollStatus: PipelineStatus;
  pollOutput: PipelineOutput | null;
  pollError: string | null;
  onEdit: (sheet: TechSheet) => void;
  onAnalyze: (id: number) => void;
  onDelete: (id: number) => void;
  onConfig: (id: number, courseId: string) => void;
  onDownloadFile: (fileUrl: string, fileName?: string) => void;
}

export function TechSheetCard({
  sheet,
  courses,
  isAnalyzing,
  analyzingSheetId,
  pollStatus,
  pollOutput,
  pollError,
  onEdit,
  onAnalyze,
  onDelete,
  onConfig,
  onDownloadFile,
}: TechSheetCardProps) {
  const courseTitle = courses.find(c => c.id === sheet.course_id)?.title || sheet.course_id;
  const status = sheet.pipeline_status;
  const isCompleted = status === 'completed';
  const isRunning = status === 'running' || analyzingSheetId === sheet.id;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <h4 className="font-semibold text-lg">{sheet.name}</h4>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-0.5">
                {sheet.ministry_code && <span>{sheet.ministry_code}</span>}
                {sheet.course_id && <span className="text-blue-700 font-medium">{courseTitle}</span>}
                {!sheet.course_id && <span className="text-gray-400 italic">Sin curso asociado</span>}
                {sheet.file_url && (
                  <button
                    type="button"
                    className="text-green-700 underline flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); void onDownloadFile(sheet.file_url!); }}
                  >
                    <Paperclip className="w-3 h-3" /> Ver archivo adjunto
                  </button>
                )}
              </div>
            </div>
          </div>

          {sheet.description && <p className="text-sm text-gray-600 mt-3 line-clamp-2">{sheet.description}</p>}

          {sheet.processed && sheet.extracted_data && (
            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm font-semibold text-green-900">Analizado con IA</p>
              <div className="text-sm text-green-800 mt-2">
                {sheet.extracted_data.competencies && <p>{sheet.extracted_data.competencies.length} competencias identificadas</p>}
                {sheet.extracted_data.kpi_requirements && <p>{sheet.extracted_data.kpi_requirements.length} criterios de evaluacion</p>}
                {sheet.extracted_data.suggested_questions && <p>{sheet.extracted_data.suggested_questions.length} preguntas generadas</p>}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">Creado: {new Date(sheet.created_at).toLocaleDateString()}</p>
        </div>

        <div className="flex gap-2 ml-4 flex-wrap">
          {!sheet.processed && !sheet.competencies && !sheet.kpi_requirements && (
            <Button onClick={() => onEdit(sheet)} className="bg-orange-600 hover:bg-orange-700">
              <Edit2 className="w-4 h-4 mr-2" /> Completar
            </Button>
          )}

          {!sheet.processed && !isCompleted && (
            <Button
              onClick={() => onAnalyze(sheet.id)}
              disabled={isRunning || isCompleted || !sheet.course_id}
              className={isCompleted ? 'bg-green-600' : isRunning ? 'bg-yellow-600' : 'bg-purple-600 hover:bg-purple-700'}
            >
              <Zap className="w-4 h-4 mr-2" />
              {isRunning ? 'Analizando...' : isCompleted ? 'Analizado' : 'Analizar'}
            </Button>
          )}

          {isCompleted && (
            <>
              <Button disabled className="bg-green-600"><Zap className="w-4 h-4 mr-2" /> Analizado</Button>
              <Button
                onClick={() => toast.error('Re-analizar esta ficha? Se sobrescribiran los resultados existentes.', {
                  action: { label: 'Re-analizar', onClick: () => onAnalyze(sheet.id) },
                  duration: 5000,
                })}
                disabled={analyzingSheetId === sheet.id}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Re-analizar
              </Button>
              {sheet.course_id && (
                <Button onClick={() => onConfig(sheet.id, sheet.course_id!)} className="bg-blue-600 hover:bg-blue-700">
                  <Settings className="w-4 h-4 mr-2" /> Configurar
                </Button>
              )}
            </>
          )}

          <Button onClick={() => onDelete(sheet.id)} size="sm" variant="outline" className="text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {analyzingSheetId === sheet.id && (
        <PipelineStatusComponent status={pollStatus} output={pollOutput} error={pollError} type="live" />
      )}

      {analyzingSheetId !== sheet.id && status && status !== 'idle' && !isCompleted && (
        <PipelineStatusComponent status={status} output={sheet.pipeline_output} type="static" />
      )}

      {status === 'validation_rejected' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-semibold text-red-900">Validacion Rechazada</span>
          </div>
          <p className="text-sm text-red-800 mt-1">
            {sheet.pipeline_output && typeof sheet.pipeline_output === 'object' && 'error_message' in sheet.pipeline_output
              ? String((sheet.pipeline_output as PipelineOutput).error_message)
              : 'El documento no fue validado como ficha tecnica del ministerio.'}
          </p>
        </div>
      )}

      {status === 'failed' && (
        <>
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-900">Error en el Analisis</span>
            </div>
            <p className="text-sm text-red-800 mt-1">
              {sheet.pipeline_output && typeof sheet.pipeline_output === 'object' && 'error_message' in sheet.pipeline_output
                ? String((sheet.pipeline_output as PipelineOutput).error_message)
                : 'Ocurrio un error durante el analisis. Intenta nuevamente.'}
            </p>
          </div>
          <Button
            onClick={() => toast.error('Reintentar el analisis?', {
              action: { label: 'Reintentar', onClick: () => onAnalyze(sheet.id) },
              duration: 5000,
            })}
            disabled={analyzingSheetId === sheet.id}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Reintentar analisis
          </Button>
        </>
      )}

      {sheet.pipeline_output && typeof sheet.pipeline_output === 'object' && (
        <StepOutput output={sheet.pipeline_output as PipelineOutput} />
      )}
    </Card>
  );
}

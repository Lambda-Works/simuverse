'use client'
import { Badge } from '@/components/ui/badge';
import { PipelineOutput, PipelineStatus as PipelineStatusType } from '@/hooks/useAnalysisProgress';
import { CheckCircle, Clock, FileText, Mail, BarChart3, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';
import React from 'react';

const PIPELINE_STEPS = [
  { key: 'step_1', label: 'Conversion', field: 'step_1_markdown' as const, icon: FileText },
  { key: 'step_2', label: 'Validacion', field: 'step_2_validation' as const, icon: FileText },
  { key: 'step_3', label: 'Competencias', field: 'step_3_competencies' as const, icon: FileText },
  { key: 'step_4', label: 'KPIs', field: 'step_4_kpis' as const, icon: BarChart3 },
  { key: 'step_5', label: 'Preguntas', field: 'step_5_questions' as const, icon: FileText },
  { key: 'step_6', label: 'Simulacion', field: 'step_6_simulation_prompt' as const, icon: FileText },
  { key: 'step_7', label: 'Coaching', field: 'step_7_coaching_prompt' as const, icon: FileText },
  { key: 'step_8', label: 'Emails', field: 'step_8_emails' as const, icon: Mail },
  { key: 'step_9', label: 'Hoja Calculo', field: 'step_9_spreadsheet' as const, icon: BarChart3 },
  { key: 'step_10', label: 'Crisis', field: 'step_10_crisis' as const, icon: ShieldAlert },
];

function getStepStatus(
  pipelineStatus: PipelineStatusType,
  stepIndex: number,
  output: PipelineOutput | null,
): 'pending' | 'running' | 'completed' | 'failed' {
  if (pipelineStatus === 'failed') {
    if (output?.error_step === stepIndex + 1) return 'failed';
    if (output?.error_step && stepIndex + 1 < output.error_step) return 'completed';
    return 'pending';
  }

  if (pipelineStatus === 'validation_rejected') {
    if (stepIndex === 1) return 'failed';
    if (stepIndex === 0) return 'completed';
    return 'pending';
  }

  if (!pipelineStatus || pipelineStatus === 'idle') return 'pending';

  if (pipelineStatus === 'completed') return 'completed';

  if (pipelineStatus === 'running') return stepIndex === 0 ? 'running' : 'pending';

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
      return <CheckCircle className="w-3 h-3 text-green-600" />;
    case 'running':
      return <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />;
    case 'failed':
      return <AlertTriangle className="w-3 h-3 text-red-600" />;
    default:
      return <Clock className="w-3 h-3 text-gray-400" />;
  }
}

interface PipelineStatusProps {
  status: PipelineStatusType;
  output: PipelineOutput | null | unknown;
  error?: string | null;
  type: 'live' | 'static';
}

export function PipelineStatus({ status, output, error, type }: PipelineStatusProps) {
  const pipelineOutput = (output && typeof output === 'object' ? output : null) as PipelineOutput | null;

  return (
    <div className={`mt-3 p-3 rounded-lg border ${
      type === 'live' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {type === 'live' && (
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        )}
        <span className={`text-sm font-semibold ${
          type === 'live' ? 'text-blue-900' : 'text-gray-900'
        }`}>
          {type === 'live' ? 'Analisis en progreso...' : 'Estado del pipeline'}
        </span>
        {type === 'static' && (
          <Badge variant={
            status === 'completed' ? 'default' :
            status === 'failed' || status === 'validation_rejected' ? 'destructive' :
            'secondary'
          }>
            {status}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PIPELINE_STEPS.map((step, i) => {
          const stepStatus = getStepStatus(status, i, pipelineOutput);
          const IconComponent = step.icon;
          return (
            <div key={step.key} className="flex items-center gap-1.5 text-xs">
              <StepIcon status={stepStatus} />
              <IconComponent className="w-3 h-3 text-gray-500" />
              <span className={
                stepStatus === 'completed' ? 'text-green-700' :
                stepStatus === 'running' ? 'text-blue-700 font-medium' :
                stepStatus === 'failed' ? 'text-red-700' :
                'text-gray-500'
              }>
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

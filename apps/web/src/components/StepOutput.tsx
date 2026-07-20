'use client'
import { PipelineOutput } from '@/hooks/useAnalysisProgress';
import { FileText } from 'lucide-react';
import React from 'react';

const PIPELINE_STEPS = [
  { key: 'step_1', label: 'Conversion', field: 'step_1_markdown' as const },
  { key: 'step_2', label: 'Validacion', field: 'step_2_validation' as const },
  { key: 'step_3', label: 'Competencias', field: 'step_3_competencies' as const },
  { key: 'step_4', label: 'KPIs', field: 'step_4_kpis' as const },
  { key: 'step_5', label: 'Preguntas', field: 'step_5_questions' as const },
  { key: 'step_6', label: 'Simulacion', field: 'step_6_simulation_prompt' as const },
  { key: 'step_7', label: 'Coaching', field: 'step_7_coaching_prompt' as const },
  { key: 'step_8', label: 'Emails', field: 'step_8_emails' as const },
  { key: 'step_9', label: 'Hoja Calculo', field: 'step_9_spreadsheet' as const },
  { key: 'step_10', label: 'Crisis', field: 'step_10_crisis' as const },
];

interface StepOutputProps {
  output: PipelineOutput;
}

export function StepOutput({ output }: StepOutputProps) {
  const stepsWithOutput = PIPELINE_STEPS.filter(
    (step) => (output as any)[step.field],
  );

  if (stepsWithOutput.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {stepsWithOutput.map((step) => (
        <details key={step.key} className="group">
          <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{step.label}</span>
            <span className="text-gray-400 group-open:rotate-90 transition-transform">&#9654;</span>
          </summary>
          <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded text-xs max-h-48 overflow-auto">
            <pre className="whitespace-pre-wrap font-mono text-gray-700">
              {String((output as any)[step.field])}
            </pre>
          </div>
        </details>
      ))}
    </div>
  );
}

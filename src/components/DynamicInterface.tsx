
import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import CommunicationModule from './modules/CommunicationModule';
import ToolsModule from './modules/ToolsModule';
import DocumentationModule from './modules/DocumentationModule';

interface DynamicInterfaceProps {
  course: Course;
  simulationId?: string;
  onAction?: (action: string, data: any) => void;
}

const DynamicInterface: React.FC<DynamicInterfaceProps> = ({ course, simulationId, onAction }) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [crisisActive, setCrisisActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Crisis trigger simulation
  useEffect(() => {
    const crisisEvents = course.crisis_events || [];
    const triggered = crisisEvents.find((e) => e.trigger_minutes === elapsedMinutes);
    if (triggered) {
      setCrisisActive(true);
      setTimeout(() => setCrisisActive(false), 10000);
    }
  }, [elapsedMinutes, course]);

  const familyColors: Record<string, string> = {
    administracion: 'bg-blue-100 text-blue-900',
    rrhh: 'bg-purple-100 text-purple-900',
    informatica: 'bg-green-100 text-green-900',
    emprendimiento: 'bg-orange-100 text-orange-900',
  };

  const familyBadgeColor = familyColors[course.family] || 'bg-gray-100 text-gray-900';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 text-sm mt-1">{course.description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={familyBadgeColor}>{course.family.toUpperCase()}</Badge>
            <Badge variant="outline">ID: {course.course_id}</Badge>
          </div>
        </div>
      </div>

      {/* Crisis Alert */}
      {crisisActive && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            ⚠️ <strong>EVENTO DE CRISIS ACTIVADO:</strong> Un incidente inesperado requiere tu atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Timer and Progress */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Tiempo Transcurrido</p>
              <p className="text-lg font-bold text-gray-900">{elapsedMinutes} min</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Progreso</p>
              <p className="text-lg font-bold text-gray-900">{progress}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 col-span-2 md:col-span-1">
          <div>
            <p className="text-xs text-gray-600">Módulos Activos</p>
            <p className="text-lg font-bold text-gray-900">{course.modules.length}</p>
          </div>
        </Card>
      </div>

      {/* Main Content - Dynamic Tabs */}
      <Tabs defaultValue="communication" className="w-full">
        <TabsList className="grid w-full gap-2 mb-6">
          {course.modules.includes('chat_ia') && <TabsTrigger value="communication">Comunicación</TabsTrigger>}
          {(course.modules.includes('hoja_calculo') || course.modules.includes('herramientas')) && (
            <TabsTrigger value="tools">Herramientas</TabsTrigger>
          )}
          {course.modules.includes('documentos') && <TabsTrigger value="documents">Documentación</TabsTrigger>}
          {course.modules.includes('email_simulado') && <TabsTrigger value="email">Inbox</TabsTrigger>}
        </TabsList>

        {/* Communication Module */}
        {course.modules.includes('chat_ia') && (
          <TabsContent value="communication" className="w-full">
            <CommunicationModule
              courseFamily={course.family}
              onMessageSend={async (msg) => {
                if (onAction) {
                  onAction('message_sent', { message: msg, course_id: course.course_id });
                }
              }}
            />
          </TabsContent>
        )}

        {/* Tools Module */}
        {(course.modules.includes('hoja_calculo') || course.modules.includes('herramientas')) && (
          <TabsContent value="tools" className="w-full">
            <ToolsModule
              courseFamily={course.family}
              tools={course.modules}
              onCalculate={(data) => {
                if (onAction) {
                  onAction('calculation', { ...data, course_id: course.course_id });
                }
              }}
            />
          </TabsContent>
        )}

        {/* Documentation Module */}
        {course.modules.includes('documentos') && (
          <TabsContent value="documents" className="w-full">
            <DocumentationModule
              courseFamily={course.family}
              onUpload={async (file) => {
                if (onAction) {
                  onAction('document_uploaded', { filename: file.name, size: file.size, course_id: course.course_id });
                }
              }}
            />
          </TabsContent>
        )}

        {/* Email Module */}
        {course.modules.includes('email_simulado') && (
          <TabsContent value="email" className="w-full">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Inbox de Correos Simulados</h3>
              <div className="space-y-3">
                {[
                  {
                    from: 'cliente@empresa.ar',
                    subject: 'Solicitud Urgente',
                    preview: 'Necesito una cotización para...',
                  },
                  {
                    from: 'jefe@aseguradora.com',
                    subject: 'Siniestro Reportado',
                    preview: 'Llega un caso de siniestro total que debe ser procesado...',
                  },
                ].map((email, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => onAction?.('email_opened', { from: email.from, subject: email.subject })}
                  >
                    <p className="font-medium text-sm">{email.subject}</p>
                    <p className="text-xs text-gray-600">{email.from}</p>
                    <p className="text-xs text-gray-500 mt-1">{email.preview}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Evaluation Criteria */}
      <Card className="mt-6 p-4 bg-blue-50">
        <h3 className="font-bold text-sm text-blue-900 mb-3">Criterios de Evaluación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {course.eval_criteria.map((criterion, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-blue-900">{criterion}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DynamicInterface;

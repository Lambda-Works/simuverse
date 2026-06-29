import { Injectable } from '@nestjs/common';

export type CrisisSeverity = 'low' | 'medium' | 'high';

export interface CrisisOption {
  id: string;
  text: string;
  score: number;
  feedback: string;
  tags: string[];
}

export interface CrisisEvent {
  id: string;
  simulationId: string;
  title: string;
  description: string;
  severity: CrisisSeverity;
  options: CrisisOption[];
  selectedOptionId?: string;
  score?: number;
  feedback?: string;
  startedAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved';
  courseFamily: string;
}

// Crisis banks per course family
const CRISIS_BANKS: Record<string, Array<Omit<CrisisEvent, 'id' | 'simulationId' | 'startedAt' | 'status' | 'selectedOptionId' | 'score' | 'feedback' | 'courseFamily'>>> = {
  administracion: [
    {
      title: '🚨 Error crítico en liquidación de sueldos',
      description: 'El sistema de liquidación procesó un coeficiente de aportes incorrecto para los 47 empleados del mes.',
      severity: 'high',
      options: [
        { id: 'a', text: 'Reliquidar de inmediato y notificar a todos.', score: 95, feedback: 'Excelente decisión.', tags: ['transparency', 'urgency'] },
        { id: 'b', text: 'Esperar al próximo período.', score: 30, feedback: 'Incorrecto.', tags: ['delay', 'risk'] },
        { id: 'c', text: 'Notificar solo a los afectados >5%.', score: 60, feedback: 'Parcialmente correcto.', tags: ['partial'] },
      ],
    },
  ],
  rrhh: [
    {
      title: '🔥 Renuncia masiva del equipo de ventas',
      description: 'Cinco integrantes del equipo de ventas presentaron su renuncia el mismo día.',
      severity: 'high',
      options: [
        { id: 'a', text: 'Entrevistas de salida urgentes + plan de retención.', score: 95, feedback: 'Excelente enfoque estratégico.', tags: ['empathy', 'strategy'] },
        { id: 'b', text: 'Proceso de selección masivo.', score: 50, feedback: 'Necesario pero insuficiente.', tags: ['reactive'] },
        { id: 'c', text: 'Pedir que reconsideren.', score: 35, feedback: 'Insuficiente.', tags: ['poor_communication'] },
      ],
    },
  ],
  informatica: [
    {
      title: '🔴 Servidor de producción caído',
      description: 'El servidor principal cayó en horario pico. 2.000 usuarios afectados.',
      severity: 'high',
      options: [
        { id: 'a', text: 'Activar contingencia + comunicar + post-mortem.', score: 100, feedback: 'Respuesta de manual.', tags: ['incident_management'] },
        { id: 'b', text: 'Reiniciar sin diagnóstico.', score: 35, feedback: 'Arriesgado.', tags: ['risk'] },
        { id: 'c', text: 'Escalar a DevOps y esperar.', score: 60, feedback: 'Correcto escalar, pero debés actuar en paralelo.', tags: ['partial'] },
      ],
    },
  ],
  emprendimiento: [
    {
      title: '📦 Proveedor principal canceló el contrato',
      description: 'Tu proveedor notificó la cancelación con 72 horas de anticipación.',
      severity: 'high',
      options: [
        { id: 'a', text: 'Contactar alternativos + comunicar demoras.', score: 90, feedback: 'Excelente gestión de crisis.', tags: ['crisis_management'] },
        { id: 'b', text: 'Cancelar todo y devolver dinero.', score: 40, feedback: 'Solución segura pero daña reputación.', tags: ['conservative'] },
        { id: 'c', text: 'No comunicar nada.', score: 10, feedback: 'Incorrecto.', tags: ['poor_communication'] },
      ],
    },
  ],
};

const DEFAULT_CRISIS = [
  {
    title: '⏰ Deadline crítico adelantado',
    description: 'El cliente adelantó la entrega del proyecto en 5 días.',
    severity: 'high' as CrisisSeverity,
    options: [
      { id: 'a', text: 'Renegociar alcance + reforzar equipo.', score: 90, feedback: 'Gestión estratégica.', tags: ['negotiation'] },
      { id: 'b', text: 'Horas extra sin cargo.', score: 30, feedback: 'Insostenible.', tags: ['risk'] },
      { id: 'c', text: 'Aceptar sin cambios.', score: 45, feedback: 'Comprometerse sin revisar.', tags: ['reactive'] },
    ],
  },
];

@Injectable()
export class CrisisEngine {
  private activeEvents = new Map<string, CrisisEvent>();

  private getCrisisPool(courseFamily: string): typeof DEFAULT_CRISIS {
    return CRISIS_BANKS[courseFamily.toLowerCase()] || DEFAULT_CRISIS;
  }

  private customToEvent(raw: any, simulationId: string): CrisisEvent {
    const options: CrisisOption[] = (Array.isArray(raw.options) ? raw.options : []).map(
      (opt: any, i: number) => ({
        id: String.fromCharCode(97 + i),
        text: opt.text || `Opción ${i + 1}`,
        score: Number(opt.score) || 0,
        feedback: opt.feedback || '',
        tags: [],
      }),
    );

    return {
      id: `crisis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      simulationId,
      courseFamily: 'custom',
      status: 'active',
      startedAt: new Date(),
      title: raw.title || '🚨 Situación crítica',
      description: raw.description || '',
      severity: raw.severity || 'medium',
      options,
    };
  }

  getOrCreateCrisis(
    simulationId: string,
    courseFamily: string,
    customEvents?: any[],
  ): CrisisEvent {
    if (this.activeEvents.has(simulationId)) {
      return this.activeEvents.get(simulationId)!;
    }

    let event: CrisisEvent;

    if (Array.isArray(customEvents) && customEvents.length > 0) {
      const raw = customEvents[Math.floor(Math.random() * customEvents.length)];
      event = this.customToEvent(raw, simulationId);
    } else {
      const pool = this.getCrisisPool(courseFamily);
      const template = pool[Math.floor(Math.random() * pool.length)];
      event = {
        id: `crisis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        simulationId,
        courseFamily,
        status: 'active',
        startedAt: new Date(),
        ...template,
      };
    }

    this.activeEvents.set(simulationId, event);
    return event;
  }

  resolveCrisis(simulationId: string, optionId: string): CrisisEvent | null {
    const event = this.activeEvents.get(simulationId);
    if (!event || event.status === 'resolved') return event ?? null;

    const chosen = event.options.find((o) => o.id === optionId);
    if (!chosen) return null;

    event.selectedOptionId = optionId;
    event.score = chosen.score;
    event.feedback = chosen.feedback;
    event.resolvedAt = new Date();
    event.status = 'resolved';

    this.activeEvents.set(simulationId, event);
    return event;
  }

  clearCrisis(simulationId: string): void {
    this.activeEvents.delete(simulationId);
  }

  clearAll(): void {
    this.activeEvents.clear();
  }
}

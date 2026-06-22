/**
 * CrisisEngine — Motor de Crisis Situacionales
 *
 * Genera eventos de crisis realistas basados en la familia del curso.
 * El alumno debe elegir una respuesta estratégica; cada opción tiene un puntaje
 * y retroalimentación pedagógica.
 *
 * Almacenamiento: Map en memoria (por simulation_id).
 * El estado persiste mientras el proceso esté activo; si el server reinicia,
 * el alumno recibe una crisis nueva — comportamiento esperado para sesiones activas.
 */

export type CrisisSeverity = 'low' | 'medium' | 'high';

export interface CrisisOption {
  id: string;
  text: string;
  score: number;       // 0–100
  feedback: string;
  tags: string[];      // e.g. ['good_communication', 'escalation']
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

// ─── Banco de crisis por familia ─────────────────────────────────────────────

const CRISIS_BANKS: Record<string, Omit<CrisisEvent, 'id' | 'simulationId' | 'startedAt' | 'status' | 'selectedOptionId' | 'score' | 'feedback' | 'courseFamily'>[]> = {
  administracion: [
    {
      title: '🚨 Error crítico en liquidación de sueldos',
      description:
        'El sistema de liquidación procesó un coeficiente de aportes incorrecto para los 47 empleados del mes. Los recibos ya fueron impresos y algunos empleados los recibieron. El cierre contable es en 2 horas.',
      severity: 'high',
      options: [
        {
          id: 'a',
          text: 'Reliquidar de inmediato, notificar a todos los empleados por correo y emitir recibos rectificativos antes del cierre.',
          score: 95,
          feedback: 'Excelente decisión. Transparencia y corrección oportuna son pilares del área administrativa.',
          tags: ['transparency', 'urgency', 'compliance'],
        },
        {
          id: 'b',
          text: 'Esperar al próximo período y ajustar en la liquidación siguiente para evitar rehacer todo.',
          score: 30,
          feedback: 'Incorrecto. Diferir errores de liquidación viola normativas laborales y puede generar multas.',
          tags: ['delay', 'risk'],
        },
        {
          id: 'c',
          text: 'Notificar solo a los empleados afectados en más de un 5 % y hacer la corrección selectiva.',
          score: 60,
          feedback: 'Parcialmente correcto. La notificación selectiva reduce el impacto pero no es la práctica más transparente.',
          tags: ['partial', 'communication'],
        },
      ],
    },
    {
      title: '⚠️ Auditoría sorpresa de AFIP',
      description:
        'El organismo fiscal avisó que iniciará una auditoría en 48 horas. Detectaste que hay 3 meses de declaraciones juradas desactualizadas.',
      severity: 'medium',
      options: [
        {
          id: 'a',
          text: 'Presentar rectificativas antes de la auditoría, informar al gerente y preparar toda la documentación de respaldo.',
          score: 90,
          feedback: 'Correcto. La regularización proactiva demuestra buena fe y puede reducir sanciones.',
          tags: ['proactive', 'compliance', 'communication'],
        },
        {
          id: 'b',
          text: 'No presentar nada y esperar que el auditor no revise esos períodos.',
          score: 5,
          feedback: 'Incorrecto. Ocultar información ante una auditoría configura evasión y agrava las penalidades.',
          tags: ['risk', 'non_compliance'],
        },
        {
          id: 'c',
          text: 'Presentar las rectificativas durante la auditoría explicando el error administrativo.',
          score: 65,
          feedback: 'Aceptable, aunque presentar antes muestra mayor proactividad y puede generar mejor imagen ante el fisco.',
          tags: ['late', 'partial_compliance'],
        },
      ],
    },
  ],

  rrhh: [
    {
      title: '🔥 Renuncia masiva del equipo de ventas',
      description:
        'Cinco integrantes del equipo de ventas presentaron su renuncia el mismo día, alegando mal clima laboral. La campaña más importante del año comienza en 3 semanas.',
      severity: 'high',
      options: [
        {
          id: 'a',
          text: 'Convocar entrevistas de salida urgentes, identificar las causas raíz, y diseñar un plan de retención y reemplazo simultáneo.',
          score: 95,
          feedback: 'Excelente enfoque estratégico. Diagnosticar antes de actuar evita repetir el problema.',
          tags: ['empathy', 'strategy', 'urgency'],
        },
        {
          id: 'b',
          text: 'Lanzar inmediatamente un proceso de selección masivo para cubrir las vacantes.',
          score: 50,
          feedback: 'Necesario pero insuficiente. Sin diagnóstico, los nuevos ingresantes enfrentarán el mismo clima negativo.',
          tags: ['reactive', 'partial'],
        },
        {
          id: 'c',
          text: 'Hablar con el gerente para cuestionar las renuncias y pedir a los empleados que reconsideren.',
          score: 35,
          feedback: 'Insuficiente. Sin abordar las causas del clima laboral, la retención forzada no es sostenible.',
          tags: ['reactive', 'poor_communication'],
        },
      ],
    },
    {
      title: '⚠️ Conflicto entre supervisor y empleado',
      description:
        'Un empleado formalizó una denuncia por acoso laboral contra su supervisor. Ambos trabajan en el mismo equipo y el ambiente está muy tenso.',
      severity: 'high',
      options: [
        {
          id: 'a',
          text: 'Iniciar el protocolo formal de investigación, separar temporalmente a las partes y garantizar confidencialidad.',
          score: 100,
          feedback: 'Perfecto. El protocolo formal protege a ambas partes y cumple con la legislación vigente.',
          tags: ['compliance', 'empathy', 'process'],
        },
        {
          id: 'b',
          text: 'Llamar a ambos a una reunión conjunta para que resuelvan el conflicto entre ellos.',
          score: 10,
          feedback: 'Incorrecto. La confrontación directa en denuncias de acoso puede revictimizar al denunciante.',
          tags: ['risk', 'non_compliance'],
        },
        {
          id: 'c',
          text: 'Trasladar al empleado denunciante a otro equipo mientras se investiga.',
          score: 40,
          feedback: 'Insuficiente y potencialmente discriminatorio. El traslado del denunciante puede interpretarse como sanción.',
          tags: ['partial', 'risk'],
        },
      ],
    },
  ],

  informatica: [
    {
      title: '🔴 Servidor de producción caído',
      description:
        'El servidor principal cayó en horario pico. Hay 2.000 usuarios afectados. No hay respaldo automático activo. El equipo de soporte espera instrucciones.',
      severity: 'high',
      options: [
        {
          id: 'a',
          text: 'Activar el servidor de contingencia, comunicar el incidente al cliente con ETA de resolución, y abrir un post-mortem inmediato.',
          score: 100,
          feedback: 'Respuesta de manual. Comunicación + contingencia + aprendizaje = gestión profesional de incidentes.',
          tags: ['incident_management', 'communication', 'urgency'],
        },
        {
          id: 'b',
          text: 'Intentar reiniciar el servidor de producción sin diagnóstico previo para restaurar el servicio lo antes posible.',
          score: 35,
          feedback: 'Arriesgado. Reiniciar sin diagnóstico puede provocar corrupción de datos si la causa es un proceso colgado.',
          tags: ['risk', 'reactive'],
        },
        {
          id: 'c',
          text: 'Escalar a DevOps y esperar que ellos tomen la decisión mientras se continúa diagnosticando.',
          score: 60,
          feedback: 'Correcto escalar, pero debés tomar acciones de contención en paralelo, no solo esperar.',
          tags: ['escalation', 'partial'],
        },
      ],
    },
    {
      title: '⚠️ Vulnerabilidad de seguridad detectada en producción',
      description:
        'Un investigador de seguridad reportó una inyección SQL en el formulario de login. La vulnerabilidad está activa en producción.',
      severity: 'high',
      options: [
        {
          id: 'a',
          text: 'Deshabilitar el formulario afectado, notificar al equipo de seguridad, parchear y hacer un análisis de impacto antes de reactivar.',
          score: 95,
          feedback: 'Correcto. Cortar la superficie de ataque primero, luego parchear y analizar.',
          tags: ['security', 'compliance', 'urgency'],
        },
        {
          id: 'b',
          text: 'Parchear directamente en producción para minimizar el tiempo de exposición.',
          score: 50,
          feedback: 'El parche directo en producción sin prueba puede introducir nuevos bugs. Considerar entorno staging.',
          tags: ['risk', 'partial'],
        },
        {
          id: 'c',
          text: 'Agradecer al investigador y programar el fix para el próximo sprint.',
          score: 5,
          feedback: 'Inaceptable. Una vulnerabilidad activa no puede quedar en el backlog.',
          tags: ['risk', 'non_compliance'],
        },
      ],
    },
  ],

  emprendimiento: [
    {
      title: '📦 Proveedor principal canceló el contrato',
      description:
        'Tu proveedor principal notificó la cancelación del contrato con 72 horas de anticipación. Tenés 400 órdenes pendientes de entrega la semana próxima.',
      severity: 'high',
      options: [
        {
          id: 'a',
          text: 'Contactar proveedores alternativos de inmediato, comunicar demoras a los clientes con compensación y negociar con el proveedor original.',
          score: 90,
          feedback: 'Excelente gestión de crisis. Comunicación proactiva + búsqueda de alternativas + negociación simultánea.',
          tags: ['crisis_management', 'communication', 'negotiation'],
        },
        {
          id: 'b',
          text: 'Cancelar todas las órdenes y devolver el dinero a los clientes.',
          score: 40,
          feedback: 'Solución segura pero que daña la reputación del negocio y pierde ingresos que podrían recuperarse.',
          tags: ['conservative', 'partial'],
        },
        {
          id: 'c',
          text: 'No comunicar nada todavía y esperar a ver si el proveedor se retracta.',
          score: 10,
          feedback: 'Incorrecto. La falta de comunicación proactiva con los clientes genera mayor pérdida de confianza.',
          tags: ['risk', 'poor_communication'],
        },
      ],
    },
    {
      title: '⭐ Reseña viral negativa en redes',
      description:
        'Un influencer con 200K seguidores publicó una crítica negativa sobre tu producto, con errores factuales. El posteo tiene 5.000 interacciones en 6 horas.',
      severity: 'medium',
      options: [
        {
          id: 'a',
          text: 'Responder públicamente con datos precisos, ofrecer resolver el problema directamente y contactar al influencer en privado.',
          score: 95,
          feedback: 'Correcto. Respuesta pública con hechos + canal privado de resolución = gestión profesional de reputación.',
          tags: ['communication', 'crisis_management', 'empathy'],
        },
        {
          id: 'b',
          text: 'Ignorar el posteo para no amplificar el alcance.',
          score: 25,
          feedback: 'Incorrecto. El silencio ante críticas con errores factuales puede leerse como confirmación de los hechos.',
          tags: ['risk', 'passive'],
        },
        {
          id: 'c',
          text: 'Contactar al influencer privadamente para pedirle que borre el posteo.',
          score: 55,
          feedback: 'Parcialmente correcto. El contacto privado es parte de la solución, pero también se necesita respuesta pública.',
          tags: ['partial', 'communication'],
        },
      ],
    },
  ],
};

// Banco genérico (fallback para familias no mapeadas)
const DEFAULT_CRISIS = [
  {
    title: '⏰ Deadline crítico adelantado',
    description:
      'El cliente adelantó la entrega del proyecto en 5 días. El equipo ya está al límite de capacidad y hay tareas críticas sin finalizar.',
    severity: 'high' as CrisisSeverity,
    options: [
      {
        id: 'a',
        text: 'Renegociar el alcance con el cliente, eliminar features no esenciales y reforzar el equipo temporalmente.',
        score: 90,
        feedback: 'Gestión estratégica: ajustar el alcance + comunicar + reforzar recursos es la respuesta óptima.',
        tags: ['negotiation', 'scope', 'communication'],
      },
      {
        id: 'b',
        text: 'Pedir que todo el equipo trabaje horas extra sin cargo adicional.',
        score: 30,
        feedback: 'Insostenible y desmotivador. Las horas extra sin compensación generan burnout y rotación.',
        tags: ['risk', 'poor_management'],
      },
      {
        id: 'c',
        text: 'Aceptar el nuevo deadline sin cambios y comenzar a trabajar más rápido.',
        score: 45,
        feedback: 'Comprometerse sin revisar el alcance o recursos suele resultar en entrega de baja calidad.',
        tags: ['risk', 'reactive'],
      },
    ],
  },
];

// ─── CrisisEngine class ───────────────────────────────────────────────────────

const activeEvents = new Map<string, CrisisEvent>();

export class CrisisEngine {
  private getCrisisPool(courseFamily: string): typeof DEFAULT_CRISIS {
    return (CRISIS_BANKS[courseFamily.toLowerCase()] as typeof DEFAULT_CRISIS) || DEFAULT_CRISIS;
  }

  /**
   * Convierte un evento custom (CrisisEventConfig del frontend) al formato interno CrisisEvent.
   */
  private customToEvent(raw: any, simulationId: string): CrisisEvent {
    const options: CrisisOption[] = (Array.isArray(raw.options) ? raw.options : []).map((opt: any, i: number) => ({
      id: String.fromCharCode(97 + i),  // 'a', 'b', 'c'
      text: opt.text || `Opción ${i + 1}`,
      score: Number(opt.score) || 0,
      feedback: opt.feedback || '',
      tags: [],
    }));

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

  /**
   * Devuelve el evento de crisis activo para una simulación.
   * Si no existe, genera uno nuevo.
   * Si el curso tiene crisis_events personalizados (formato CrisisEventConfig[]) los usa
   * con prioridad sobre el banco incorporado.
   */
  getOrCreateCrisis(simulationId: string, courseFamily: string, customEvents?: any[]): CrisisEvent {
    if (activeEvents.has(simulationId)) {
      return activeEvents.get(simulationId)!;
    }

    let event: CrisisEvent;

    if (Array.isArray(customEvents) && customEvents.length > 0) {
      // Usar eventos personalizados del curso
      const raw = customEvents[Math.floor(Math.random() * customEvents.length)];
      event = this.customToEvent(raw, simulationId);
    } else {
      // Usar banco incorporado según familia
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

    activeEvents.set(simulationId, event);
    return event;
  }

  /**
   * Registra la respuesta del alumno y resuelve el evento.
   * Devuelve el evento actualizado con score y feedback.
   */
  resolvecrisis(simulationId: string, optionId: string): CrisisEvent | null {
    const event = activeEvents.get(simulationId);
    if (!event || event.status === 'resolved') return event ?? null;

    const chosen = event.options.find(o => o.id === optionId);
    if (!chosen) return null;

    event.selectedOptionId = optionId;
    event.score = chosen.score;
    event.feedback = chosen.feedback;
    event.resolvedAt = new Date();
    event.status = 'resolved';

    activeEvents.set(simulationId, event);
    return event;
  }

  /** Limpia el estado de una simulación (al completar/abandonar) */
  clearCrisis(simulationId: string): void {
    activeEvents.delete(simulationId);
  }

  /** Devuelve el evento sin las opciones (para mostrar al alumno antes de elegir) */
  toPublicView(event: CrisisEvent): Omit<CrisisEvent, never> {
    return event;
  }
}

export const crisisEngine = new CrisisEngine();

/**
 * MOTOR DE FLUJOS REUTILIZABLES (MSM)
 * Sistema de plantillas JSON para los 40 cursos
 * Estructura: Entrada (Inbox) → Proceso (Herramienta) → Salida (Auditoría)
 */

export interface PersonaConfig {
  base_role: string;
  course_context: string;
  personality_traits: string[];
  knowledge_base_prompt: string;
  emotional_state?: string;
  objectives?: string[];
}

export interface ToolConfig {
  type: 'chat_ia' | 'calculator' | 'email' | 'spreadsheet' | 'document_viewer' | 'text_editor' | 'code_console';
  name: string;
  description: string;
  fields?: Array<{ name: string; type: string; label: string; placeholder?: string }>;
  calculations?: Array<{ formula: string; description: string }>;
}

export interface CrisisEvent {
  trigger_minutes: number;
  event_text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger_type: 'time' | 'keyword' | 'action_count';
  ai_reaction?: string;
  visual_effect?: 'pulse' | 'color_change' | 'notification';
}

export interface EvaluationCriteria {
  name: string;
  description: string;
  weight: number; // 0-1
  indicators: string[];
  success_keywords?: string[];
  failure_keywords?: string[];
  auto_detection: boolean;
}

export interface FlowTemplate {
  id: string;
  course_id: string;
  course_code: string;
  title: string;
  family: 'administracion' | 'rrhh' | 'tecnologia' | 'ventas' | 'clubes' | 'industria';
  description: string;
  version: string;
  
  // Entrada: Lo que ve el alumno al iniciar
  inbox: {
    initial_messages: Array<{
      from: string;
      subject: string;
      body: string;
      timestamp?: string;
      priority: 'low' | 'normal' | 'high';
      email_type?: 'client' | 'boss' | 'colleague' | 'admin';
    }>;
    email_context?: string;
  };

  // Persona IA
  persona: PersonaConfig;

  // Proceso: Herramientas disponibles
  tools: ToolConfig[];

  // Crisis Engine
  crisis_events: CrisisEvent[];

  // Salida: Cómo se evalúa
  evaluation: {
    criteria: EvaluationCriteria[];
    final_score_formula?: string;
    time_limit_minutes?: number;
    min_score_to_pass: number;
  };

  // Metadata
  created_by?: string;
  created_at?: string;
  is_active: boolean;
  tags?: string[];
}

// ==========================================
// PLANTILLA 1: SEGUROS DE VIDA
// ==========================================
export const TEMPLATE_SEGUROS_VIDA: FlowTemplate = {
  id: 'tpl-seguros-vida-01',
  course_id: 'SEGUROS_01',
  course_code: 'ADM3534',
  title: 'Simulación de Seguros de Vida',
  family: 'administracion',
  description: 'El alumno actúa como asesor de seguros atendiendo a un cliente que busca protección familiar.',
  version: '1.0.0',
  
  inbox: {
    initial_messages: [
      {
        from: 'Lucas G. (Cliente Potencial)',
        subject: 'Consulta por protección familiar',
        body: `Hola, buen día. Me contacto porque estuve pensando mucho en el futuro de mi familia. 
Tengo 35 años, trabajo en una empresa de logística aquí en Rosario y tengo dos hijos chiquitos. 
Mi mayor miedo es que, si a mí me pasa algo, ellos no puedan seguir con su nivel de vida o terminar sus estudios. 
No entiendo mucho de pólizas, pero busco algo que me dé tranquilidad. ¿Qué me podrías recomendar?`,
        priority: 'high',
        email_type: 'client',
      },
    ],
    email_context: 'Oficina de seguros en Rosario. Atención de cliente potencial.',
  },

  persona: {
    base_role: `Eres Lucas Mendoza, un hombre de 35 años, padre de familia que acaba de recibir un diagnóstico de salud preocupante. 
Estás buscando un seguro de vida para proteger a tu familia. Eres cauteloso con el dinero, haces muchas preguntas y desconfías 
un poco de los vendedores de seguros. Tu presupuesto es limitado (~$8000/mes). Tienes dos hijos: uno de 8 años en colegio privado y otro de 5.`,
    
    course_context: `Simulación en una oficina de seguros. El alumno es un asesor junior que debe atender a este cliente potencial. 
La empresa ofrece 3 planes: Básico ($5000/mes - cobertura $5M), Estándar ($12000/mes - cobertura $15M), 
Premium ($25000/mes - cobertura $30M con cobertura crítica).`,
    
    personality_traits: ['cauteloso', 'preguntón', 'ansioso', 'desconfiado', 'familiar', 'pragmático'],
    
    knowledge_base_prompt: `PLANES DISPONIBLES:
- Plan Básico: Cobertura por fallecimiento $5M, sin cobertura de enfermedades críticas, $5000/mes
- Plan Estándar: Cobertura por fallecimiento $15M, cobertura parcial de enfermedades críticas, incluye hospitalización, $12000/mes
- Plan Premium: Cobertura total $30M, enfermedades críticas completo, hospitalización y rehabilitación, beneficiarios múltiples, $25000/mes

REGULACIÓN: Ley de Seguros 17.418, Superintendencia de Seguros de la Nación. 
RECOMENDACIÓN ÉTICA: Diagnosticar necesidades antes de vender. Transparencia sobre preexistencias obligatoria.`,
    
    emotional_state: 'preocupado pero dispuesto a aprender',
    objectives: ['encontrar protección familiar', 'validar que el asesor es confiable', 'entender las opciones sin presión'],
  },

  tools: [
    {
      type: 'calculator',
      name: 'Cotizador de Suma Asegurada',
      description: 'Calcula el capital necesario para educación de hijos y gastos familiares',
      fields: [
        { name: 'gasto_educativo_anual', type: 'number', label: 'Gasto Educativo Anual ($)', placeholder: '1,800,000' },
        { name: 'anos_restantes', type: 'number', label: 'Años hasta graduación', placeholder: '13' },
        { name: 'gastos_sepelio', type: 'number', label: 'Gastos de Sepelio ($)', placeholder: '150,000' },
      ],
      calculations: [
        { formula: '(gasto_educativo_anual × anos_restantes) + gastos_sepelio', description: 'Capital Asegurado Base' },
        { formula: 'capital_base × 1.15', description: 'Ajuste por inflación (15%)' },
      ],
    },
    {
      type: 'document_viewer',
      name: 'Carpeta de Pólizas',
      description: 'Documentación de los planes disponibles',
    },
    {
      type: 'chat_ia',
      name: 'Chat con Lucas',
      description: 'Conversación con el cliente virtual',
    },
  ],

  crisis_events: [
    {
      trigger_minutes: 5,
      event_text: 'Lucas recibe una llamada de su esposa y se pone nervioso. "Ella me pregunta si ya lo definiste..."',
      severity: 'medium',
      trigger_type: 'time',
      ai_reaction: 'El cliente se distrae, necesita que lo reconcentres rápido.',
      visual_effect: 'notification',
    },
    {
      trigger_minutes: 12,
      event_text: 'Lucas menciona: "Un amigo me dijo que los seguros son una estafa. ¿Cómo sé que no estoy siendo engañado?"',
      severity: 'high',
      trigger_type: 'keyword',
      ai_reaction: 'Necesita datos concretos y referencias de regulación para recuperar confianza.',
      visual_effect: 'color_change',
    },
  ],

  evaluation: {
    criteria: [
      {
        name: 'Empatía y Escucha Activa',
        description: 'Capacidad de entender las preocupaciones reales del cliente',
        weight: 0.25,
        indicators: ['hace preguntas abiertas', 'valida emociones', 'no interrumpe'],
        success_keywords: ['entiendo', 'preocupación', 'te acompaño', 'necesidad'],
        auto_detection: true,
      },
      {
        name: 'Conocimiento Técnico',
        description: 'Dominio de regulaciones, planes y cálculos de suma asegurada',
        weight: 0.25,
        indicators: ['menciona regulación', 'usa fórmula correcta', 'explica coberturas'],
        success_keywords: ['Ley 17.418', 'capital asegurado', 'cobertura', 'prima'],
        auto_detection: true,
      },
      {
        name: 'Ética Profesional',
        description: 'Transparencia sobre preexistencias y recomendación adecuada',
        weight: 0.25,
        indicators: ['pregunta sobre preexistencias', 'desaconseja overbuying', 'declara exclusiones'],
        success_keywords: ['declaración jurada', 'exclusión', 'transparencia', 'normativa'],
        auto_detection: true,
      },
      {
        name: 'Cierre de Venta',
        description: 'Capacidad de llegar a un acuerdo ético sin presión',
        weight: 0.25,
        indicators: ['propone solución concreta', 'cliente acepta', 'próximos pasos claros'],
        success_keywords: ['acuerdo', 'próxima paso', 'solicitud', 'confirmación'],
        auto_detection: true,
      },
    ],
    min_score_to_pass: 70,
    time_limit_minutes: 20,
  },

  is_active: true,
  tags: ['seguros', 'venta', 'ética', 'familia'],
};

// ==========================================
// PLANTILLA 2: LIQUIDACIÓN DE SUELDOS
// ==========================================
export const TEMPLATE_LIQUIDACION_SUELDOS: FlowTemplate = {
  id: 'tpl-sueldos-01',
  course_id: 'SUELDOS_01',
  course_code: 'ADM5536',
  title: 'Asistente Certificado en Liquidación de Sueldos',
  family: 'administracion',
  description: 'El alumno procesa liquidaciones de sueldo aplicando ley de contrato colectivo y normativas fiscales.',
  version: '1.0.0',

  inbox: {
    initial_messages: [
      {
        from: 'RRHH - Fábrica Norte',
        subject: 'Novedades Mensuales: Juan Pérez (Chofer)',
        body: `NOVEDADES DEL MES:
- Empleado: Juan Pérez
- Puesto: Chofer de Camión
- Sueldo Base: $450,000
- Feriado Nacional trabajado: 1 día (Requiere recargo según CCT)
- Horas Extra al 50%: 5 horas
- Licencia sin goce: 2 días

Procesar liquidación mensual aplicando CCT 130/75 (Comercio). Fecha de liquidación: 5 del mes.`,
        priority: 'high',
        email_type: 'boss',
      },
    ],
    email_context: 'Departamento RRHH. Procesamiento de liquidaciones mensuales conforme normativa.',
  },

  persona: {
    base_role: 'Eres Juan Pérez, un empleado de 15 años en la empresa. Necesitas tu liquidación correcta para vivir. Eres cauteloso con el dinero y verificas cada concepto.',
    course_context: 'Simulación en un departamento de contabilidad. El alumno es asistente de liquidaciones y debe procesar correctamente el sueldo de Juan.',
    personality_traits: ['cuidadoso', 'verificador', 'pragmático', 'preocupado por exactitud'],
    knowledge_base_prompt: `CCT 130/75 - COMERCIO:
- Sueldo básico: línea base
- Feriado trabajado: 100% recargo + día de descanso compensatorio
- Horas extra 50%: cálculo sobre valor de hora
- Horas extra 100%: doble cálculo
- Descanso sin trabajar: se descuenta solo si justificado

RETENCIONES OBLIGATORIAS:
- AFP (Fondo de Pensión): 10% sobre base imponible
- Ley 19.032 (Ganancia): 5-9% sobre base
- Obra Social: 3% sobre base

DESCUENTOS:
- Días de inasistencia sin aviso: se desecuentan
- Licencia sin goce: se descuentan del bruto

BASE IMPONIBLE = Bruto - Descuentos Legales - No Remunerativos`,
    emotional_state: 'preocupado pero confiado en el proceso',
  },

  tools: [
    {
      type: 'spreadsheet',
      name: 'Planilla de Liquidación',
      description: 'Grilla para cargar conceptos y cálculos',
      fields: [
        { name: 'sueldo_base', type: 'number', label: 'Sueldo Base', placeholder: '450000' },
        { name: 'horas_extra_50', type: 'number', label: 'Horas Extra 50%', placeholder: '5' },
        { name: 'feriados_trabajados', type: 'number', label: 'Feriados Trabajados', placeholder: '1' },
        { name: 'dias_inasistencia', type: 'number', label: 'Días Inasistencia', placeholder: '0' },
        { name: 'licencia_sin_goce', type: 'number', label: 'Días Licencia S/G', placeholder: '2' },
      ],
      calculations: [
        { formula: 'sueldo_base + (horas_extra_50 * valor_hora * 1.5) + (feriados_trabajados * valor_diario * 2) - (dias_inasistencia * valor_diario) - (licencia_sin_goce * valor_diario)', description: 'Bruto Mensual' },
        { formula: 'bruto * 0.10', description: 'AFP' },
        { formula: 'bruto * 0.065', description: 'Ley 19.032' },
        { formula: 'bruto * 0.03', description: 'Obra Social' },
        { formula: 'bruto - retenciones', description: 'NETO A COBRAR' },
      ],
    },
    {
      type: 'document_viewer',
      name: 'CCT 130/75 y Normativas',
      description: 'Referencias legales',
    },
  ],

  crisis_events: [
    {
      trigger_minutes: 8,
      event_text: 'Llama RRHH: "Espera, no me dijeron bien los días... en realidad faltó 3 días, no 2. ¿Cómo lo procesaste?"',
      severity: 'high',
      trigger_type: 'time',
      ai_reaction: 'El alumno debe volver atrás y recalcular. Se evalúa velocidad de corrección.',
      visual_effect: 'notification',
    },
  ],

  evaluation: {
    criteria: [
      {
        name: 'Precisión en Cálculos',
        description: 'Exactitud matemática en retenciones y bruto',
        weight: 0.4,
        indicators: ['formula correcta', 'valores exactos', 'verificación'],
        auto_detection: true,
      },
      {
        name: 'Conocimiento Normativo',
        description: 'Aplicación correcta de CCT y leyes',
        weight: 0.3,
        indicators: ['menciona CCT', 'aplica recargo feriado', 'desactiva correctamente'],
        auto_detection: true,
      },
      {
        name: 'Velocidad de Procesamiento',
        description: 'Tiempo empleado en liquidación',
        weight: 0.2,
        indicators: ['menos de 10 minutos', 'sin retrasos'],
        auto_detection: true,
      },
      {
        name: 'Gestión de Cambios',
        description: 'Capacidad de reprocesar con nuevos datos',
        weight: 0.1,
        indicators: ['actualiza rápido', 'valida cambios'],
        auto_detection: true,
      },
    ],
    min_score_to_pass: 80,
    time_limit_minutes: 15,
  },

  is_active: true,
  tags: ['contabilidad', 'sueldos', 'impuestos', 'CCT'],
};

// ==========================================
// PLANTILLA 3: ORATORIA Y STORYTELLING
// ==========================================
export const TEMPLATE_ORATORIA: FlowTemplate = {
  id: 'tpl-oratoria-01',
  course_id: 'ORATORIA_01',
  course_code: 'RH3657',
  title: 'Facilitador Certificado en Oratoria y Storytelling',
  family: 'rrhh',
  description: 'El alumno debe convencer a un directorio ficticio con un pitch de proyecto usando storytelling.',
  version: '1.0.0',

  inbox: {
    initial_messages: [
      {
        from: 'Directora de Innovación',
        subject: 'URGENTE: Pitch ante Directorio - Proyecto de Automatización',
        body: `Necesitamos tu presentación para el directorio mañana a las 14hs. 
El proyecto es una automatización de procesos que ahorra 40% de tiempo operativo. 
Tienes 5 minutos para convencer a 5 directores que son escépticos. 

OBJETIVO: Obtener aprobación de presupuesto $250.000.

Considera: El directorio NO quiere tecnicismos. Quieren entender el impacto en rentabilidad y personas.
Usa una estructura de STORYTELLING: Inicio (problema), Nudo (solución), Desenlace (beneficio).`,
        priority: 'high',
        email_type: 'boss',
      },
    ],
    email_context: 'Sala de juntas. Presentación ante directorio ejecutivo.',
  },

  persona: {
    base_role: `Eres una Directora de Directorio que representa inversión conservadora. Escéptica de las nuevas ideas. 
Requieres pruebas concretas y ROI claro. Interrumpes si la presentación es aburrida o muy técnica. 
Si el orador usa empatía y datos, bajas la guardia. Tu decisión afecta $250.000 de presupuesto.`,
    course_context: 'Sala de directorio. El alumno debe presentar un proyecto en 5 minutos con storytelling efectivo.',
    personality_traits: ['escéptica', 'pragmática', 'interrumpidora', 'exigente', 'sensible al humor'],
    knowledge_base_prompt: `ESTRUCTURA DE STORYTELLING EFECTIVO:
1. GANCHO (30s): Empieza con una pregunta o dato sorprendente
2. PROBLEMA (1m): Narra el problema en forma humana (impacto en personas)
3. SOLUCIÓN (1.5m): Explica la solución sin tecnicismos
4. PRUEBA (1m): Datos, casos, métricas
5. CIERRE (30s): Llamado a acción + beneficio emocional

EVITAR: Slides aburridos, lecturas, tecnicismos, falta de contacto visual.
BUSCAR: Brevedad, datos concretos, empatía, humor inteligente, call-to-action.`,
    emotional_state: 'escéptica pero abierta a sorpresas',
    objectives: ['entender el ROI', 'sentir confianza en el presentador', 'ver impacto en el negocio'],
  },

  tools: [
    {
      type: 'text_editor',
      name: 'Editor de Guión',
      description: 'Escribe tu pitch estructurado',
      fields: [
        { name: 'gancho', type: 'text', label: 'Gancho (30s - pregunta o dato sorprendente)' },
        { name: 'problema', type: 'text', label: 'Problema (1m - narración humana)' },
        { name: 'solucion', type: 'text', label: 'Solución (1.5m - sin tecnicismos)' },
        { name: 'prueba', type: 'text', label: 'Prueba (1m - datos y casos)' },
        { name: 'cierre', type: 'text', label: 'Cierre (30s - call to action)' },
      ],
    },
    {
      type: 'chat_ia',
      name: 'Simulación de Directora',
      description: 'Directora que evalúa tu pitch en tiempo real',
    },
  ],

  crisis_events: [
    {
      trigger_minutes: 2,
      event_text: 'La Directora te interrumpe: "Demasiados números... ¿Cuál es el problema REAL que resuelves?"',
      severity: 'high',
      trigger_type: 'keyword',
      ai_reaction: 'Necesitas volver a lo emocional, al humano. Prueba su empatía.',
      visual_effect: 'notification',
    },
    {
      trigger_minutes: 4,
      event_text: 'Un director pregunta: "¿Por qué vos y no el equipo de IT que sugiere una solución más barata?"',
      severity: 'critical',
      trigger_type: 'action_count',
      ai_reaction: 'Necesitas diferenciar: ventaja competitiva, experiencia, implementación.',
      visual_effect: 'color_change',
    },
  ],

  evaluation: {
    criteria: [
      {
        name: 'Estructura Narrativa',
        description: 'Gancho → Problema → Solución → Prueba → Cierre',
        weight: 0.25,
        indicators: ['tiene gancho', 'narra problema en forma humana', 'propone solución clara', 'incluye datos'],
        success_keywords: ['problema', 'solución', 'beneficio', 'impacto'],
        auto_detection: true,
      },
      {
        name: 'Concisión y Ritmo',
        description: 'Respeto de tiempos y fluidez',
        weight: 0.25,
        indicators: ['menos de 5m', 'sin pausas largas', 'transiciones fluidas'],
        auto_detection: true,
      },
      {
        name: 'Empatía y Conexión',
        description: 'Capacidad de conectar emocionalmente',
        weight: 0.25,
        indicators: ['valida preocupaciones', 'usa humor', 'hace preguntas retóricas'],
        success_keywords: ['entiendo', 'problema real', 'impacto en personas'],
        auto_detection: true,
      },
      {
        name: 'Datos y ROI',
        description: 'Fundamentación con métricas claras',
        weight: 0.25,
        indicators: ['menciona números concretos', '40% ahorro', '$250.000 presupuesto'],
        auto_detection: true,
      },
    ],
    min_score_to_pass: 75,
    time_limit_minutes: 5,
  },

  is_active: true,
  tags: ['oratoria', 'storytelling', 'presentación', 'liderazgo'],
};

// ==========================================
// PLANTILLA 4: MARKETING DIGITAL - COMMUNITY MANAGER
// ==========================================
export const TEMPLATE_MARKETING_DIGITAL: FlowTemplate = {
  id: 'tpl-marketing-01',
  course_id: 'MARKETING_01',
  course_code: 'EMP57542B',
  title: 'Comunicación en Community Manager',
  family: 'ventas',
  description: 'El alumno gestiona crisis de reputación en redes sociales y crea estrategias de engagement.',
  version: '1.0.0',

  inbox: {
    initial_messages: [
      {
        from: 'Jefe de Redes Sociales',
        subject: '🚨 CRISIS: Comentario negativo en Instagram - Acción Inmediata',
        body: `CRISIS DE REPUTACIÓN EN VIVO

Cliente: @marialopez_87 
Publicación: Nuestro post sobre "Día del Empleado"
Comentario: "Su empresa explotó a mi hermano 3 años. No pagaban horas extra. 
¡Hipócritas hablando de bienestar! Aviso a todos: NO trabajen ahí. 🚩"

LIKES: 245 | REPLIES: 67 | SHARES: 34

SITUACIÓN: En 30 minutos esto puede ser viral. Necesito tu respuesta AHORA.

OBJETIVO: Contener la reputación sin generar más conflicto. 
OPCIONES: Responder publicamente (riesgo), enviar DM privado (humanizar), o ignorar (perder credibilidad)`,
        priority: 'critical',
        email_type: 'boss',
      },
    ],
    email_context: 'Redes sociales de empresa. Crisis de reputación en tiempo real.',
  },

  persona: {
    base_role: `Eres María López, una exemployada frustrada que tuvo mala experiencia laboral hace 3 años. 
Decidiste dejar un comentario público para advertir a otros. Estás enojada pero no eres troll: 
si la empresa responde de forma empática y reconoce el error, podrías cambiar tu opinión. 
Representas a otros empleados silenciosos con quejas similares.`,
    course_context: 'Redes Sociales públicas. El alumno debe gestionar una crisis de reputación.',
    personality_traits: ['enojada', 'desconfiada', 'frustrada', 'protectora de otros', 'sensible a la sinceridad'],
    knowledge_base_prompt: `CRISIS MANAGEMENT EN REDES:
1. NO BORRAR: Parece ocultada
2. RESPONDER RÁPIDO: En máximo 1 hora
3. EMPATÍA PRIMERO: "Entiendo tu frustración..."
4. RESPONSABILIDAD: Reconocer si hubo error
5. SOLUCIÓN: "Te invitamos a dialogar en privado"
6. FOLLOW-UP: Contacto personalizado

ERRORES COMUNES:
- Respuesta robótica o defensiva
- Culpar al cliente
- Promesas vacías
- Ignorar

ESCALA DE CRISIS:
Baja: <50 likes, respuesta en 2h
Media: 50-200 likes, respuesta en 30m, DM privado
Alta: >200 likes, respuesta pública + DM + escalada a directorio
Crítica: >500 likes, >100 shares, requiere comunicado oficial`,
    emotional_state: 'enojada pero dispuesta a escuchar si reconocen el error',
  },

  tools: [
    {
      type: 'text_editor',
      name: 'Redactor de Respuesta Pública',
      description: 'Escribe tu respuesta para publicar en el comentario',
      fields: [
        { name: 'respuesta_publica', type: 'text', label: 'Respuesta Pública (máx 300 caracteres)' },
      ],
    },
    {
      type: 'chat_ia',
      name: 'Mensaje Privado (DM)',
      description: 'Conversación privada para resolver en profundidad',
    },
    {
      type: 'document_viewer',
      name: 'Políticas de Marca',
      description: 'Guía de valores y tono en redes',
    },
  ],

  crisis_events: [
    {
      trigger_minutes: 2,
      event_text: 'Nueva reacción: Otros 5 comentarios de empleados actuales dicen: "Yo también tengo la misma experiencia"',
      severity: 'critical',
      trigger_type: 'time',
      ai_reaction: 'Crisis escalada. Tu respuesta ahora afecta a múltiples personas. Necesitas solidez.',
      visual_effect: 'color_change',
    },
  ],

  evaluation: {
    criteria: [
      {
        name: 'Rapidez de Respuesta',
        description: 'Tiempo empleado en responder',
        weight: 0.2,
        indicators: ['respuesta en primeros 10m'],
        auto_detection: true,
      },
      {
        name: 'Empatía y Humanización',
        description: 'Capacidad de validar emociones del cliente',
        weight: 0.3,
        indicators: ['valida frustración', 'usa nombre del cliente', 'reconoce el error'],
        success_keywords: ['entiendo', 'frustración', 'culpa', 'sentir'],
        auto_detection: true,
      },
      {
        name: 'Tono Profesional',
        description: 'Balance entre humano y profesional',
        weight: 0.25,
        indicators: ['no defensiva', 'no sarcástica', 'clara y respetuosa'],
        auto_detection: true,
      },
      {
        name: 'Propuesta de Solución',
        description: 'Ofrece pasos concretos para resolver',
        weight: 0.25,
        indicators: ['invita a DM', 'ofrece reunión', 'compromiso de acción'],
        success_keywords: ['invitamos', 'dialogar', 'privado', 'solucionar'],
        auto_detection: true,
      },
    ],
    min_score_to_pass: 70,
    time_limit_minutes: 10,
  },

  is_active: true,
  tags: ['marketing', 'redes_sociales', 'crisis', 'community_manager'],
};

// Exportar todas las plantillas
export const FLOW_TEMPLATES: Record<string, FlowTemplate> = {
  'SEGUROS_01': TEMPLATE_SEGUROS_VIDA,
  'SUELDOS_01': TEMPLATE_LIQUIDACION_SUELDOS,
  'ORATORIA_01': TEMPLATE_ORATORIA,
  'MARKETING_01': TEMPLATE_MARKETING_DIGITAL,
};

export function getTemplateById(id: string): FlowTemplate | undefined {
  return FLOW_TEMPLATES[id];
}

export function getAllTemplates(): FlowTemplate[] {
  return Object.values(FLOW_TEMPLATES);
}

export function getTemplatesByFamily(family: string): FlowTemplate[] {
  return getAllTemplates().filter(t => t.family === family);
}

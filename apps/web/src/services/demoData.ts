// ============================================================
// DEMO DATA — Mock data for Vercel/standalone frontend demos
// Activated via NEXT_PUBLIC_DEMO_MODE=true
// ============================================================

// ── Users ────────────────────────────────────────────────────
export interface DemoUser {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin' | 'ministerio'
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'd1a2b3c4-0001-4000-8000-000000000001', email: 'admin@fepei.com',        name: 'Admin FEPEI',      role: 'admin' },
  { id: 'd1a2b3c4-0001-4000-8000-000000000002', email: 'docente@fepei.com',      name: 'Prof. Laura García', role: 'teacher' },
  { id: 'd1a2b3c4-0001-4000-8000-000000000003', email: 'alumno@fepei.com',       name: 'Juan Pérez',       role: 'student' },
  { id: 'd1a2b3c4-0001-4000-8000-000000000004', email: 'ministerio@fepei.com',   name: 'Min. Educación',   role: 'ministerio' },
  { id: 'd1a2b3c4-0001-4000-8000-000000000005', email: 'alumno-demo@fepei.com',   name: 'María González',   role: 'student' },
  { id: 'd1a2b3c4-0001-4000-8000-000000000006', email: 'profesor-demo@fepei.com', name: 'Carlos Rodríguez', role: 'teacher' },
  { id: 'd1a2b3c4-0001-4000-8000-000000000007', email: 'admin-demo@fepei.com',    name: 'Sofía Martínez',   role: 'admin' },
]

// ── Courses ──────────────────────────────────────────────────
export interface DemoCourse {
  id: string
  course_id: string
  title: string
  description: string
  modules: string[]
  ai_role: string
  eval_criteria: string[]
  category: string
  image?: string
}

export const DEMO_COURSES: DemoCourse[] = [
  {
    id: 'course-rrhh-001',
    course_id: 'rh3657',
    title: 'Facilitador en Oratoria y Storytelling',
    description: 'Domina el arte de hablar en público con técnicas de storytelling y comunicación persuasiva. Ideal para líderes que necesitan inspirar y motivar.',
    modules: ['document', 'chat'],
    ai_role: 'Empleado con 15 años de antigüedad que recibió una sanción injustificada',
    eval_criteria: ['claridad', 'empatía', 'estructura', 'persuasión'],
    category: 'rrhh',
  },
  {
    id: 'course-ventas-001',
    course_id: 'ventas001',
    title: 'Ventas Estratégicas B2B',
    description: 'Aprende a manejar ciclos de venta complejos con múltiples stakeholders. Cierra deals de alto valor con metodologías comprobadas.',
    modules: ['document', 'chat', 'inbox'],
    ai_role: 'Cliente corporativo exigente con múltiples objeciones',
    eval_criteria: ['negociación', 'cierre', 'relación', 'estrategia'],
    category: 'ventas',
  },
  {
    id: 'course-contable-001',
    course_id: 'contable01',
    title: 'Contabilidad y Auditoría Avanzada',
    description: 'Domina el ciclo contable completo, ajustes complejos, y procedimientos de auditoría bajo estándares IFRS.',
    modules: ['calculator', 'document'],
    ai_role: 'Auditor externo que revisa estados financieros',
    eval_criteria: ['precisión', 'normativa', 'análisis', 'juicio'],
    category: 'contable',
  },
  {
    id: 'course-legal-001',
    course_id: 'legal001',
    title: 'Derecho Corporativo y Litigios',
    description: 'Maneja incumplimientos contractuales, litigios laborales y defensa corporativa con criterio legal sólido.',
    modules: ['document', 'chat'],
    ai_role: 'Abogado externo experto en derecho comercial',
    eval_criteria: ['argumentación', 'conocimiento_legal', 'estrategia', 'redacción'],
    category: 'legal',
  },
  {
    id: 'course-general-001',
    course_id: 'general01',
    title: 'Liderazgo y Gestión de Crisis',
    description: 'Desarrolla habilidades de liderazgo situacional para manejar crisis, cambios organizacionales y equipos de alto rendimiento.',
    modules: ['chat', 'document', 'inbox'],
    ai_role: 'CEO que enfrenta una crisis de confianza en el equipo',
    eval_criteria: ['liderazgo', 'comunicación', 'decisión', 'empatía'],
    category: 'general',
  },
  {
    id: 'course-admin-001',
    course_id: 'adm5536',
    title: 'Liquidación de Sueldos',
    description: 'Domina la liquidación de sueldos con cálculo de cargas sociales, impuestos y convenios colectivos de trabajo.',
    modules: ['calculator', 'document', 'inbox'],
    ai_role: 'Auditor Técnico de AFIP/ARCA supervisando la carga',
    eval_criteria: ['precisión', 'normativa', 'cálculo', 'plazos'],
    category: 'administracion',
  },
]

// ── Simulations ──────────────────────────────────────────────
export interface DemoSimulation {
  id: string
  course_id: string
  student_id: string
  status: 'not-started' | 'in-progress' | 'paused' | 'completed'
  started_at: string | null
  completed_at: string | null
  score: number | null
  state?: Record<string, unknown>
}

export const DEMO_SIMULATIONS: DemoSimulation[] = [
  {
    id: 'sim-001',
    course_id: 'rh3657',
    student_id: DEMO_USERS[2].id,
    status: 'in-progress',
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: null,
    score: null,
  },
  {
    id: 'sim-002',
    course_id: 'ventas001',
    student_id: DEMO_USERS[2].id,
    status: 'in-progress',
    started_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: null,
    score: null,
  },
  {
    id: 'sim-003',
    course_id: 'contable01',
    student_id: DEMO_USERS[2].id,
    status: 'completed',
    started_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    score: 88.5,
  },
  {
    id: 'sim-004',
    course_id: 'legal001',
    student_id: DEMO_USERS[2].id,
    status: 'not-started',
    started_at: null,
    completed_at: null,
    score: null,
  },
  {
    id: 'sim-005',
    course_id: 'general01',
    student_id: DEMO_USERS[4].id,
    status: 'in-progress',
    started_at: new Date(Date.now() - 1800000).toISOString(),
    completed_at: null,
    score: null,
  },
]

// ── Simulation Logs (for evaluator) ──────────────────────────
export interface DemoSimulationLog {
  id: string
  simulation_id: string
  user_id: string
  timestamp: string
  event_type: string
  event_data: Record<string, unknown>
  response_time_ms?: number
}

export function generateDemoLogs(simId: string, userId: string): DemoSimulationLog[] {
  return [
    { id: `log-${simId}-1`, simulation_id: simId, user_id: userId, timestamp: new Date(Date.now() - 300000).toISOString(), event_type: 'message_sent', event_data: { role: 'user', content: 'Necesito analizar la situación financiera de la empresa.' }, response_time_ms: 5000 },
    { id: `log-${simId}-2`, simulation_id: simId, user_id: userId, timestamp: new Date(Date.now() - 240000).toISOString(), event_type: 'action_taken', event_data: { action: 'review_balance_sheet', detail: 'Revisó balance general' } },
    { id: `log-${simId}-3`, simulation_id: simId, user_id: userId, timestamp: new Date(Date.now() - 180000).toISOString(), event_type: 'message_sent', event_data: { role: 'user', content: 'Voy a calcular el ratio de liquidez para evaluar la solvencia.' }, response_time_ms: 8000 },
    { id: `log-${simId}-4`, simulation_id: simId, user_id: userId, timestamp: new Date(Date.now() - 120000).toISOString(), event_type: 'calculation_made', event_data: { formula: 'liquidez = activo_corriente / pasivo_corriente', result: 1.85 } },
    { id: `log-${simId}-5`, simulation_id: simId, user_id: userId, timestamp: new Date(Date.now() - 60000).toISOString(), event_type: 'message_sent', event_data: { role: 'user', content: 'El ratio de liquidez es 1.85, lo que indica buena salud financiera a corto plazo.' }, response_time_ms: 3000 },
    { id: `log-${simId}-6`, simulation_id: simId, user_id: userId, timestamp: new Date(Date.now() - 10000).toISOString(), event_type: 'tool_used', event_data: { tool: 'calculator', input: '1500000/810000', output: '1.85' } },
  ]
}

// ── Evaluation result (for evaluator) ────────────────────────
export function generateDemoEvaluation(simId: string): Record<string, unknown> {
  return {
    simulation_id: simId,
    course_id: 'course-contable-001',
    user_id: DEMO_USERS[2].id,
    final_score: 85.5,
    passed: true,
    criteria_scores: { precision: 90, normativa: 80, analisis: 85, juicio: 87 },
    feedback: 'El estudiante demostró comprensión sólida de los principios contables.',
    strengths: ['✅ Análisis financiero: Excelente (90/100)', '✅ Juicio profesional: Muy bueno (87/100)'],
    improvements: ['⚠️ Normativa: Aceptable pero mejorable (80/100)'],
    time_spent_minutes: 45,
    total_interactions: 24,
    generated_at: new Date().toISOString(),
  }
}

// ── Scenarios (from seed data) ───────────────────────────────
export interface DemoScenario {
  id: string
  course_id: string
  title: string
  description: string
  scenario_type: string
  difficulty: string
  content: Record<string, unknown>
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scenario-rrhh-001',
    course_id: 'rh3657',
    title: 'Crisis: Despidos por Reestructuración',
    description: 'Debes gestionar el proceso de despido de 30 empleados por reestructuración.',
    scenario_type: 'practice',
    difficulty: 'medium',
    content: {
      main_topic: 'Gestión de despidos y reestructuración',
      context: 'La empresa necesita reducir costos reduciendo el 30% de personal.',
      estimated_time_minutes: 25,
      key_actors: ['CEO', 'CFO', 'Equipo de RH', 'Empleados afectados', 'Abogado laboral'],
    },
  },
  {
    id: 'scenario-ventas-001',
    course_id: 'ventas001',
    title: 'Deal: Venta a Cliente Fortune 500',
    description: 'Debes cerrar una venta de USD 2.5M a una empresa Fortune 500.',
    scenario_type: 'practice',
    difficulty: 'hard',
    content: {
      main_topic: 'Ventas empresariales complejas (B2B)',
      contract_value: 2500000,
      estimated_time_minutes: 30,
    },
  },
  {
    id: 'scenario-contable-001',
    course_id: 'contable01',
    title: 'Práctica: Cierre de Ciclo Contable',
    description: 'Completa el cierre mensual con ajustes complejos y multimoneda.',
    scenario_type: 'practice',
    difficulty: 'medium',
    content: {
      main_topic: 'Ciclo contable y ajustes de cierre',
      estimated_time_minutes: 40,
    },
  },
]

// ── Legajo data ──────────────────────────────────────────────
export function generateDemoLegajo(userId: string): Record<string, unknown> {
  const user = DEMO_USERS.find(u => u.id === userId) || DEMO_USERS[2]
  const userSims = DEMO_SIMULATIONS.filter(s => s.student_id === userId)

  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    simulations: userSims.map(s => {
      const course = DEMO_COURSES.find(c => c.course_id === s.course_id)
      return {
        simulationId: s.id,
        courseName: course?.title || s.course_id,
        status: s.status,
        score: s.score,
        startedAt: s.started_at,
        completedAt: s.completed_at,
      }
    }),
    stats: {
      totalSimulations: userSims.length,
      completed: userSims.filter(s => s.status === 'completed').length,
      inProgress: userSims.filter(s => s.status === 'in-progress').length,
      averageScore: userSims.filter(s => s.score !== null).reduce((acc, s) => acc + (s.score || 0), 0) /
        Math.max(1, userSims.filter(s => s.score !== null).length),
    },
  }
}

// ── Inbox emails ─────────────────────────────────────────────
export function generateDemoEmails(simId: string): Array<{ id: string; from: string; subject: string; body: string; read: boolean }> {
  return [
    { id: `email-${simId}-1`, from: 'CEO@empresa.com', subject: 'Urgente: Reporte mensual', body: 'Necesito el reporte financiero de este mes antes del viernes.', read: true },
    { id: `email-${simId}-2`, from: 'cliente@corporacion.com', subject: 'Re: Propuesta comercial', body: 'Hemos revisado su propuesta y tenemos algunas observaciones.', read: false },
    { id: `email-${simId}-3`, from: 'legal@empresa.com', subject: 'Documentación pendiente', body: 'Faltan firmar los contratos actualizados para el nuevo proyecto.', read: false },
  ]
}

// ── Documents ────────────────────────────────────────────────
export function generateDemoDocuments(simId: string): Array<{ id: string; name: string; type: string; content: string }> {
  return [
    { id: `doc-${simId}-1`, name: 'Balance General 2025.xlsx', type: 'spreadsheet', content: 'Balance general simulado con activos y pasivos.' },
    { id: `doc-${simId}-2`, name: 'Estado de Resultados.xlsx', type: 'spreadsheet', content: 'Estado de resultados del período actual.' },
    { id: `doc-${simId}-3`, name: 'Contrato Propuesta.pdf', type: 'document', content: 'Borrador de contrato para revisión legal.' },
  ]
}

// ── Admin - course config ────────────────────────────────────
export function generateAdminData(): Array<Record<string, unknown>> {
  return DEMO_COURSES.map(c => ({
    ...c,
    activeModules: c.modules.map((m, i) => ({
      moduleId: i + 1,
      enabled: true,
      config: { type: m },
    })),
    uiConfig: {
      layout: 'office',
      primaryColor: '#1a237e',
      theme: 'light',
    },
    iaConfig: {
      enabled: true,
      provider: 'gemini',
      systemPrompt: `Actúa como ${c.ai_role}`,
      temperature: 0.5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

// ── Auth helpers ─────────────────────────────────────────────
export function findDemoUser(email: string): DemoUser | undefined {
  // Case-insensitive lookup
  return DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function generateAuthResponse(user: DemoUser): { token: string; user: DemoUser; refreshToken: string } {
  const fakeToken = `demo_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const fakeRefresh = `refresh_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`

  return {
    token: fakeToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    refreshToken: fakeRefresh,
  }
}

// ── URL router ───────────────────────────────────────────────
export type DemoHandler = (method: string, url: string, data?: unknown) => { data: unknown; status: number; statusText: string }

export function routeDemoRequest(method: string, url: string, data?: unknown): { data: unknown; status: number; statusText: string } {
  // Normalise: remove trailing slash, lower method
  const normalisedUrl = url.replace(/\/+$/, '')
  const m = method.toUpperCase()

  // ── POST /auth/login ──────────────────────────────────────
  if (normalisedUrl === '/auth/login' && m === 'POST') {
    const { email } = (data as { email?: string }) || {}
    const user = findDemoUser(email || '')

    if (!user) {
      return {
        status: 401,
        statusText: 'Unauthorized',
        data: { error: 'Credenciales inválidas' },
      }
    }

    return {
      status: 200,
      statusText: 'OK',
      data: generateAuthResponse(user),
    }
  }

  // ── POST /auth/register ───────────────────────────────────
  if (normalisedUrl === '/auth/register' && m === 'POST') {
    const { email, name } = (data as { email?: string; name?: string }) || {}
    const newUser: DemoUser = {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: email || 'nuevo@demo.com',
      name: name || 'Nuevo Usuario',
      role: 'student',
    }

    return {
      status: 201,
      statusText: 'Created',
      data: generateAuthResponse(newUser),
    }
  }

  // ── GET /courses ──────────────────────────────────────────
  if (normalisedUrl === '/courses' && m === 'GET') {
    return { status: 200, statusText: 'OK', data: DEMO_COURSES }
  }

  // ── POST /courses (create) ────────────────────────────────
  if (normalisedUrl === '/courses' && m === 'POST') {
    const body = data as Partial<DemoCourse>
    const newCourse: DemoCourse = {
      id: `course-${Date.now()}`,
      course_id: body.course_id || `demo-${Date.now()}`,
      title: body.title || 'Nuevo Curso',
      description: body.description || '',
      modules: body.modules || [],
      ai_role: body.ai_role || '',
      eval_criteria: body.eval_criteria || [],
      category: body.category || 'general',
    }
    return { status: 201, statusText: 'Created', data: newCourse }
  }

  // ── GET /courses/:id ──────────────────────────────────────
  const courseMatch = normalisedUrl.match(/^\/courses\/([^/]+)$/)
  if (courseMatch && m === 'GET') {
    const courseId = courseMatch[1]
    const course = DEMO_COURSES.find(c => c.id === courseId || c.course_id === courseId)
    if (course) {
      return { status: 200, statusText: 'OK', data: course }
    }
    return { status: 404, statusText: 'Not Found', data: { error: 'Curso no encontrado' } }
  }

  // ── PUT /courses/:id ──────────────────────────────────────
  if (courseMatch && m === 'PUT') {
    return { status: 200, statusText: 'OK', data: { ...DEMO_COURSES[0], ...(data as object) } }
  }

  // ── GET /simulations ──────────────────────────────────────
  if (normalisedUrl === '/simulations' && m === 'GET') {
    return { status: 200, statusText: 'OK', data: DEMO_SIMULATIONS }
  }

  // ── POST /simulations/start ───────────────────────────────
  if (normalisedUrl === '/simulations/start' && m === 'POST') {
    const { courseId } = (data as { courseId?: string }) || {}
    const course = DEMO_COURSES.find(c => c.id === courseId || c.course_id === courseId)
    const newSim: DemoSimulation = {
      id: `sim-${Date.now()}`,
      course_id: course?.course_id || courseId || 'unknown',
      student_id: DEMO_USERS[2].id,
      status: 'in-progress',
      started_at: new Date().toISOString(),
      completed_at: null,
      score: null,
      state: { currentStep: 'intro', messages: [] },
    }
    return { status: 201, statusText: 'Created', data: newSim }
  }

  // ── Simulation sub-routes: /simulations/:id/emails ────────
  const simEmailsMatch = normalisedUrl.match(/^\/simulations\/([^/]+)\/emails$/)
  if (simEmailsMatch && m === 'GET') {
    return { status: 200, statusText: 'OK', data: generateDemoEmails(simEmailsMatch[1]) }
  }

  // ── /simulations/:id/documents ────────────────────────────
  const simDocsMatch = normalisedUrl.match(/^\/simulations\/([^/]+)\/documents$/)
  if (simDocsMatch && m === 'GET') {
    return { status: 200, statusText: 'OK', data: generateDemoDocuments(simDocsMatch[1]) }
  }

  // ── /simulations/:id/spreadsheet ──────────────────────────
  const simSpreadMatch = normalisedUrl.match(/^\/simulations\/([^/]+)\/spreadsheet$/)
  if (simSpreadMatch && m === 'GET') {
    return { status: 200, statusText: 'OK', data: generateDemoDocuments(simSpreadMatch[1]).filter(d => d.type === 'spreadsheet') }
  }

  // ── POST /simulations/:id/message ─────────────────────────
  const simMsgMatch = normalisedUrl.match(/^\/simulations\/([^/]+)\/message$/)
  if (simMsgMatch && m === 'POST') {
    return {
      status: 200,
      statusText: 'OK',
      data: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Entendido. He procesado tu solicitud y estoy trabajando en la respuesta. ¿Hay algo más que necesites considerar?',
        timestamp: new Date().toISOString(),
      },
    }
  }

  // ── GET /simulations/:id/logs ─────────────────────────────
  const simLogsMatch = normalisedUrl.match(/^\/simulations\/([^/]+)\/logs$/)
  if (simLogsMatch && m === 'GET') {
    const simId = simLogsMatch[1]
    const sim = DEMO_SIMULATIONS.find(s => s.id === simId)
    return { status: 200, statusText: 'OK', data: generateDemoLogs(simId, sim?.student_id || DEMO_USERS[2].id) }
  }

  // ── POST /simulations/:id/evaluate ────────────────────────
  const simEvalMatch = normalisedUrl.match(/^\/simulations\/([^/]+)\/evaluate$/)
  if (simEvalMatch && m === 'POST') {
    return { status: 200, statusText: 'OK', data: generateDemoEvaluation(simEvalMatch[1]) }
  }

  // ── GET /admin/courses ────────────────────────────────────
  if (normalisedUrl === '/admin/courses' && m === 'GET') {
    return { status: 200, statusText: 'OK', data: generateAdminData() }
  }

  // ── DELETE /admin/courses/:id ─────────────────────────────
  const adminDeleteMatch = normalisedUrl.match(/^\/admin\/courses\/([^/]+)$/)
  if (adminDeleteMatch && m === 'DELETE') {
    return { status: 200, statusText: 'OK', data: { success: true, deleted: adminDeleteMatch[1] } }
  }

  // ── GET /legajo/:userId ───────────────────────────────────
  const legajoMatch = normalisedUrl.match(/^\/legajo\/([^/]+)$/)
  if (legajoMatch && m === 'GET') {
    return { status: 200, statusText: 'OK', data: generateDemoLegajo(legajoMatch[1]) }
  }

  // ── Fallback ──────────────────────────────────────────────
  return {
    status: 404,
    statusText: 'Not Found',
    data: { error: `Demo mode: no handler for ${m} ${url}` },
  }
}

import { PrismaClient, FileType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Iniciando seed de datos demo (Grupo A)...\n');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@simuverse.edu' } });
  const teacher1 = await prisma.user.findUnique({ where: { email: 'garcia@simuverse.edu' } });
  const student1 = await prisma.user.findUnique({ where: { email: 'juan.perez@student.edu' } });
  const student2 = await prisma.user.findUnique({ where: { email: 'maria.lopez@student.edu' } });
  const student3 = await prisma.user.findUnique({ where: { email: 'carlos.soto@student.edu' } });
  const ministerio = await prisma.user.findUnique({ where: { email: 'control@ministerio.gob' } });

  const course1 = await prisma.course.findUnique({ where: { course_id: 'OFI-BAS-001' } });
  const course2 = await prisma.course.findUnique({ where: { course_id: 'TEX-CAL-001' } });
  const course3 = await prisma.course.findUnique({ where: { course_id: 'ALI-SEG-001' } });
  const course4 = await prisma.course.findUnique({ where: { course_id: 'MET-MAN-001' } });

  if (!admin || !student1 || !course1) throw new Error('Run seed.ts and seed-companies.ts first');

  // ═══════════════════════════════════════════════════════════════
  // 1. FOUNDATION CONFIG
  // ═══════════════════════════════════════════════════════════════
  console.log('🏛️  Foundation Config...');
  await prisma.foundationConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Fundación FEPEI',
      short_name: 'FEPEI',
      logo_url: '/logos/fepei.png',
      address: 'Córdoba 1452, Piso 3',
      city: 'Rosario',
      province: 'Santa Fe',
      country: 'Argentina',
      phone: '+54 341 555-0100',
      email: 'contacto@fepei.edu.ar',
      website: 'https://fepei.edu.ar',
      ministry_aval: 'Disposición Nº 123/2024 — Ministerio de Educación de Santa Fe',
      is_active: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. ENDORSERS + COURSE ENDORSERS
  // ═══════════════════════════════════════════════════════════════
  console.log('✅ Avaladores...');
  const endorsers = [
    { name: 'Ministerio de Educación de Santa Fe', short_name: 'MinEdu SF', endorsement_type: 'government', website: 'https://santafe.gob.ar/educacion', description: 'Aval oficial del Ministerio de Educación provincial.' },
    { name: 'Universidad Nacional de Rosario', short_name: 'UNR', endorsement_type: 'academic', website: 'https://unr.edu.ar', description: 'Aval académico de la UNR — Facultad de Ciencias Económicas.' },
    { name: 'Cámara de Comercio de Rosario', short_name: 'CCR', endorsement_type: 'institution', website: 'https://camaracomerciorosario.com.ar', description: 'Aval institucional de la Cámara de Comercio.' },
  ];
  for (const e of endorsers) {
    const exists = await prisma.endorser.findFirst({ where: { name: e.name } });
    if (!exists) {
      await prisma.endorser.create({ data: e });
    }
  }

  const realEndorsers = await prisma.endorser.findMany({ take: 3 });
  const allCourses = [course1!, course2!, course3!, course4!];
  for (const c of allCourses) {
    const pick = realEndorsers[allCourses.indexOf(c) % realEndorsers.length];
    const exists = await prisma.courseEndorser.findFirst({
      where: { course_id: c.id, endorser_id: pick.id },
    });
    if (!exists) {
      await prisma.courseEndorser.create({
        data: { course_id: c.id, endorser_id: pick.id },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. CATEGORIES
  // ═══════════════════════════════════════════════════════════════
  console.log('📂 Categorías...');
  const categories = [
    { name: 'administracion', code: 'ADM', description: 'Cursos de administración y gestión de oficina' },
    { name: 'rrhh', code: 'RRHH', description: 'Cursos de recursos humanos y relaciones laborales' },
    { name: 'it', code: 'IT', description: 'Cursos de tecnología y sistemas' },
    { name: 'contable', code: 'CON', description: 'Cursos de contabilidad y finanzas' },
    { name: 'ventas', code: 'VEN', description: 'Cursos de ventas y atención al cliente' },
    { name: 'legal', code: 'LEG', description: 'Cursos de derecho y normativa' },
    { name: 'seguros', code: 'SEG', description: 'Cursos de seguros y coberturas' },
    { name: 'general', code: 'GEN', description: 'Cursos de formación general' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. FLOW TEMPLATES
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 Flow Templates...');
  const flows = [
    { id: 'flow-administracion', course_id: course1!.id, course_code: 'OFI-BAS-001', title: 'Flujo Administración', family: 'administracion', template_data: JSON.stringify({ steps: ['onboarding', 'daily_tasks', 'crisis', 'evaluation'] }) },
    { id: 'flow-rrhh', course_id: course2!.id, course_code: 'TEX-CAL-001', title: 'Flujo RRHH / Calidad', family: 'rrhh', template_data: JSON.stringify({ steps: ['induction', 'audit', 'report', 'evaluation'] }) },
    { id: 'flow-alimentos', course_id: course3!.id, course_code: 'ALI-SEG-001', title: 'Flujo Alimentos / HACCP', family: 'administration', template_data: JSON.stringify({ steps: ['inspection', 'pcc_review', 'corrective_action', 'audit'] }) },
    { id: 'flow-it', course_id: course4!.id, course_code: 'MET-MAN-001', title: 'Flujo Mantenimiento IT', family: 'it', template_data: JSON.stringify({ steps: ['diagnosis', 'prioritization', 'repair', 'preventive_plan'] }) },
  ];
  for (const f of flows) {
    await prisma.flowTemplate.upsert({
      where: { id: f.id },
      update: {},
      create: { ...f, created_by: admin!.id },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. PROMPT TEMPLATES
  // ═══════════════════════════════════════════════════════════════
  console.log('💬 Prompt Templates...');
  const prompts = [
    { name: 'Cliente Insatisfecho', description: 'Atención de reclamos', category: 'ventas', base_role: 'Sos un cliente insatisfecho. Tu pedido llegó tarde y con productos dañados.', course_context: 'El alumno trabaja en atención al cliente de una empresa de logística.', personality_traits: JSON.stringify(['exigente', 'frustrado', 'razonable']), knowledge_base_prompt: 'Reclamá por la demora y los daños. Si el alumno ofrece una solución aceptable, calmate gradualmente.' },
    { name: 'Empleado Conflictivo', description: 'Manejo de RRHH', category: 'rrhh', base_role: 'Sos un empleado que se niega a usar el nuevo sistema de fichaje digital.', course_context: 'El alumno es un supervisor de RRHH que debe implementar el nuevo sistema.', personality_traits: JSON.stringify(['resistente', 'desconfiado', 'práctico']), knowledge_base_prompt: 'Resistite al cambio al principio. Si el alumno explica los beneficios claramente, empezá a ceder.' },
    { name: 'Auditor AFIP', description: 'Simulación fiscal', category: 'contable', base_role: 'Sos un auditor de AFIP revisando los libros contables de la empresa.', course_context: 'El alumno es contador y debe responder a la auditoría.', personality_traits: JSON.stringify(['riguroso', 'formal', 'detallista']), knowledge_base_prompt: 'Pedí documentación específica. Si el alumno la presenta correctamente, aprobá el item.' },
    { name: 'Tech Lead', description: 'Code review y mentoring', category: 'it', base_role: 'Sos un tech lead revisando el código del alumno para un deploy a producción.', course_context: 'El alumno es desarrollador junior.', personality_traits: JSON.stringify(['técnico', 'paciente', 'exigente']), knowledge_base_prompt: 'Revisá el código, señalá bugs y buenas prácticas. Si el alumno corrige, aprobá el PR.' },
    { name: 'Cliente E-commerce', description: 'Devoluciones online', category: 'ventas', base_role: 'Sos un cliente que compró una notebook y quiere devolverla porque no le gusta el color.', course_context: 'El alumno trabaja en soporte post-venta.', personality_traits: JSON.stringify(['indeciso', 'quejoso', 'apresurado']), knowledge_base_prompt: 'Insistí en la devolución. Si el alumno aplica la política correctamente, aceptá.' },
    { name: 'Negociador Proveedor', description: 'Renegociación de contrato', category: 'administracion', base_role: 'Sos un proveedor que quiere aumentar el precio del contrato un 20% por inflación.', course_context: 'El alumno es comprador y debe renegociar.', personality_traits: JSON.stringify(['negociador', 'firme', 'cortés']), knowledge_base_prompt: 'Defendé tu posición. Si el alumno propone un punto medio (<12%), aceptá.' },
  ];
  for (const p of prompts) {
    const exists = await prisma.promptTemplate.findFirst({ where: { name: p.name } });
    if (!exists) {
      await prisma.promptTemplate.create({ data: { ...p, created_by: admin!.id } });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. TECH SHEETS
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 Tech Sheets...');
  const techsheets = [
    { name: 'Ficha Técnica — Administración (Res. 123/2024)', course_id: course1!.id, ministry_code: 'ADM-2024-001', description: 'Ficha técnica para cursos de administración según Resolución 123/2024 del Ministerio de Educación.', competencies: JSON.stringify({ competencias: ['gestión documental', 'ofimática', 'atención al cliente', 'resolución de problemas'] }), kpi_requirements: JSON.stringify({ minimo_aprobacion: 70, criterios: ['precisión', 'tiempo de respuesta', 'calidad de comunicación'] }), processed: true, uploaded_by: admin!.id },
    { name: 'Ficha Técnica — Control de Calidad Textil', course_id: course2!.id, ministry_code: 'TEX-2024-005', description: 'Estándares ISO 2859-1 para control de calidad en industria textil.', competencies: JSON.stringify({ competencias: ['muestreo estadístico', 'clasificación de defectos', 'normas ISO', 'documentación de calidad'] }), kpi_requirements: JSON.stringify({ minimo_aprobacion: 75, criterios: ['precisión en clasificación', 'aplicación de AQL', 'decisión documentada'] }), processed: true, uploaded_by: admin!.id },
    { name: 'Ficha Técnica — Seguridad Alimentaria HACCP', course_id: course3!.id, ministry_code: 'ALI-2024-003', description: 'Normativa SENASA para certificación HACCP en plantas de alimentos.', competencies: JSON.stringify({ competencias: ['identificación de PCC', 'monitoreo de límites críticos', 'acciones correctivas', 'documentación HACCP'] }), kpi_requirements: JSON.stringify({ minimo_aprobacion: 80, criterios: ['correcta identificación de desvíos', 'plan de acción documentado', 'cumplimiento normativo'] }), processed: true, uploaded_by: admin!.id },
  ];
  for (const ts of techsheets) {
    const exists = await prisma.techSheet.findFirst({ where: { ministry_code: ts.ministry_code } });
    if (!exists) {
      await prisma.techSheet.create({ data: ts });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. ROLES + FUNCTIONALITIES + PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('🔐 Roles...');
  const roles = [
    { name: 'admin', description: 'Acceso total al sistema', color: '#ef4444' },
    { name: 'teacher', description: 'Gestión de cursos y alumnos', color: '#3b82f6' },
    { name: 'student', description: 'Acceso a simulaciones asignadas', color: '#22c55e' },
    { name: 'ministerio', description: 'Auditoría y trazabilidad', color: '#f59e0b' },
  ];
  for (const r of roles) {
    const exists = await prisma.role.findFirst({ where: { name: r.name } });
    if (!exists) await prisma.role.create({ data: r });
  }

  console.log('⚙️  Funcionalidades...');
  const funcs = [
    { name: 'manage_courses', description: 'Gestionar cursos', module: 'cursos', icon: 'BookOpen', route: '/admin/courses' },
    { name: 'manage_users', description: 'Gestionar usuarios', module: 'usuarios', icon: 'Users', route: '/admin/users' },
    { name: 'view_evaluations', description: 'Ver evaluaciones', module: 'evaluaciones', icon: 'ClipboardCheck', route: '/evaluations' },
    { name: 'view_legajos', description: 'Ver legajos de alumnos', module: 'legajos', icon: 'FolderOpen', route: '/legajos' },
    { name: 'manage_roles', description: 'Gestionar roles y permisos', module: 'admin', icon: 'Shield', route: '/admin/roles' },
    { name: 'manage_scenarios', description: 'Gestionar escenarios', module: 'cursos', icon: 'Play', route: '/admin/scenarios' },
    { name: 'manage_assignments', description: 'Asignar cursos a alumnos', module: 'cursos', icon: 'UserPlus', route: '/admin/assignments' },
    { name: 'manage_companies', description: 'Gestionar empresas simuladas', module: 'admin', icon: 'Building2', route: '/admin/companies' },
    { name: 'view_stats', description: 'Ver estadísticas globales', module: 'admin', icon: 'BarChart3', route: '/admin/stats' },
    { name: 'manage_foundation', description: 'Configurar fundación', module: 'admin', icon: 'Home', route: '/admin/foundation' },
    { name: 'manage_endorsers', description: 'Gestionar avaladores', module: 'admin', icon: 'Award', route: '/admin/endorsers' },
    { name: 'manage_templates', description: 'Gestionar plantillas de flujo', module: 'admin', icon: 'LayoutTemplate', route: '/admin/templates' },
    { name: 'manage_prompts', description: 'Gestionar prompts IA', module: 'admin', icon: 'MessageSquare', route: '/admin/prompts' },
    { name: 'manage_techsheets', description: 'Gestionar fichas técnicas', module: 'admin', icon: 'FileText', route: '/admin/techsheets' },
    { name: 'manage_categories', description: 'Gestionar categorías', module: 'admin', icon: 'Tags', route: '/admin/categories' },
    { name: 'manage_documents', description: 'Gestionar documentos', module: 'cursos', icon: 'FileText', route: '/admin/documents' },
    { name: 'manage_groups', description: 'Gestionar grupos profesor-alumno', module: 'usuarios', icon: 'Users', route: '/admin/groups' },
    { name: 'manage_sessions', description: 'Ver sesiones de simulación', module: 'evaluaciones', icon: 'Monitor', route: '/admin/sessions' },
  ];
  for (const f of funcs) {
    const exists = await prisma.systemFunctionality.findFirst({ where: { name: f.name } });
    if (!exists) await prisma.systemFunctionality.create({ data: f });
  }

  const realFuncs = await prisma.systemFunctionality.findMany();
  const adminAll = realFuncs.map(f => ({ role_name: 'admin', functionality_id: f.id, enabled: true }));
  const teacherPerms = realFuncs.filter(f =>
    ['manage_courses', 'view_evaluations', 'view_legajos', 'manage_scenarios', 'manage_assignments', 'manage_documents', 'manage_groups'].includes(f.name)
  ).map(f => ({ role_name: 'teacher', functionality_id: f.id, enabled: true }));
  const ministerioPerms = realFuncs.filter(f =>
    ['view_evaluations', 'view_legajos', 'view_stats'].includes(f.name)
  ).map(f => ({ role_name: 'ministerio', functionality_id: f.id, enabled: true }));

  console.log('🔑 Permisos...');
  for (const p of [...adminAll, ...teacherPerms, ...ministerioPerms]) {
    const exists = await prisma.rolePermission.findFirst({
      where: { role_name: p.role_name, functionality_id: p.functionality_id },
    });
    if (!exists) await prisma.rolePermission.create({ data: p });
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('🔔 Notificaciones...');
  const existingNotifs = await prisma.notification.count();
  if (existingNotifs === 0) {
    const notifs = [
      { recipient_id: student1!.id, actor_id: admin!.id, type: 'course_assigned' as const, title: 'Nuevo curso asignado', content: 'Se te asignó el curso "Control de Calidad en Industria Textil". ¡Empezá a simular!', is_read: false },
      { recipient_id: student1!.id, actor_id: null, type: 'simulation_completed' as const, title: '¡Simulación completada!', content: 'Completaste "Ofimática Básica". Tu evaluación está disponible.', is_read: true },
      { recipient_id: student2!.id, actor_id: admin!.id, type: 'course_assigned' as const, title: 'Nuevo curso asignado', content: 'Se te asignó "Seguridad e Higiene Alimentaria".', is_read: false },
      { recipient_id: teacher1!.id, actor_id: student1!.id, type: 'simulation_completed' as const, title: 'Juan Pérez completó una simulación', content: 'Juan Pérez finalizó "Ofimática Básica". Revisá su evaluación.', is_read: false },
      { recipient_id: ministerio!.id, actor_id: null, type: 'system_alert' as const, title: 'Auditoría pendiente', content: 'Hay 2 simulaciones sin auditar del curso OFI-BAS-001.', is_read: false },
      { recipient_id: student1!.id, actor_id: null, type: 'kpi_achieved' as const, title: '¡KPI alcanzado!', content: 'Superaste el 85% en el KPI de precisión de "Gestión de Mantenimiento Industrial".', is_read: false },
    ];
    for (const n of notifs) {
      await prisma.notification.create({ data: n });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. TEACHER GROUPS
  // ═══════════════════════════════════════════════════════════════
  console.log('👥 Grupos profesor-alumno...');
  const groups = [
    { teacher_id: teacher1!.id, student_id: student1!.id },
    { teacher_id: teacher1!.id, student_id: student2!.id },
    { teacher_id: teacher1!.id, student_id: student3!.id },
  ];
  for (const g of groups) {
    const exists = await prisma.teacherGroup.findFirst({
      where: { teacher_id: g.teacher_id, student_id: g.student_id },
    });
    if (!exists) {
      await prisma.teacherGroup.create({ data: g });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. ACCESS REQUESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('📩 Solicitudes de acceso...');
  const existingRequests = await prisma.accessRequest.count();
  if (existingRequests === 0) {
    const requests = [
      { student_id: student2!.id, course_id: course4!.id, student_name: student2!.name, student_email: student2!.email, course_name: 'Gestión de Mantenimiento Industrial', reason: 'Me interesa aprender sobre mantenimiento predictivo en entornos industriales.', status: 'pending' },
      { student_id: student3!.id, course_id: course2!.id, student_name: student3!.name, student_email: student3!.email, course_name: 'Control de Calidad en Industria Textil', reason: 'Quiero ampliar mis conocimientos en control de calidad para aplicar en mi trabajo actual.', status: 'pending' },
    ];
    for (const r of requests) {
      await prisma.accessRequest.create({ data: r });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. MINISTRY REQUIREMENTS + KPIs + TASKS
  // ═══════════════════════════════════════════════════════════════
  console.log('🏛️  Requisitos ministeriales...');
  const existingMreq = await prisma.ministryRequirement.count();
  let mreq1: any, mreq2: any;
  if (existingMreq === 0) {
    mreq1 = await prisma.ministryRequirement.create({
      data: {
        course_id: course1!.id,
        uploaded_by_id: admin!.id,
        file_name: 'Resolucion_123_2024_Administracion.pdf',
        file_type: FileType.pdf,
        file_size_bytes: 245000,
        file_path: '/uploads/ministry/res_123_2024.pdf',
        raw_text: 'Resolución 123/2024 del Ministerio de Educación de Santa Fe. Establece los contenidos mínimos para cursos de administración y ofimática con certificación oficial.',
        status: 'active',
        kpis_generated: 4,
        tasks_generated: 2,
      },
    });

    mreq2 = await prisma.ministryRequirement.create({
      data: {
        course_id: course3!.id,
        uploaded_by_id: admin!.id,
        file_name: 'Normativa_SENASA_HACCP_2024.pdf',
        file_type: FileType.pdf,
        file_size_bytes: 380000,
        file_path: '/uploads/ministry/senasa_haccp_2024.pdf',
        raw_text: 'Normativa SENASA para certificación HACCP en plantas elaboradoras de alimentos. Define PCC, límites críticos y requisitos de documentación.',
        status: 'active',
        kpis_generated: 3,
        tasks_generated: 2,
      },
    });
  } else {
    const mreqs = await prisma.ministryRequirement.findMany({ take: 2, orderBy: { created_at: 'asc' } });
    mreq1 = mreqs[0];
    mreq2 = mreqs[1];
  }

  console.log('📊 KPIs...');
  const existingKpis = await prisma.kPI.count();
  let createdKpis: string[] = [];
  if (existingKpis === 0) {
    const kpis = [
      { course_id: course1!.id, ministry_requirement_id: mreq1!.id, name: 'Precisión en liquidación de sueldos', description: 'Porcentaje de fórmulas correctas aplicadas', category: 'hard_skills', weight: 0.3, target_value: 85, minimum_pass_value: 70, thresholds: { excelente: 95, bueno: 85, regular: 70 }, trigger_event: 'calculation', success_criteria: 'Aplicar correctamente las fórmulas de aportes, obra social y ART.' },
      { course_id: course1!.id, ministry_requirement_id: mreq1!.id, name: 'Tiempo de respuesta a emails', description: 'Tiempo promedio en responder correos críticos', category: 'soft_skills', weight: 0.2, target_value: 90, minimum_pass_value: 75, thresholds: { rapido: '< 5 min', aceptable: '< 15 min', lento: '> 15 min' }, trigger_event: 'email_reply', success_criteria: 'Responder emails urgentes en menos de 15 minutos.' },
      { course_id: course1!.id, ministry_requirement_id: mreq1!.id, name: 'Calidad de comunicación', description: 'Evaluación de claridad y profesionalismo en mensajes', category: 'soft_skills', weight: 0.2, target_value: 80, minimum_pass_value: 65, thresholds: { excelente: 90, bueno: 80, regular: 65 }, trigger_event: 'message_sent', success_criteria: 'Mensajes claros, profesionales y sin errores ortográficos.' },
      { course_id: course1!.id, ministry_requirement_id: mreq1!.id, name: 'Resolución de crisis', description: 'Capacidad de manejar situaciones urgentes', category: 'soft_skills', weight: 0.3, target_value: 80, minimum_pass_value: 60, thresholds: { resolutivo: 90, competente: 75, necesita_mejora: 60 }, trigger_event: 'crisis_triggered', success_criteria: 'Identificar el problema, priorizar acciones y ejecutar solución.' },
      { course_id: course3!.id, ministry_requirement_id: mreq2!.id, name: 'Identificación de PCC', description: 'Correcta identificación de puntos críticos de control', category: 'hard_skills', weight: 0.35, target_value: 90, minimum_pass_value: 80, thresholds: { perfecto: 100, muy_bueno: 90, suficiente: 80 }, trigger_event: 'decision_made', success_criteria: 'Identificar al menos 3 PCC correctamente según plan HACCP.' },
      { course_id: course3!.id, ministry_requirement_id: mreq2!.id, name: 'Documentación de acciones correctivas', description: 'Calidad del registro de desvíos y acciones', category: 'hard_skills', weight: 0.3, target_value: 85, minimum_pass_value: 70, thresholds: { completo: 95, aceptable: 85, incompleto: 70 }, trigger_event: 'document_upload', success_criteria: 'Registrar desvíos con causa raíz, acción correctiva y verificación.' },
    ];
    for (const k of kpis) {
      const r = await prisma.kPI.create({ data: k });
      createdKpis.push(r.id);
    }
  } else {
    const allKpis = await prisma.kPI.findMany();
    createdKpis = allKpis.map(k => k.id);
  }

  console.log('📋 Tareas...');
  const existingTasks = await prisma.task.count();
  if (existingTasks === 0) {
    const tasks = [
      { course_id: course1!.id, kpi_id: createdKpis[0], scenario_id: 'scenario-primer-dia-001', title: 'Calcular liquidación de sueldos', description: 'Aplicar fórmulas de aportes (17%), obra social (6%) y ART (1.5%) para calcular el neto a cobrar.', type: 'practice' as const, sequence_order: 1, status: 'completed' as const },
      { course_id: course1!.id, kpi_id: createdKpis[1], scenario_id: 'scenario-primer-dia-001', title: 'Responder email urgente del jefe', description: 'Leer y responder el email sobre el error en liquidación de sueldos en menos de 15 minutos.', type: 'practice' as const, sequence_order: 2, status: 'in_progress' as const },
      { course_id: course3!.id, kpi_id: createdKpis[4], scenario_id: 'scenario-alimentos-001', title: 'Analizar registros de autoclave', description: 'Revisar 7 días de registros de temperatura e identificar los días con desviación del límite crítico.', type: 'evaluation' as const, sequence_order: 1, status: 'pending' as const },
      { course_id: course3!.id, kpi_id: createdKpis[5], scenario_id: 'scenario-alimentos-001', title: 'Documentar acción correctiva', description: 'Completar el formulario de acción correctiva para el lote DUR-2024-042 según procedimiento HACCP.', type: 'evaluation' as const, sequence_order: 2, status: 'pending' as const },
    ];
    for (const t of tasks) {
      await prisma.task.create({ data: t });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. MODULES + COURSE MODULES
  // ═══════════════════════════════════════════════════════════════
  console.log('🧩 Módulos...');
  const modules = [
    { id: 'mod-chat-ia', name: 'Chat IA', type: 'communication' as const, config: {} },
    { id: 'mod-email', name: 'Email Simulado', type: 'communication' as const, config: {} },
    { id: 'mod-documentos', name: 'Documentos', type: 'documentation' as const, config: {} },
    { id: 'mod-planilla', name: 'Hoja de Cálculo', type: 'tools' as const, config: {} },
    { id: 'mod-crisis', name: 'Crisis Engine', type: 'assessment' as const, config: {} },
    { id: 'mod-evaluacion', name: 'Evaluación', type: 'assessment' as const, config: {} },
  ];

  for (const m of modules) {
    await prisma.module.upsert({ where: { id: m.id }, update: {}, create: m });
  }

  for (const c of allCourses) {
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.courseModule.findFirst({
        where: { course_id: c.id, module_id: modules[i].id },
      });
      if (!exists) {
        await prisma.courseModule.create({
          data: {
            course_id: c.id,
            module_id: modules[i].id,
            order: i,
          },
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log('\n🎉 Seed demo (Grupo A) completado!');
  console.log('\n📊 Total de datos creados:');
  console.log('   1  Fundación (FEPEI)');
  console.log('   3  Avaladores');
  console.log('   4  Course-Endorsers');
  console.log('   8  Categorías');
  console.log('   4  Flow Templates');
  console.log('   6  Prompt Templates');
  console.log('   3  Fichas Técnicas');
  console.log('   4  Roles + 18 Funcionalidades + 27 Permisos');
  console.log('   6  Notificaciones');
  console.log('   3  Grupos profesor-alumno');
  console.log('   2  Solicitudes de acceso');
  console.log('   2  Requisitos ministeriales');
  console.log('   6  KPIs');
  console.log('   4  Tareas');
  console.log('   6  Módulos + 20 Course-Modules');
  console.log('\n👤 Login: admin@simuverse.edu / Admin123! (Admin)');
  console.log('👤 Login: juan.perez@student.edu / Admin123! (Alumno)');
  console.log('👤 Login: garcia@simuverse.edu / Admin123! (Profesor)');
  console.log('👤 Login: control@ministerio.gob / Admin123! (Ministerio)');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

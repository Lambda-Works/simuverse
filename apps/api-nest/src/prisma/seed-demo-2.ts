import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Seed demo batch 2 — asignaciones + archivos + KPIs extra...\n');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@simuverse.edu' } });
  const teacher1 = await prisma.user.findUnique({ where: { email: 'garcia@simuverse.edu' } });
  const student1 = await prisma.user.findUnique({ where: { email: 'juan.perez@student.edu' } });
  const student2 = await prisma.user.findUnique({ where: { email: 'maria.lopez@student.edu' } });
  const student3 = await prisma.user.findUnique({ where: { email: 'carlos.soto@student.edu' } });
  const ministerio = await prisma.user.findUnique({ where: { email: 'control@ministerio.gob' } });

  const courseO = await prisma.course.findUnique({ where: { course_id: 'OFI-BAS-001' } });
  const courseT = await prisma.course.findUnique({ where: { course_id: 'TEX-CAL-001' } });
  const courseA = await prisma.course.findUnique({ where: { course_id: 'ALI-SEG-001' } });
  const courseM = await prisma.course.findUnique({ where: { course_id: 'MET-MAN-001' } });

  if (!admin || !student2 || !student3 || !courseO) throw new Error('Run seed.ts, seed-companies.ts and seed-demo.ts first');

  // ═══════════════════════════════════════════════════════════════
  // 1. ASSIGNMENTS + SIMULATIONS FOR MARÍA LÓPEZ
  // ═══════════════════════════════════════════════════════════════
  console.log('👩 María López — asignaciones...');
  for (const c of [courseO!, courseA!]) {
    const assignExists = await prisma.simulationAssignment.findFirst({
      where: { student_id: student2!.id, course_id: c.id },
    });
    if (!assignExists) {
      await prisma.simulationAssignment.create({
        data: {
          simulation_id: `sim-${student2!.id}-${c.course_id}`,
          student_id: student2!.id,
          course_id: c.id,
          assigned_by: admin!.id,
          status: 'in_progress',
        },
      });
      console.log(`   ✅ ${c.title}`);
    }

    const simExists = await prisma.simulation.findFirst({
      where: { student_id: student2!.id, course_id: c.id },
    });
    if (!simExists) {
      await prisma.simulation.create({
        data: { student_id: student2!.id, course_id: c.id, status: 'active' },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. ASSIGNMENTS + SIMULATIONS FOR CARLOS SOTO
  // ═══════════════════════════════════════════════════════════════
  console.log('👨 Carlos Soto — asignaciones...');
  for (const c of [courseT!, courseM!]) {
    const assignExists = await prisma.simulationAssignment.findFirst({
      where: { student_id: student3!.id, course_id: c.id },
    });
    if (!assignExists) {
      await prisma.simulationAssignment.create({
        data: {
          simulation_id: `sim-${student3!.id}-${c.course_id}`,
          student_id: student3!.id,
          course_id: c.id,
          assigned_by: admin!.id,
          status: 'in_progress',
        },
      });
      console.log(`   ✅ ${c.title}`);
    }

    const simExists = await prisma.simulation.findFirst({
      where: { student_id: student3!.id, course_id: c.id },
    });
    if (!simExists) {
      await prisma.simulation.create({
        data: { student_id: student3!.id, course_id: c.id, status: 'active' },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. FILE UPLOADS
  // ═══════════════════════════════════════════════════════════════
  console.log('📁 Archivos subidos...');
  const existingFiles = await prisma.fileUpload.count();
  if (existingFiles === 0) {
    const files = [
      { uploaded_by_id: admin!.id, course_id: courseO!.id, file_name: 'Resolucion_123_2024.pdf', file_type: 'pdf', upload_type: 'ministry_requirement', file_size_bytes: 245000, file_path: '/uploads/ministry/res_123_2024.pdf', description: 'Resolución ministerial — requisitos para cursos de administración' },
      { uploaded_by_id: admin!.id, course_id: courseO!.id, file_name: 'Planilla_QC04_Lote078.xlsx', file_type: 'xlsx', upload_type: 'scenario_resource', file_size_bytes: 15800, file_path: '/uploads/courses/ofimatica/qc04.xlsx', description: 'Planilla de control de calidad — Lote L-2024-078' },
      { uploaded_by_id: admin!.id, course_id: courseA!.id, file_name: 'Normativa_SENASA_HACCP_2024.pdf', file_type: 'pdf', upload_type: 'ministry_requirement', file_size_bytes: 380000, file_path: '/uploads/ministry/senasa_haccp_2024.pdf', description: 'Normativa SENASA HACCP actualizada' },
      { uploaded_by_id: admin!.id, course_id: courseA!.id, file_name: 'Registro_Autoclave_Enero2024.xlsx', file_type: 'xlsx', upload_type: 'scenario_resource', file_size_bytes: 22300, file_path: '/uploads/courses/alimentos/autoclave_ene24.xlsx', description: 'Registro mensual de temperatura de autoclaves' },
    ];
    for (const f of files) {
      await prisma.fileUpload.create({ data: f as any });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. EXTRA KPIs FOR TEX-CAL-001 & MET-MAN-001
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 KPIs extra...');
  const existingKpis = await prisma.kPI.findMany();
  const kpiNames = existingKpis.map(k => k.name);

  const newKpis = [
    { course_id: courseT!.id, name: 'Clasificación de defectos', description: 'Precisión en la identificación y clasificación de defectos textiles según ISO 2859-1.', category: 'hard_skills', weight: 0.35, target_value: 85, minimum_pass_value: 70, thresholds: { excelente: 95, bueno: 85, regular: 70 }, trigger_event: 'decision_made', success_criteria: 'Clasificar correctamente al menos el 90% de los defectos de la muestra.' },
    { course_id: courseT!.id, name: 'Documentación de no conformidades', description: 'Calidad del registro de hallazgos en el formulario QC-04.', category: 'hard_skills', weight: 0.25, target_value: 80, minimum_pass_value: 65, thresholds: { completo: 95, aceptable: 80, incompleto: 65 }, trigger_event: 'document_upload', success_criteria: 'Completar el formulario QC-04 con todos los campos requeridos.' },
    { course_id: courseT!.id, name: 'Comunicación con proveedores', description: 'Claridad y profesionalismo en la comunicación con el cliente (Ministerio de Educación).', category: 'soft_skills', weight: 0.2, target_value: 80, minimum_pass_value: 65, thresholds: { profesional: 90, aceptable: 75, necesita_mejora: 60 }, trigger_event: 'email_reply', success_criteria: 'Redactar respuesta al cliente con datos precisos y tono profesional.' },
    { course_id: courseM!.id, name: 'Priorización de órdenes de trabajo', description: 'Capacidad de evaluar criticidad y ordenar reparaciones por impacto.', category: 'hard_skills', weight: 0.3, target_value: 85, minimum_pass_value: 70, thresholds: { óptimo: 95, bueno: 80, regular: 70 }, trigger_event: 'decision_made', success_criteria: 'Ordenar las reparaciones correctamente según impacto en producción.' },
    { course_id: courseM!.id, name: 'Análisis OEE', description: 'Cálculo y análisis de Overall Equipment Effectiveness.', category: 'hard_skills', weight: 0.25, target_value: 80, minimum_pass_value: 65, thresholds: { experto: 90, competente: 75, básico: 60 }, trigger_event: 'calculation', success_criteria: 'Calcular OEE correctamente e identificar la causa raíz de la baja eficiencia.' },
    { course_id: courseM!.id, name: 'Gestión de repuestos', description: 'Evaluación de costo/beneficio en decisiones de compra de repuestos.', category: 'soft_skills', weight: 0.2, target_value: 80, minimum_pass_value: 65, thresholds: { eficiente: 90, aceptable: 75, costoso: 60 }, trigger_event: 'decision_made', success_criteria: 'Seleccionar la opción de compra que minimice el downtime total.' },
  ];

  const createdNewKpis: string[] = [];
  for (const k of newKpis) {
    if (!kpiNames.includes(k.name)) {
      const r = await prisma.kPI.create({ data: k });
      createdNewKpis.push(r.id);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. EXTRA TASKS
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 Tareas extra...');
  const existingTasks = await prisma.task.count();
  const baseKpis = await prisma.kPI.findMany();

  if (existingTasks <= 4) {
    const findKpi = (name: string) => baseKpis.find(k => k.name === name);

    const newTasks = [
      { course_id: courseT!.id, kpi_id: findKpi('Clasificación de defectos')?.id!, scenario_id: 'scenario-textil-001', title: 'Auditar muestra de tela', description: 'Seleccionar 500 metros al azar del lote y clasificar cada defecto encontrado por tipo y gravedad.', type: 'practice' as const, sequence_order: 1, status: 'pending' as const },
      { course_id: courseT!.id, kpi_id: findKpi('Comunicación con proveedores')?.id!, scenario_id: 'scenario-textil-001', title: 'Responder al Ministerio de Educación', description: 'Redactar respuesta al cliente informando estado del lote, defectos encontrados y fecha estimada de entrega.', type: 'practice' as const, sequence_order: 2, status: 'pending' as const },
      { course_id: courseM!.id, kpi_id: findKpi('Priorización de órdenes de trabajo')?.id!, scenario_id: 'scenario-metal-001', title: 'Priorizar reparaciones CNC', description: 'Evaluar las 3 fallas de CNC y determinar el orden óptimo de reparación según impacto y disponibilidad de repuestos.', type: 'evaluation' as const, sequence_order: 1, status: 'pending' as const },
      { course_id: courseM!.id, kpi_id: findKpi('Gestión de repuestos')?.id!, scenario_id: 'scenario-metal-001', title: 'Evaluar cotizaciones de repuestos', description: 'Comparar las 3 cotizaciones de TecnoParts y decidir qué repuestos comprar primero.', type: 'evaluation' as const, sequence_order: 2, status: 'pending' as const },
    ];
    for (const t of newTasks) {
      if (t.kpi_id) {
        await prisma.task.create({ data: t });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. EXTRA NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('🔔 Notificaciones extra...');
  const notifCount = await prisma.notification.count();
  if (notifCount <= 6) {
    const extraNotifs = [
      { recipient_id: student2!.id, actor_id: admin!.id, type: 'course_assigned' as const, title: 'Nuevos cursos asignados', content: 'Se te asignaron los cursos "Ofimática Básica" y "Seguridad e Higiene Alimentaria". ¡Empezá a simular!', is_read: false },
      { recipient_id: student3!.id, actor_id: admin!.id, type: 'course_assigned' as const, title: 'Nuevos cursos asignados', content: 'Se te asignaron "Control de Calidad Textil" y "Gestión de Mantenimiento Industrial".', is_read: false },
      { recipient_id: teacher1!.id, actor_id: admin!.id, type: 'system_alert' as const, title: 'Alumnos asignados a tu grupo', content: 'María López y Carlos Soto fueron agregados a tu grupo. Revisá sus progresos.', is_read: false },
      { recipient_id: teacher1!.id, actor_id: null, type: 'evaluation_ready' as const, title: 'Evaluaciones pendientes', content: 'Tenés 2 evaluaciones pendientes de revisión para Juan Pérez (Ofimática Básica y Control Textil).', is_read: false },
    ];
    for (const n of extraNotifs) {
      await prisma.notification.create({ data: n });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. EXTRA CATEGORIES
  // ═══════════════════════════════════════════════════════════════
  console.log('📂 Categorías extra...');
  const cats = [
    { name: 'oratoria', code: 'ORA', description: 'Cursos de oratoria y comunicación profesional' },
    { name: 'emprendimiento', code: 'EMP', description: 'Cursos de emprendimiento y gestión de negocios' },
    { name: 'logistica', code: 'LOG', description: 'Cursos de logística y cadena de suministro' },
    { name: 'comercio_exterior', code: 'CEX', description: 'Cursos de comercio exterior y aduanas' },
  ];
  for (const cat of cats) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log('\n🎉 Seed demo batch 2 completado!');
  console.log('\n📊 Datos agregados:');
  console.log('   2  Asignaciones + sims para María López');
  console.log('   2  Asignaciones + sims para Carlos Soto');
  console.log('   4  Archivos subidos');
  console.log('   6  KPIs extra (TextilNorte + MetalRos)');
  console.log('   4  Tareas extra');
  console.log('   4  Notificaciones extra');
  console.log('   4  Categorías extra');
  console.log('\n👤 Login: maria.lopez@student.edu / Admin123! (2 cursos)');
  console.log('👤 Login: carlos.soto@student.edu / Admin123! (2 cursos)');
  console.log('👤 Login: garcia@simuverse.edu / Admin123! (8 alumnos en grupo)');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

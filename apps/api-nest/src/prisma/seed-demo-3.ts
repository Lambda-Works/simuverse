import { PrismaClient, FileUploadType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Seed demo batch 3 — ministerio completo + grupos + archivos extra...\n');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@simuverse.edu' } });
  const teacher2 = await prisma.user.findUnique({ where: { email: 'martinez@simuverse.edu' } });
  const student1 = await prisma.user.findUnique({ where: { email: 'juan.perez@student.edu' } });
  const student2 = await prisma.user.findUnique({ where: { email: 'maria.lopez@student.edu' } });
  const student3 = await prisma.user.findUnique({ where: { email: 'carlos.soto@student.edu' } });

  const courseT = await prisma.course.findUnique({ where: { course_id: 'TEX-CAL-001' } });
  const courseM = await prisma.course.findUnique({ where: { course_id: 'MET-MAN-001' } });

  if (!admin || !teacher2 || !student1 || !courseT || !courseM) throw new Error('Run seed.ts, seed-companies.ts and seed-demo.ts first');

  // ═══════════════════════════════════════════════════════════════
  // 1. MINISTRY REQUIREMENTS FOR TEX-CAL-001 & MET-MAN-001
  // ═══════════════════════════════════════════════════════════════
  console.log('🏛️  Requisitos ministeriales extra...');
  const existing = await prisma.ministryRequirement.count();
  let mreqT: any, mreqM: any;

  if (existing <= 2) {
    mreqT = await prisma.ministryRequirement.create({
      data: {
        course_id: courseT!.id,
        uploaded_by_id: admin!.id,
        file_name: 'Disposicion_Ministerial_Textil_045_2024.pdf',
        file_type: 'pdf' as any,
        file_size_bytes: 210000,
        file_path: '/uploads/ministry/disp_045_2024.pdf',
        raw_text: 'Disposición 045/2024 del Ministerio de Trabajo. Establece los estándares de calidad para la industria textil en programas de formación profesional.',
        status: 'active',
        kpis_generated: 3,
        tasks_generated: 3,
      },
    });

    mreqM = await prisma.ministryRequirement.create({
      data: {
        course_id: courseM!.id,
        uploaded_by_id: admin!.id,
        file_name: 'Norma_IRAM_ISO_55000_Mantenimiento.pdf',
        file_type: 'pdf' as any,
        file_size_bytes: 320000,
        file_path: '/uploads/ministry/iram_55000.pdf',
        raw_text: 'Norma IRAM-ISO 55000: Gestión de activos. Aplicable a mantenimiento industrial. Define indicadores OEE, MTBF y MTTR como métricas obligatorias.',
        status: 'active',
        kpis_generated: 3,
        tasks_generated: 3,
      },
    });
  } else {
    const mreqs = await prisma.ministryRequirement.findMany({ orderBy: { created_at: 'asc' }, skip: 2, take: 2 });
    mreqT = mreqs.find(m => m.course_id === courseT!.id);
    mreqM = mreqs.find(m => m.course_id === courseM!.id);
    if (!mreqT || !mreqM) {
      const all = await prisma.ministryRequirement.findMany({ orderBy: { created_at: 'asc' } });
      mreqT = all[2];
      mreqM = all[3];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. EXTRA KPIs
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 KPIs complementarios...');
  const allKpiNames = (await prisma.kPI.findMany()).map(k => k.name);

  const extraKpis = [
    { course_id: courseT!.id, ministry_requirement_id: mreqT!.id, name: 'Cumplimiento normativo ISO 2859-1', description: 'Grado de adherencia a la norma de muestreo en todo el proceso.', category: 'hard_skills', weight: 0.3, target_value: 90, minimum_pass_value: 75, thresholds: { sobresaliente: 95, cumple: 85, no_cumple: 70 }, trigger_event: 'decision_made', success_criteria: 'Aplicar correctamente la tabla AQL en al menos 3 decisiones de muestreo.' },
    { course_id: courseT!.id, ministry_requirement_id: mreqT!.id, name: 'Trabajo en equipo en planta', description: 'Capacidad de coordinar con supervisores y operarios durante la auditoría.', category: 'soft_skills', weight: 0.15, target_value: 75, minimum_pass_value: 60, thresholds: { lider: 90, colaborativo: 75, individual: 55 }, trigger_event: 'message_sent', success_criteria: 'Coordinar al menos 2 interacciones con personal de planta.' },
    { course_id: courseM!.id, ministry_requirement_id: mreqM!.id, name: 'Cálculo de MTBF y MTTR', description: 'Precisión en el cálculo de métricas de mantenimiento.', category: 'hard_skills', weight: 0.25, target_value: 85, minimum_pass_value: 70, thresholds: { preciso: 95, aceptable: 80, inexacto: 65 }, trigger_event: 'calculation', success_criteria: 'Calcular MTBF y MTTR con menos del 5% de error.' },
    { course_id: courseM!.id, ministry_requirement_id: mreqM!.id, name: 'Comunicación de planes de parada', description: 'Claridad al informar tiempos de downtime a producción y clientes.', category: 'soft_skills', weight: 0.15, target_value: 80, minimum_pass_value: 65, thresholds: { claro: 90, aceptable: 75, confuso: 60 }, trigger_event: 'email_reply', success_criteria: 'Informar plan de recuperación con estimaciones realistas y lenguaje claro.' },
  ];

  for (const k of extraKpis) {
    if (!allKpiNames.includes(k.name)) {
      await prisma.kPI.create({ data: k });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. EXTRA TASKS
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 Tareas complementarias...');
  const existingTasks = await prisma.task.count();
  const baseKpis = await prisma.kPI.findMany();
  const findKpi = (name: string) => baseKpis.find(k => k.name === name);

  if (existingTasks <= 8) {
    const extraTasks = [
      { course_id: courseT!.id, kpi_id: findKpi('Cumplimiento normativo ISO 2859-1')?.id!, scenario_id: 'scenario-textil-001', title: 'Verificar tabla AQL', description: 'Consultar la tabla AQL 2.5 y determinar el número máximo de defectos aceptables para el lote de 5000 metros.', type: 'practice' as const, sequence_order: 3, status: 'pending' as const },
      { course_id: courseT!.id, kpi_id: findKpi('Trabajo en equipo en planta')?.id!, scenario_id: 'scenario-textil-001', title: 'Coordinar con mantenimiento', description: 'Contactar al equipo de mantenimiento del telar #4 y obtener un ETA de reparación para incluirlo en el informe.', type: 'practice' as const, sequence_order: 4, status: 'pending' as const },
      { course_id: courseM!.id, kpi_id: findKpi('Cálculo de MTBF y MTTR')?.id!, scenario_id: 'scenario-metal-001', title: 'Calcular indicadores de mantenimiento', description: 'Usar los datos históricos de los CNC para calcular MTBF y MTTR de cada máquina.', type: 'evaluation' as const, sequence_order: 3, status: 'pending' as const },
      { course_id: courseM!.id, kpi_id: findKpi('Comunicación de planes de parada')?.id!, scenario_id: 'scenario-metal-001', title: 'Informar plan de recuperación a producción', description: 'Redactar un memo para el gerente de producción con el plan de recuperación de los 3 CNC.', type: 'evaluation' as const, sequence_order: 4, status: 'pending' as const },
    ];
    for (const t of extraTasks) {
      if (t.kpi_id) {
        await prisma.task.create({ data: t });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. TEACHER GROUPS — Prof. Martínez
  // ═══════════════════════════════════════════════════════════════
  console.log('👥 Grupos Prof. Martínez...');
  const martinezGroups = [
    { teacher_id: teacher2!.id, student_id: student1!.id },
    { teacher_id: teacher2!.id, student_id: student2!.id },
    { teacher_id: teacher2!.id, student_id: student3!.id },
  ];
  for (const g of martinezGroups) {
    const exists = await prisma.teacherGroup.findFirst({
      where: { teacher_id: g.teacher_id, student_id: g.student_id },
    });
    if (!exists) {
      await prisma.teacherGroup.create({ data: g });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. EXTRA FILE UPLOADS
  // ═══════════════════════════════════════════════════════════════
  console.log('📁 Archivos extra...');
  const fileCount = await prisma.fileUpload.count();
  if (fileCount <= 4) {
    const extraFiles = [
      { uploaded_by_id: admin!.id, course_id: courseT!.id, file_name: 'Catalogo_Defectos_Textiles.pdf', file_type: 'pdf', upload_type: 'scenario_resource' as FileUploadType, file_size_bytes: 125000, file_path: '/uploads/courses/textil/catalogo_defectos.pdf', description: 'Catálogo visual de defectos textiles con ejemplos fotográficos' },
      { uploaded_by_id: admin!.id, course_id: courseT!.id, file_name: 'ISO_2859-1_Tablas_Muestreo.xlsx', file_type: 'xlsx', upload_type: 'scenario_resource' as FileUploadType, file_size_bytes: 48200, file_path: '/uploads/courses/textil/tablas_iso.xlsx', description: 'Tablas de muestreo ISO 2859-1 completas' },
      { uploaded_by_id: admin!.id, course_id: courseM!.id, file_name: 'Manual_Mantenimiento_CNC_Haas.pdf', file_type: 'pdf', upload_type: 'scenario_resource' as FileUploadType, file_size_bytes: 890000, file_path: '/uploads/courses/metalurgica/manual_haas.pdf', description: 'Manual técnico de tornos CNC Haas serie ST' },
      { uploaded_by_id: admin!.id, course_id: courseM!.id, file_name: 'Historial_Fallas_CNC_2024.xlsx', file_type: 'xlsx', upload_type: 'scenario_resource' as FileUploadType, file_size_bytes: 34200, file_path: '/uploads/courses/metalurgica/historial_fallas.xlsx', description: 'Historial de fallas de los 3 CNC últimos 12 meses' },
    ];
    for (const f of extraFiles) {
      await prisma.fileUpload.create({ data: f });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. FLOW TEMPLATE — entrepreneurship
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 Flow Template emprendimiento...');
  const flowExists = await prisma.flowTemplate.findFirst({ where: { family: 'entrepreneurship' } });
  if (!flowExists) {
    await prisma.flowTemplate.create({
      data: {
        id: 'flow-emprendimiento',
        course_id: courseT!.id,
        course_code: 'EMP-GEN-001',
        title: 'Flujo Emprendimiento',
        family: 'entrepreneurship',
        description: 'Template para cursos de emprendimiento y creación de negocios',
        template_data: JSON.stringify({ steps: ['idea_validation', 'business_model', 'mvp', 'pitch'] }),
        created_by: admin!.id,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. PROMPT TEMPLATE — emprendimiento
  // ═══════════════════════════════════════════════════════════════
  console.log('💬 Prompt Template emprendimiento...');
  const promptExists = await prisma.promptTemplate.findFirst({ where: { category: 'emprendimiento' } });
  if (!promptExists) {
    await prisma.promptTemplate.create({
      data: {
        name: 'Inversor Ángel',
        description: 'Pitch de inversión',
        category: 'emprendimiento',
        base_role: 'Sos un inversor ángel evaluando un pitch de startup. Tenés un fondo de USD 500K para invertir.',
        course_context: 'El alumno es un emprendedor que presenta su proyecto.',
        personality_traits: JSON.stringify(['escéptico', 'analítico', 'directo']),
        knowledge_base_prompt: 'Hacé preguntas incisivas sobre el modelo de negocio, tracción y escalabilidad. Si el pitch es sólido, mostrá interés.',
        created_by: admin!.id,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. ACCESS REQUEST — Juan Pérez
  // ═══════════════════════════════════════════════════════════════
  console.log('📩 Solicitud de acceso extra...');
  const reqExists = await prisma.accessRequest.findFirst({
    where: { student_id: student1!.id, course_id: courseM!.id },
  });
  if (!reqExists) {
    await prisma.accessRequest.create({
      data: {
        student_id: student1!.id,
        course_id: courseM!.id,
        student_name: student1!.name,
        student_email: student1!.email,
        course_name: 'Gestión de Mantenimiento Industrial',
        reason: 'Ya completé los otros 3 cursos. Me interesa sumar conocimientos de mantenimiento industrial para complementar mi perfil.',
        status: 'pending',
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. EXTRA NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('🔔 Notificaciones extra...');
  const notifCount = await prisma.notification.count();
  if (notifCount <= 10) {
    const extraNotifs = [
      { recipient_id: teacher2!.id, actor_id: admin!.id, type: 'system_alert' as const, title: 'Alumnos asignados a tu grupo', content: 'Juan, María y Carlos fueron asignados a tu grupo de supervisión.', is_read: false },
      { recipient_id: student1!.id, actor_id: null, type: 'evaluation_ready' as const, title: 'Evaluación lista', content: 'Tu evaluación de "Control de Calidad Textil" ya está disponible para revisión.', is_read: false },
      { recipient_id: student2!.id, actor_id: null, type: 'kpi_achieved' as const, title: '¡KPI alcanzado!', content: 'Superaste el 80% en el KPI de seguridad alimentaria de "Seguridad e Higiene Alimentaria".', is_read: false },
    ];
    for (const n of extraNotifs) {
      await prisma.notification.create({ data: n });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log('\n🎉 Seed demo batch 3 completado!');
  console.log('\n📊 Datos agregados:');
  console.log('   2  Ministry requirements (Textil + Metal)');
  console.log('   4  KPIs complementarios');
  console.log('   4  Tareas extra');
  console.log('   3  Grupos Prof. Martínez');
  console.log('   4  Archivos extra (2 textil + 2 metal)');
  console.log('   1  Flow template (emprendimiento)');
  console.log('   1  Prompt template (Inversor Ángel)');
  console.log('   1  Solicitud de acceso (Juan → Metal)');
  console.log('   3  Notificaciones extra');
  console.log('\n✅ Ahora los 4 cursos tienen KPIs + tasks + archivos');
  console.log('✅ Los 2 profesores tienen grupos de alumnos');
  console.log('✅ Todos los FamilyTypes tienen flow template');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Seed de review — instancias, chat logs y evaluaciones...\n');

  const student1 = await prisma.user.findUnique({ where: { email: 'juan.perez@student.edu' } });
  if (!student1) throw new Error('Run seed.ts first');

  const courseO = await prisma.course.findUnique({ where: { course_id: 'OFI-BAS-001' } });
  const courseT = await prisma.course.findUnique({ where: { course_id: 'TEX-CAL-001' } });
  if (!courseO || !courseT) throw new Error('Run seed.ts and seed-companies.ts first');

  const scenarioO = await prisma.scenario.findUnique({ where: { id: 'scenario-primer-dia-001' } });
  const scenarioT = await prisma.scenario.findUnique({ where: { id: 'scenario-textil-001' } });

  const simO = await prisma.simulation.findFirst({
    where: { student_id: student1.id, course_id: courseO.id },
  });
  const simT = await prisma.simulation.findFirst({
    where: { student_id: student1.id, course_id: courseT.id },
  });

  // ═══════════════════════════════════════════════════════════════
  // Simulation Instance 1: Ofimática (completed)
  // ═══════════════════════════════════════════════════════════════
  console.log('📝 Instancia: Ofimática Básica...');
  let instO = await prisma.simulationInstance.findFirst({
    where: { student_id: student1.id, scenario_id: scenarioO!.id },
  });
  if (!instO) {
    instO = await prisma.simulationInstance.create({
      data: {
        student_id: student1.id,
        scenario_id: scenarioO!.id,
        course_id: courseO.id,
        status: 'completed',
        progress_percentage: 100,
        score: 82,
        feedback: 'Juan demostró buena capacidad para resolver los emails y la liquidación de sueldos. Mejoró notablemente en la segunda mitad de la simulación. Necesita reforzar la priorización de tareas urgentes.',
        time_spent_seconds: 2700,
        started_at: new Date('2026-07-01T10:00:00Z'),
        completed_at: new Date('2026-07-01T10:45:00Z'),
      },
    });
  }

  // Chat logs for Ofimática instance
  const existingChatsO = await prisma.simulationChatLog.count({
    where: { simulation_instance_id: instO.id },
  });
  if (existingChatsO === 0) {
    const chatsO = [
      { turn_number: 1, speaker: 'student', message: 'Hola Carlos, ¿en qué necesitás ayuda con la planilla?', is_correct: null },
      { turn_number: 2, speaker: 'ai', message: 'Hola Juan. Necesito que me ayudes con la fórmula de aportes jubilatorios. No me está dando bien el cálculo.', is_correct: null },
      { turn_number: 3, speaker: 'student', message: 'Claro, los aportes jubilatorios son el 17% del sueldo base. Multiplicá 450000 × 0.17.', is_correct: true },
      { turn_number: 4, speaker: 'ai', message: '¡Ahí va! Me da 76.500. Pero el sistema de liquidación dice 81.060... ¿qué estoy haciendo mal?', is_correct: null },
      { turn_number: 5, speaker: 'student', message: 'Estás usando el sueldo base solo. También tenés que incluir las horas extra. El total bruto es 450.000 + 28.000 = 478.000.', is_correct: true },
      { turn_number: 6, speaker: 'ai', message: '¡Perfecto! Ahora sí: 478.000 × 0.17 = 81.260. Sigue sin dar exacto pero se acerca más.', is_correct: null },
      { turn_number: 7, speaker: 'student', message: 'Fijate que el neto se calcula: sueldo base + horas extra - aportes - obra social - ART. Probá con la planilla de fórmulas que está en la pestaña Planilla.', is_correct: true },
      { turn_number: 8, speaker: 'ai', message: 'Genial, ya lo resolví. El neto es 470.830. ¡Gracias Juan!', is_correct: null },
      { turn_number: 9, speaker: 'student', message: 'De nada Carlos. Ahora voy a revisar los emails urgentes del jefe.', is_correct: null },
      { turn_number: 10, speaker: 'system', message: 'El jefe envió un email urgente sobre el error en liquidación de sueldos.', is_correct: null },
      { turn_number: 11, speaker: 'student', message: 'Leí el email del jefe. Hay un error de coeficiente que afecta a 47 empleados. Propongo recalcular con el coeficiente correcto y enviar reliquidación.', is_correct: true },
    ];
    for (const c of chatsO) {
      await prisma.simulationChatLog.create({
        data: { simulation_instance_id: instO.id, ...c },
      });
    }
  }

  // Evaluation for Ofimática
  const evalOExists = await prisma.simulationEvaluation.findFirst({
    where: { student_id: student1.id, simulation_id: simO!.id },
  });
  if (!evalOExists) {
    await prisma.simulationEvaluation.create({
      data: {
        assignment_id: 1,
        student_id: student1.id,
        simulation_id: simO!.id,
        attempt_number: 1,
        kpi_results: {
          precision_liquidacion: { score: 85, passed: true },
          tiempo_respuesta: { score: 75, passed: true },
          calidad_comunicacion: { score: 80, passed: true },
          resolucion_crisis: { score: 88, passed: true },
        },
        overall_score: 82,
        overall_feedback: 'Juan demostró buena capacidad resolutiva. Identificó correctamente el error de aportes y guió a su compañero con precisión. Respondió los emails dentro del tiempo esperado. Puntos a mejorar: leer los emails urgentes antes de empezar a trabajar en la planilla para priorizar mejor.',
        completion_percentage: 100,
        time_spent_seconds: 2700,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Simulation Instance 2: Textil (in_progress)
  // ═══════════════════════════════════════════════════════════════
  console.log('📝 Instancia: Control Textil...');
  let instT = await prisma.simulationInstance.findFirst({
    where: { student_id: student1.id, scenario_id: scenarioT!.id },
  });
  if (!instT) {
    instT = await prisma.simulationInstance.create({
      data: {
        student_id: student1.id,
        scenario_id: scenarioT!.id,
        course_id: courseT.id,
        status: 'in_progress',
        progress_percentage: 45,
        score: null,
        time_spent_seconds: 1200,
        started_at: new Date('2026-07-02T14:00:00Z'),
      },
    });
  }

  const existingChatsT = await prisma.simulationChatLog.count({
    where: { simulation_instance_id: instT.id },
  });
  if (existingChatsT === 0) {
    const chatsT = [
      { turn_number: 1, speaker: 'student', message: 'Buenas tardes José, vengo a revisar el lote L-2024-078 que presenta defectos.', is_correct: null },
      { turn_number: 2, speaker: 'ai', message: 'Bienvenido Juan. Sí, tenemos 600 metros con defectos visibles de un total de 5000. Necesito que clasifiques las fallas antes del mediodía.', is_correct: null },
      { turn_number: 3, speaker: 'student', message: 'De acuerdo. Según la norma ISO 2859-1, debo tomar una muestra del 10%. De los 500 metros revisados encontré: 35 defectos de trama, 18 manchas y 12 variaciones de tono.', is_correct: true },
      { turn_number: 4, speaker: 'ai', message: 'Correcto. Con 73 defectos en 500 metros, el porcentaje defectuoso es 14.6%. El AQL máximo es 2.5%. ¿Qué decisión tomás?', is_correct: null },
      { turn_number: 5, speaker: 'student', message: 'El lote debe ser RECHAZADO. 14.6% supera ampliamente el AQL de 2.5%. Además, el telar #4 está fuera de servicio, lo que explica los defectos de trama.', is_correct: true },
      { turn_number: 6, speaker: 'ai', message: 'Excelente análisis. Pero tenemos presión del cliente. El Ministerio de Educación espera la entrega el viernes. ¿Qué le decimos?', is_correct: null },
    ];
    for (const c of chatsT) {
      await prisma.simulationChatLog.create({
        data: { simulation_instance_id: instT.id, ...c },
      });
    }
  }

  console.log('\n✅ Seed de review completado!');
  console.log('   1 instancia completada (Ofimática) con 11 chat logs + evaluación');
  console.log('   1 instancia en progreso (Textil) con 6 chat logs');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

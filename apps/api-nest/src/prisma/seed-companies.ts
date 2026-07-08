import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CompanyDef {
  course_id: string;
  courseId: string;
  courseTitle: string;
  courseDesc: string;
  category: string;
  family_type: 'rrhh' | 'administration' | 'it';
  company: {
    name: string;
    short_name: string;
    description: string;
    industry: string;
    city: string;
    country: string;
    website: string;
    is_fictional: boolean;
    logo_url: string;
  };
  config: {
    base_role: string;
    course_context: string;
    personality_traits: string[];
    knowledge_base_prompt: string;
  };
  scenario: {
    id: string;
    title: string;
    description: string;
    scenario_type: string;
    difficulty: 'easy' | 'medium' | 'hard';
    content: any;
    expected_outcomes: any;
  };
  documents: { document_name: string; document_type: 'procedure' | 'contract' | 'policy'; document_content: string }[];
}

const companies: CompanyDef[] = [
  {
    course_id: 'TEX-CAL-001',
    courseId: 'course-textil-001',
    courseTitle: 'Control de Calidad en Industria Textil',
    courseDesc: 'Simulación de control de calidad en planta textil. Identificá fallas, aplicá normas ISO y gestioná no conformidades.',
    category: 'rrhh',
    family_type: 'rrhh',
    company: {
      name: 'TextilNorte S.A.',
      short_name: 'TextilNorte',
      description: 'Fábrica de tejidos de algodón y poliéster. 350 empleados. Principal proveedor de uniformes escolares en la región.',
      industry: 'textil',
      city: 'Rosario',
      country: 'Argentina',
      website: 'https://textilnorte.com.ar',
      is_fictional: true,
      logo_url: '/logos/textilnorte.png',
    },
    config: {
      base_role: 'Sos el supervisor de calidad de TextilNorte, José. Tenés 15 años en la planta y conocés cada máquina. Estás revisando un lote con defectos y necesitás ayuda para documentar las no conformidades.',
      course_context: 'El estudiante es un pasante de control de calidad en TextilNorte S.A., una fábrica textil de Rosario. Está en su segunda semana y debe auditar un lote de 5000 metros de tela que presenta fallas de trama.',
      personality_traits: ['detallista', 'exigente', 'didáctico', 'pragmático'],
      knowledge_base_prompt: 'Guiá al pasante en la identificación de defectos textiles (barrado, agujeros, manchas, variación de tono). Explicá las normas ISO 2859-1 para muestreo. Si comete errores en el conteo de defectos, corregilo con ejemplos visuales.',
    },
    scenario: {
      id: 'scenario-textil-001',
      title: 'Auditoría de Calidad en Planta Textil',
      description: 'Un lote de 5000 metros de tela para uniformes escolares presenta defectos. Debés auditar el lote, clasificar las fallas y decidir si se libera o se rechaza.',
      scenario_type: 'quality_control',
      difficulty: 'medium',
      content: {
        context: 'Son las 8:30 AM en la planta de TextilNorte. El supervisor José te muestra el parte de producción: el lote L-2024-078 de tela azul marino tiene un 12% de piezas con defectos visibles. El cliente (Ministerio de Educación) espera la entrega el viernes.',
        student_data: {
          nombre: 'Juan Pérez',
          rol: 'Pasante de Control de Calidad',
          empresa: 'TextilNorte S.A.',
        },
        emails: [
          {
            id: 1,
            from: 'José (Supervisor de Calidad)',
            subject: 'Reporte de defectos — Lote L-2024-078',
            body: 'Juan, te paso el reporte preliminar del lote azul marino. De 5000 metros, encontramos 600 con defectos. Necesito que clasifiques las fallas por tipo y gravedad antes del mediodía. Adjunto la planilla de muestreo.',
            date: new Date().toISOString(),
            read: false,
          },
          {
            id: 2,
            from: 'Compras — Ministerio de Educación',
            subject: 'URGENTE: Fecha límite de entrega',
            body: 'TextilNorte, necesitamos confirmación de entrega de los 5000 metros de tela azul marino para el viernes 15 sin falta. Los talleres de confección arrancan el lunes. Cualquier demora afecta a 47 escuelas.',
            date: new Date().toISOString(),
            read: false,
          },
          {
            id: 3,
            from: 'Mantenimiento — Telar #4',
            subject: 'Novedad: telar fuera de servicio',
            body: 'Aviso: el telar #4 presenta desgaste en el peine. Posible causa de los defectos de trama en el lote actual. Técnicos trabajando. ETA de reparación: 4 horas.',
            date: new Date().toISOString(),
            read: false,
            isUrgent: true,
          },
        ],
        spreadsheet: {
          name: 'Muestreo de Calidad — Lote L-2024-078',
          data: [
            { item: 'Metros totales del lote', value: 5000, currency: 'm' },
            { item: 'Metros auditados (muestra)', value: 500, currency: 'm' },
            { item: 'Defectos de trama (barrado)', value: 35, currency: 'unidades' },
            { item: 'Manchas de tintura', value: 18, currency: 'unidades' },
            { item: 'Variación de tono', value: 12, currency: 'unidades' },
            { item: 'Agujeros / roturas', value: 8, currency: 'unidades' },
            { item: 'Total defectos muestra', value: 73, currency: 'unidades' },
            { item: '% Defectuoso estimado', value: 14.6, currency: '%' },
            { item: 'Límite aceptable (AQL 2.5)', value: 2.5, currency: '%' },
          ],
          formulas: {
            '% Defectuoso': '= (Total defectos / Metros auditados) × 100',
            'AQL (Nivel de Calidad Aceptable)': '= Límite máximo de defectos según ISO 2859-1',
            'Decisión': '= SI % Defectuoso > AQL → RECHAZAR lote',
          },
        },
      },
      expected_outcomes: {
        main_objective: 'Clasificar los defectos del lote textil, aplicar la norma de muestreo ISO 2859-1 y decidir si el lote se libera, se reprocesa o se rechaza.',
      },
    },
    documents: [
      {
        document_name: 'Procedimiento de Control de Calidad — ISO 2859-1',
        document_type: 'procedure',
        document_content: 'PROCEDIMIENTO DE MUESTREO: 1. Seleccionar muestra aleatoria del lote (10% del total). 2. Inspeccionar cada metro bajo luz normalizada. 3. Clasificar defectos: críticos, mayores, menores. 4. Comparar contra tabla AQL. 5. Documentar en planilla QC-04.',
      },
      {
        document_name: 'Contrato Ministerio de Educación — Licitación 2024-03',
        document_type: 'contract',
        document_content: 'CONTRATO DE PROVISIÓN: TextilNorte S.A. proveerá 5000 metros de tela azul marino (Pantone 289 C) para uniformes escolares. Tolerancia de defectos: máximo 2.5% según AQL. Penalidad por incumplimiento: 15% del valor del contrato por semana de demora.',
      },
      {
        document_name: 'Ficha Técnica — Tela Azul Marino Uniforme',
        document_type: 'policy',
        document_content: 'FICHA TÉCNICA: Composición: 65% poliéster, 35% algodón. Ancho: 1.50 m. Gramaje: 180 g/m². Solidez del color: grado 4 (escala azul). Acabado: anti-peeling. Norma aplicable: IRAM 7501.',
      },
    ],
  },
  {
    course_id: 'ALI-SEG-001',
    courseId: 'course-alimentos-001',
    courseTitle: 'Seguridad e Higiene Alimentaria',
    courseDesc: 'Simulación de inspección sanitaria en planta de conservas. Aplicá normas HACCP y gestioná puntos críticos de control.',
    category: 'administracion',
    family_type: 'administration',
    company: {
      name: 'Conservas del Litoral S.A.',
      short_name: 'Conservas Litoral',
      description: 'Planta elaboradora de conservas de frutas y hortalizas. 120 empleados. Exporta a Brasil y Chile. Certificación HACCP vigente.',
      industry: 'alimenticia',
      city: 'Santa Fe',
      country: 'Argentina',
      website: 'https://conservaslitoral.com.ar',
      is_fictional: true,
      logo_url: '/logos/conservas-litoral.png',
    },
    config: {
      base_role: 'Sos Laura, la jefa de calidad de Conservas del Litoral. Estás preparando la auditoría de renovación HACCP y necesitás que el pasante verifique los registros de temperatura de las autoclaves del último mes.',
      course_context: 'El estudiante es un pasante de seguridad alimentaria en Conservas del Litoral. Mañana viene el auditor de SENASA para renovar la certificación HACCP. Hay registros de temperatura que muestran desviaciones y hay que analizarlos antes de la auditoría.',
      personality_traits: ['rigurosa', 'precavida', 'clara', 'orientada a normas'],
      knowledge_base_prompt: 'Guiá al pasante en el análisis de PCC (Puntos Críticos de Control). Explicá los límites críticos para esterilización de conservas (121°C por 15 min). Si detecta desviaciones, ayudalo a determinar acciones correctivas y si corresponde un recall.',
    },
    scenario: {
      id: 'scenario-alimentos-001',
      title: 'Inspección Sanitaria en Planta de Conservas',
      description: 'Mañana llega el auditor de SENASA para renovar la certificación HACCP. Hay registros de autoclave con desviaciones de temperatura. Debés analizarlos y preparar la documentación.',
      scenario_type: 'audit',
      difficulty: 'medium',
      content: {
        context: 'Viernes 16:00 hs en Conservas del Litoral. Laura te pasa la carpeta de registros del último mes. La autoclave #2 muestra 3 días con temperaturas por debajo de 121°C. Hay 800 frascos de duraznos en almíbar potencialmente afectados. El lote ya fue despachado a un supermercado.',
        student_data: {
          nombre: 'Juan Pérez',
          rol: 'Pasante de Calidad Alimentaria',
          empresa: 'Conservas del Litoral S.A.',
        },
        emails: [
          {
            id: 1,
            from: 'Laura (Jefa de Calidad)',
            subject: 'Registros de autoclave — Revisión urgente',
            body: 'Juan, revisé los registros de temperatura de la autoclave #2. Hay 3 días con lecturas por debajo del límite crítico: 118°C, 115°C y 117°C. Corresponden al lote DUR-2024-042. Necesito tu análisis para mañana antes de la auditoría.',
            date: new Date().toISOString(),
            read: false,
          },
          {
            id: 2,
            from: 'Distribuidora Mayorista S.A.',
            subject: 'Reclamo: frascos con tapa hinchada',
            body: 'Recibimos el lote DUR-2024-042 de duraznos en almíbar. Detectamos 12 frascos con tapa abombada en góndola. Solicitamos retiro inmediato y análisis de causa raíz. Adjuntamos fotos.',
            date: new Date().toISOString(),
            read: false,
          },
          {
            id: 3,
            from: 'SENASA — Auditoría Programada',
            subject: 'Confirmación de auditoría HACCP — Lunes 9 AM',
            body: 'Confirmamos la auditoría de renovación de certificación HACCP para el lunes a las 9:00 AM. Solicitamos tener disponibles: registros de PCC de 12 meses, plan HACCP actualizado, y registros de acciones correctivas.',
            date: new Date().toISOString(),
            read: false,
            isUrgent: true,
          },
        ],
        spreadsheet: {
          name: 'Registro de Temperatura — Autoclave #2',
          data: [
            { item: 'Día 1 — Lote DUR-2024-042', value: 121, currency: '°C' },
            { item: 'Día 2 — Lote DUR-2024-042', value: 118, currency: '°C' },
            { item: 'Día 3 — Lote DUR-2024-042', value: 119, currency: '°C' },
            { item: 'Día 4 — Lote DUR-2024-043', value: 115, currency: '°C' },
            { item: 'Día 5 — Lote DUR-2024-043', value: 121, currency: '°C' },
            { item: 'Día 6 — Lote DUR-2024-044', value: 117, currency: '°C' },
            { item: 'Día 7 — Lote DUR-2024-044', value: 122, currency: '°C' },
            { item: 'Límite crítico HACCP', value: 121, currency: '°C' },
            { item: 'Frascos afectados (estimado)', value: 800, currency: 'unidades' },
          ],
          formulas: {
            'Temperatura mínima segura': '= 121°C sostenida por 15 minutos',
            'Desviación': '= SI Temperatura < 121°C → PÉRDIDA DE CONTROL DE PCC',
            'Acción correctiva': '= SI desviación → RETENER LOTE + REPROCESAR o DESCARTAR',
          },
        },
      },
      expected_outcomes: {
        main_objective: 'Analizar las desviaciones de temperatura de la autoclave, determinar si corresponde un recall del lote, y preparar la documentación para la auditoría de SENASA.',
      },
    },
    documents: [
      {
        document_name: 'Plan HACCP — Conservas del Litoral',
        document_type: 'procedure',
        document_content: 'PLAN HACCP: PCC-1: Esterilización en autoclave. Límite crítico: 121°C durante 15 minutos. Monitoreo: termógrafo digital cada lote. Acción correctiva: si T < 121°C, retener lote, reevaluar esterilidad, reprocesar o descartar. Registro: Planilla HACCP-PCC1-03.',
      },
      {
        document_name: 'Norma SENASA — Conservas Vegetales',
        document_type: 'policy',
        document_content: 'RESOLUCIÓN SENASA 423/2021: Las conservas vegetales de baja acidez deben alcanzar esterilización comercial equivalente a Fo ≥ 3.0 min. Temperatura de referencia: 121°C. Todo desvío debe registrarse y notificarse en 24 hs.',
      },
    ],
  },
  {
    course_id: 'MET-MAN-001',
    courseId: 'course-metalurgica-001',
    courseTitle: 'Gestión de Mantenimiento Industrial',
    courseDesc: 'Simulación de planificación de mantenimiento en planta metalúrgica. Priorizá órdenes de trabajo, gestioná repuestos y analizá indicadores OEE.',
    category: 'it',
    family_type: 'it',
    company: {
      name: 'Metalúrgica Rosario S.R.L.',
      short_name: 'MetalRos',
      description: 'Fábrica de autopartes y piezas de precisión. 200 empleados. Clientes: terminales automotrices. Certificación IATF 16949.',
      industry: 'metalúrgica',
      city: 'Rosario',
      country: 'Argentina',
      website: 'https://metalros.com.ar',
      is_fictional: true,
      logo_url: '/logos/metalros.png',
    },
    config: {
      base_role: 'Sos Ricardo, el jefe de mantenimiento de Metalúrgica Rosario. Tenés 3 tornos CNC parados por fallas distintas y el plan de producción está comprometido. Necesitás que el pasante te ayude a priorizar las reparaciones y gestionar los repuestos.',
      course_context: 'El estudiante es un pasante de ingeniería en Metalúrgica Rosario S.R.L. La planta tiene 3 tornos CNC fuera de servicio por fallas simultáneas. Hay que decidir el orden de reparación según impacto en producción, disponibilidad de repuestos y tiempo estimado de reparación.',
      personality_traits: ['técnico', 'resolutivo', 'directo', 'metódico'],
      knowledge_base_prompt: 'Ayudá al pasante a analizar fallas de CNC (errores de servo, desgaste de husillo, falla de PLC). Explicá conceptos de OEE (Overall Equipment Effectiveness) y MTBF/MTTR. Guialo en la priorización de órdenes de trabajo según criticidad.',
    },
    scenario: {
      id: 'scenario-metal-001',
      title: 'Plan de Mantenimiento Preventivo',
      description: 'Tres tornos CNC fuera de servicio. Producción parada. Debés priorizar las reparaciones, gestionar los repuestos con proveedores y minimizar el tiempo de parada.',
      scenario_type: 'crisis_management',
      difficulty: 'hard',
      content: {
        context: 'Lunes 7:15 AM en Metalúrgica Rosario. El tablero de producción marca 3 máquinas en rojo. Ricardo te pasa el parte de novedades: CNC-01 perdió precisión en eje Z, CNC-02 tiene falla de servo drive, CNC-03 no enciende (falla de PLC). Hay una entrega de 2000 bielas para el jueves.',
        student_data: {
          nombre: 'Juan Pérez',
          rol: 'Pasante de Ingeniería de Mantenimiento',
          empresa: 'Metalúrgica Rosario S.R.L.',
        },
        emails: [
          {
            id: 1,
            from: 'Ricardo (Jefe de Mantenimiento)',
            subject: 'Parte de fallas — Lunes 7 AM',
            body: 'Juan, situación crítica: 3 CNC parados. CNC-01: desviación de 0.15 mm en eje Z (fuera de tolerancia). CNC-02: servo drive Yaskawa con error AL-04. CNC-03: PLC no arranca, posible falla de fuente. Necesito un plan de acción antes de las 10 AM.',
            date: new Date().toISOString(),
            read: false,
          },
          {
            id: 2,
            from: 'Proveedor — TecnoParts S.A.',
            subject: 'Cotización de repuestos urgentes',
            body: 'MetalRos, confirmamos stock: 1 servo drive Yaskawa SGDV (USD 4,200) entrega 48 hs. 1 husillo a bolas THK para CNC-01 (USD 8,500) entrega 5 días. PLC Siemens S7-1200 (USD 3,800) entrega 24 hs. Confirmar orden de compra.',
            date: new Date().toISOString(),
            read: false,
          },
          {
            id: 3,
            from: 'Cliente — AutoPartes S.A.',
            subject: 'URGENTE: Estado del pedido #4421',
            body: 'Necesitamos confirmación de las 2000 bielas para el jueves. Si no llegan, nuestra línea de montaje para 72 hs. Penalidad por incumplimiento: USD 15,000 por día. Favor responder con urgencia.',
            date: new Date().toISOString(),
            read: false,
            isUrgent: true,
          },
        ],
        spreadsheet: {
          name: 'Órdenes de Trabajo Pendientes — Mantenimiento',
          data: [
            { item: 'CNC-01 — Recalibrar eje Z', value: 4, currency: 'horas' },
            { item: 'CNC-01 — Cambiar husillo (si necesario)', value: 120, currency: 'horas' },
            { item: 'CNC-02 — Cambiar servo drive', value: 48, currency: 'horas' },
            { item: 'CNC-03 — Cambiar fuente PLC', value: 24, currency: 'horas' },
            { item: 'Costo diario de parada (3 CNC)', value: 45000, currency: 'USD' },
            { item: 'Pedido bielas pendiente', value: 2000, currency: 'unidades' },
            { item: 'Producción diaria (1 CNC operativo)', value: 350, currency: 'bielas/día' },
            { item: 'Producción diaria (3 CNC operativos)', value: 1050, currency: 'bielas/día' },
          ],
          formulas: {
            'Tiempo recuperación (mejor caso)': '= CNC-03 (24h) → CNC-01 recalibración (4h) → CNC-02 servo (48h)',
            'Producción acumulada en 4 días': '= Día1: 350 + Día2: 700 + Día3: 1050 + Día4: 1050 = 3150 bielas',
            'OEE objetivo': '= (Disponibilidad × Rendimiento × Calidad) > 85%',
          },
        },
      },
      expected_outcomes: {
        main_objective: 'Priorizar las reparaciones de los 3 CNC según impacto en producción, gestionar la compra de repuestos, y comunicar al cliente si se puede cumplir con la entrega del jueves.',
      },
    },
    documents: [
      {
        document_name: 'Manual de Mantenimiento — Torno CNC Haas ST-20',
        document_type: 'procedure',
        document_content: 'PLAN DE MANTENIMIENTO PREVENTIVO: Diario: verificar nivel de aceite, presión hidráulica, filtros. Semanal: calibrar eje Z (±0.01 mm), inspeccionar husillo. Mensual: cambio de filtros, verificación de servo drives. Anual: overhaul completo con cambio de rodamientos.',
      },
      {
        document_name: 'Contrato de Servicio — TecnoParts S.A.',
        document_type: 'contract',
        document_content: 'ACUERDO DE NIVEL DE SERVICIO: TecnoParts S.A. garantiza entrega de repuestos críticos en 24-120 hs según disponibilidad. Prioridad 1 (línea parada): respuesta en 4 hs. Cobertura: servo drives, PLC, husillos a bolas, fuentes de alimentación.',
      },
    ],
  },
];

async function main() {
  console.log('🏭 Iniciando seed de empresas y cursos...\n');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@simuverse.edu' } });
  if (!admin) throw new Error('Admin user not found. Run seed.ts first.');

  for (const def of companies) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🏢 Creando empresa: ${def.company.name}`);

    const company = await prisma.simulatedCompany.upsert({
      where: { name: def.company.name },
      update: {},
      create: {
        name: def.company.name,
        short_name: def.company.short_name,
        description: def.company.description,
        industry: def.company.industry,
        city: def.company.city,
        country: def.company.country,
        website: def.company.website,
        is_fictional: def.company.is_fictional,
        logo_url: def.company.logo_url,
      },
    });

    if (!company) {
      const all = await prisma.simulatedCompany.findMany({ orderBy: { id: 'desc' }, take: 1 });
      console.log(`   ⚠️  Empresa ya existía, usando ID ${all[0]?.id}`);
    } else {
      console.log(`   ✅ Creada con ID ${company.id}`);
    }

    const c = company || (await prisma.simulatedCompany.findFirst({ where: { name: def.company.name } }))!;

    console.log(`📚 Creando curso "${def.courseTitle}"...`);
    const course = await prisma.course.upsert({
      where: { course_id: def.course_id },
      update: {
        modules: ['chat_ia', 'email_simulado', 'documentos', 'hoja_calculo', 'crisis_engine'],
        simulated_company_id: c.id,
      },
      create: {
        id: def.courseId,
        course_id: def.course_id,
        title: def.courseTitle,
        description: def.courseDesc,
        category: def.category,
        modules: ['chat_ia', 'email_simulado', 'documentos', 'hoja_calculo', 'crisis_engine'],
        is_active: true,
        simulated_company_id: c.id,
      },
    });

    await prisma.courseConfig.upsert({
      where: { course_id: course.id },
      update: {},
      create: {
        course_id: course.id,
        config_data: {},
        base_role: def.config.base_role,
        course_context: def.config.course_context,
        personality_traits: def.config.personality_traits,
        knowledge_base_prompt: def.config.knowledge_base_prompt,
        active_modules: ['chat_ia', 'email_simulado', 'documentos', 'hoja_calculo', 'crisis_engine'],
        family_type: def.family_type,
      },
    });

    console.log(`🎬 Creando escenario "${def.scenario.title}"...`);
    await prisma.scenario.upsert({
      where: { id: def.scenario.id },
      update: {},
      create: {
        id: def.scenario.id,
        course_id: course.id,
        title: def.scenario.title,
        description: def.scenario.description,
        scenario_type: def.scenario.scenario_type,
        difficulty: def.scenario.difficulty,
        content: def.scenario.content,
        expected_outcomes: def.scenario.expected_outcomes,
      },
    });

    console.log(`📄 Subiendo ${def.documents.length} documentos...`);
    await prisma.courseDocument.deleteMany({ where: { course_id: course.id } });
    await prisma.courseDocument.createMany({
      data: def.documents.map(d => ({ course_id: course.id, ...d })),
    });

    console.log(`📝 Asignando simulación a Juan Pérez...`);
    const exists = await prisma.simulationAssignment.findFirst({
      where: { student_id: 'stud-001', course_id: course.id },
    });
    if (!exists) {
      await prisma.simulationAssignment.create({
        data: {
          simulation_id: `sim-stud-001-${def.course_id}`,
          student_id: 'stud-001',
          course_id: course.id,
          assigned_by: admin.id,
          status: 'in_progress',
        },
      });
    }

    const sim = await prisma.simulation.findFirst({
      where: { student_id: 'stud-001', course_id: course.id },
    });
    if (!sim) {
      await prisma.simulation.create({
        data: { student_id: 'stud-001', course_id: course.id, status: 'active' },
      });
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('\n🎉 Seed de empresas completado!');
  console.log('\n📋 Cursos creados:');
  for (const def of companies) {
    console.log(`   📘 ${def.courseTitle} (${def.course_id}) → ${def.company.name}`);
  }
  console.log('\n👤 Juan Pérez (stud-001) está asignado a los 3 cursos + Ofimática Básica.');
  console.log('   Login: juan.perez@student.edu / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed de empresas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

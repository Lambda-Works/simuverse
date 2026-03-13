import { AppDataSource } from '../database/connection';
import { User } from '../entities/User';
import { Course } from '../entities/Course';
import { Scenario } from '../entities/Scenario';
import { KPI } from '../entities/KPI';
import { Task } from '../entities/Task';
import { TechSheet } from '../entities/TechSheet';
import { Module } from '../entities/Module';
import { CourseModule } from '../entities/CourseModule';
import { SimulationInstance } from '../entities/SimulationInstance';

async function seed() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Iniciando seed de datos...');

    // =====================================================================
    // 1. CREAR USUARIOS
    // =====================================================================
    console.log('\n📝 Creando usuarios...');
    
    const users = [
      {
        id: 'admin-001',
        email: 'admin@simuverse.edu',
        password: 'hashed_password_admin',
        name: 'Administrador Sistema',
        role: 'admin' as const
      },
      {
        id: 'prof-001',
        email: 'garcia@simuverse.edu',
        password: 'hashed_password_prof',
        name: 'Prof. Juan García',
        role: 'teacher' as const
      },
      {
        id: 'prof-002',
        email: 'martinez@simuverse.edu',
        password: 'hashed_password_prof2',
        name: 'Prof. María Martínez',
        role: 'teacher' as const
      },
      {
        id: 'student-001',
        email: 'juan.perez@student.edu',
        password: 'hashed_password_student',
        name: 'Juan Pérez García',
        role: 'student' as const
      },
      {
        id: 'student-002',
        email: 'maria.lopez@student.edu',
        password: 'hashed_password_student2',
        name: 'María López Rodríguez',
        role: 'student' as const
      },
      {
        id: 'student-003',
        email: 'carlos.soto@student.edu',
        password: 'hashed_password_student3',
        name: 'Carlos Soto López',
        role: 'student' as const
      }
    ];

    const userRepo = AppDataSource.getRepository(User);
    for (const userData of users) {
      const user = userRepo.create(userData);
      await userRepo.save(user);
    }
    console.log(`✅ ${users.length} usuarios creados`);

    // =====================================================================
    // 2. CREAR CURSOS
    // =====================================================================
    console.log('\n📚 Creando cursos...');
    
    const courses = [
      {
        id: 'course-001',
        title: 'Especialista en Gestión de Negocios Online',
        description: 'Formación profesionalizante en gestión de tiendas e-commerce, marketing digital y atención al cliente en plataforma online',
        category: 'E-Commerce',
        instructor_id: 'prof-001',
        approved_by_ministry: true,
        ministry_code: 'ECOM-2024-001'
      },
      {
        id: 'course-002',
        title: 'Especialista en Automatización Industrial',
        description: 'Prácticas en automatización de procesos, robótica y sistemas de control industrial',
        category: 'Automatización',
        instructor_id: 'prof-002',
        approved_by_ministry: true,
        ministry_code: 'AUTO-2024-001'
      },
      {
        id: 'course-003',
        title: 'Especialista en Soporte Técnico TI',
        description: 'Prácticas en soporte técnico, resolución de problemas y atención al cliente',
        category: 'Tecnología',
        instructor_id: 'prof-001',
        approved_by_ministry: true,
        ministry_code: 'TECH-2024-001'
      }
    ];

    const courseRepo = AppDataSource.getRepository(Course);
    const savedCourses: any = {};
    for (const courseData of courses) {
      const course = courseRepo.create(courseData);
      const saved = await courseRepo.save(course);
      savedCourses[courseData.id] = saved;
    }
    console.log(`✅ ${courses.length} cursos creados`);

    // =====================================================================
    // 3. CREAR FICHAS TÉCNICAS (Tech Sheets)
    // =====================================================================
    console.log('\n📋 Creando fichas técnicas del ministerio...');
    
    const techSheets = [
      {
        name: 'Competencias E-Commerce 2024',
        course_id: 'course-001',
        ministry_code: 'ECOM-2024-001',
        description: 'Fichas técnicas con competencias certificadas para gestor de tienda online',
        competencies: [
          'Gestión de inventarios en plataforma e-commerce',
          'Atención a clientes mediante chat y email',
          'Procesamiento de órdenes y pagos',
          'Análisis de métricas de venta',
          'Resolución de conflictos de cliente'
        ],
        kpi_requirements: [
          'Tiempo promedio respuesta cliente: < 5 minutos',
          'Satisfacción cliente: > 85%',
          'Tasa de conversión: > 3%',
          'Tasa de retención: > 70%'
        ],
        processed: true
      },
      {
        name: 'Competencias Automatización 2024',
        course_id: 'course-002',
        ministry_code: 'AUTO-2024-001',
        description: 'Fichas técnicas con competencias certificadas para especialista en automatización',
        competencies: [
          'Programación de controladores lógicos programables (PLC)',
          'Configuración de sistemas de automatización',
          'Diagnóstico y resolución de fallas',
          'Optimización de procesos automatizados',
          'Seguridad industrial en sistemas automatizados'
        ],
        kpi_requirements: [
          'Eficiencia de línea: > 90%',
          'Tiempo de respuesta ante falla: < 15 minutos',
          'Disponibilidad del sistema: > 95%',
          'Precisión en tareas: > 99%'
        ],
        processed: true
      }
    ];

    const techSheetRepo = AppDataSource.getRepository(TechSheet);
    for (const sheetData of techSheets) {
      const sheet = techSheetRepo.create(sheetData);
      await techSheetRepo.save(sheet);
    }
    console.log(`✅ ${techSheets.length} fichas técnicas creadas`);

    // =====================================================================
    // 4. CREAR ESCENARIOS
    // =====================================================================
    console.log('\n🎭 Creando escenarios de simulación...');
    
    const scenarios = [
      {
        id: 'scen-001',
        course_id: 'course-001',
        title: 'Tienda Online en Crisis: Black Friday',
        description: 'Simulación de gestión de tienda durante peak de ventas con múltiples crisis',
        scenario_type: 'evaluation',
        difficulty: 'hard',
        categories: ['e-commerce', 'crisis_management', 'customer_service'],
        content: {
          context: 'Es viernes negro. Tu tienda online recibe 10x el tráfico normal. Sistema caído. Clientes enojados.',
          initial_state: {
            orders_pending: 250,
            system_status: 'down',
            support_tickets: 45,
            angry_customers: 8
          }
        },
        expected_outcomes: {
          goals: [
            'Restaurar sistema en menos de 30 minutos',
            'Mantener satisfacción cliente > 70%',
            'Procesar al menos 80% de órdenes pendientes'
          ]
        },
        is_active: true
      },
      {
        id: 'scen-002',
        course_id: 'course-001',
        title: 'Atención a Cliente Difícil',
        description: 'Simulación de atención a cliente muy enojado por producto defectuoso',
        scenario_type: 'practice',
        difficulty: 'medium',
        categories: ['customer_service', 'conflict_resolution'],
        content: {
          context: 'Cliente recibió producto dañado. Está muy enojado. Amenaza dejar reseña negativa.',
          customer_name: 'Roberto López',
          customer_mood: 'very_angry',
          product_value: 45000
        },
        expected_outcomes: {
          goals: [
            'Convertir cliente enojado en satisfecho',
            'Resolver sin perder la venta',
            'Obtener rating >= 4/5'
          ]
        },
        is_active: true
      },
      {
        id: 'scen-003',
        course_id: 'course-002',
        title: 'Línea de Producción Automatizada en Falla',
        description: 'Simulación de diagnóstico y reparación de línea de producción automatizada',
        scenario_type: 'evaluation',
        difficulty: 'hard',
        categories: ['plc', 'automation', 'troubleshooting'],
        content: {
          context: 'Línea de envasado paró inesperadamente. Producción perdiendo dinero cada minuto.',
          machine_logs: 'Error 0x47: Servo motor 3 no responde',
          time_pressure: 'Alta - se pierden $5000 por hora'
        },
        expected_outcomes: {
          goals: [
            'Identificar falla en menos de 10 minutos',
            'Reparar o derivar correctamente',
            'Restaurar producción',
            'Documentar incidente'
          ]
        },
        is_active: true
      }
    ];

    const scenarioRepo = AppDataSource.getRepository(Scenario);
    const savedScenarios: any = {};
    for (const scenData of scenarios) {
      const scenario = scenarioRepo.create(scenData);
      const saved = await scenarioRepo.save(scenario);
      savedScenarios[scenData.id] = saved;
    }
    console.log(`✅ ${scenarios.length} escenarios creados`);

    // =====================================================================
    // 5. CREAR KPIs
    // =====================================================================
    console.log('\n📊 Creando KPIs...');
    
    const kpis = [
      {
        id: 'kpi-001',
        course_id: 'course-001',
        scenario_id: 'scen-001',
        name: 'Tiempo de Respuesta',
        description: 'Tiempo desde que cliente contacta hasta que recibe respuesta',
        metric_type: 'time',
        target_value: 300,
        unit: 'segundos',
        weight: 25,
        evaluation_criteria: 'Menor es mejor. Máximo 5 minutos.'
      },
      {
        id: 'kpi-002',
        course_id: 'course-001',
        scenario_id: 'scen-001',
        name: 'Satisfacción del Cliente',
        description: 'Puntuación de satisfacción reportada por cliente (1-10)',
        metric_type: 'percentage',
        target_value: 85,
        unit: '%',
        weight: 30,
        evaluation_criteria: 'Mayor es mejor. Mínimo 70%.'
      },
      {
        id: 'kpi-003',
        course_id: 'course-001',
        scenario_id: 'scen-002',
        name: 'Resolución de Conflicto',
        description: 'Capacidad de convertir cliente negativo en positivo',
        metric_type: 'boolean',
        target_value: 1,
        unit: 'yes/no',
        weight: 40,
        evaluation_criteria: '1=Conflicto resuelto y cliente satisfecho, 0=No resuelto'
      },
      {
        id: 'kpi-004',
        course_id: 'course-002',
        scenario_id: 'scen-003',
        name: 'Tiempo de Diagnóstico',
        description: 'Tiempo en identificar la falla',
        metric_type: 'time',
        target_value: 600,
        unit: 'segundos',
        weight: 35,
        evaluation_criteria: 'Menor es mejor. Máximo 10 minutos.'
      },
      {
        id: 'kpi-005',
        course_id: 'course-002',
        scenario_id: 'scen-003',
        name: 'Precisión de Diagnóstico',
        description: 'Correctamente identificó la falla',
        metric_type: 'boolean',
        target_value: 1,
        unit: 'yes/no',
        weight: 50,
        evaluation_criteria: 'Debe identificar correctamente que es Servo Motor 3'
      }
    ];

    const kpiRepo = AppDataSource.getRepository(KPI);
    const savedKPIs: any = {};
    for (const kpiData of kpis) {
      const kpi = kpiRepo.create(kpiData);
      const saved = await kpiRepo.save(kpi);
      savedKPIs[kpiData.id] = saved;
    }
    console.log(`✅ ${kpis.length} KPIs creados`);

    // =====================================================================
    // 6. CREAR TAREAS
    // =====================================================================
    console.log('\n✅ Creando tareas...');
    
    const tasks = [
      {
        id: 'task-001',
        scenario_id: 'scen-001',
        course_id: 'course-001',
        title: 'Acceder al panel de administración',
        description: 'Entra al dashboard de administración para ver estado del sistema',
        sequence: 1,
        is_mandatory: true,
        estimated_time: 120,
        success_criteria: 'Dashboard debe mostrar estado "ONLINE" en menos de 2 minutos',
        status: 'pending'
      },
      {
        id: 'task-002',
        scenario_id: 'scen-001',
        course_id: 'course-001',
        title: 'Revisar órdenes pendientes',
        description: 'Accede a la lista de órdenes y prioriza las críticas',
        sequence: 2,
        is_mandatory: true,
        estimated_time: 180,
        success_criteria: 'Debe identificar las 5 órdenes de mayor valor',
        status: 'pending'
      },
      {
        id: 'task-003',
        scenario_id: 'scen-001',
        course_id: 'course-001',
        title: 'Responder mensajes de clientes',
        description: 'Envía respuestas personalizadas a clientes enojados',
        sequence: 3,
        is_mandatory: true,
        estimated_time: 300,
        success_criteria: 'Todas las respuestas deben incluir número de seguimiento y tiempo estimado',
        status: 'pending'
      },
      {
        id: 'task-004',
        scenario_id: 'scen-002',
        course_id: 'course-001',
        title: 'Escuchar al cliente',
        description: 'El cliente te explica el problema. Escucha sin interrumpir.',
        sequence: 1,
        is_mandatory: true,
        estimated_time: 180,
        success_criteria: 'Debes resumir correctamente el problema al cliente',
        status: 'pending'
      },
      {
        id: 'task-005',
        scenario_id: 'scen-002',
        course_id: 'course-001',
        title: 'Ofrecer solución',
        description: 'Presenta opciones de solución',
        sequence: 2,
        is_mandatory: true,
        estimated_time: 120,
        success_criteria: 'Mínimo 2 opciones, incluyendo reembolso/reemplazo',
        status: 'pending'
      },
      {
        id: 'task-006',
        scenario_id: 'scen-003',
        course_id: 'course-002',
        title: 'Revisar logs del sistema',
        description: 'Accede a los logs del PLC para ver qué pasó',
        sequence: 1,
        is_mandatory: true,
        estimated_time: 240,
        success_criteria: 'Debe encontrar el mensaje de error 0x47',
        status: 'pending'
      },
      {
        id: 'task-007',
        scenario_id: 'scen-003',
        course_id: 'course-002',
        title: 'Diagnosticar falla',
        description: 'Determina cuál es el componente defectuoso',
        sequence: 2,
        is_mandatory: true,
        estimated_time: 300,
        success_criteria: 'Debe concluir: Servo Motor 3 requiere reemplazo',
        status: 'pending'
      }
    ];

    const taskRepo = AppDataSource.getRepository(Task);
    for (const taskData of tasks) {
      const task = taskRepo.create(taskData);
      await taskRepo.save(task);
    }
    console.log(`✅ ${tasks.length} tareas creadas`);

    // =====================================================================
    // 7. CREAR MÓDULOS Y ASIGNACIONES
    // =====================================================================
    console.log('\n🔗 Creando módulos y asignaciones de curso...');
    
    const modules = [
      {
        id: 'mod-001',
        name: 'Fundamentos de E-Commerce',
        description: 'Conceptos básicos de tiendas online',
        order: 1
      },
      {
        id: 'mod-002',
        name: 'Atención al Cliente Online',
        description: 'Técnicas de comunicación con clientes remotos',
        order: 2
      },
      {
        id: 'mod-003',
        name: 'Fundamentos de Automatización',
        description: 'Conceptos de sistemas automatizados',
        order: 1
      }
    ];

    const moduleRepo = AppDataSource.getRepository(Module);
    const savedModules: any = {};
    for (const modData of modules) {
      const mod = moduleRepo.create(modData);
      const saved = await moduleRepo.save(mod);
      savedModules[modData.id] = saved;
    }

    const courseModules = [
      { course_id: 'course-001', module_id: 'mod-001', order: 1 },
      { course_id: 'course-001', module_id: 'mod-002', order: 2 },
      { course_id: 'course-002', module_id: 'mod-003', order: 1 }
    ];

    const courseModuleRepo = AppDataSource.getRepository(CourseModule);
    for (const cmData of courseModules) {
      const cm = courseModuleRepo.create(cmData);
      await courseModuleRepo.save(cm);
    }
    console.log(`✅ ${modules.length} módulos y ${courseModules.length} asignaciones creadas`);

    // =====================================================================
    // 8. CREAR INSTANCIAS DE SIMULACIÓN
    // =====================================================================
    console.log('\n▶️ Creando instancias de simulación (práctica alumno)...');
    
    const simInstances = [
      {
        id: 'siminstance-001',
        student_id: 'student-001',
        scenario_id: 'scen-001',
        course_id: 'course-001',
        status: 'in_progress',
        started_at: new Date(Date.now() - 15 * 60000), // Hace 15 minutos
        current_task_index: 1,
        score: 0,
        time_elapsed_seconds: 900
      },
      {
        id: 'siminstance-002',
        student_id: 'student-002',
        scenario_id: 'scen-002',
        course_id: 'course-001',
        status: 'completed',
        started_at: new Date(Date.now() - 2 * 60 * 60000), // Hace 2 horas
        completed_at: new Date(Date.now() - 60 * 60000), // Hace 1 hora
        current_task_index: 5,
        score: 85,
        time_elapsed_seconds: 3600
      },
      {
        id: 'siminstance-003',
        student_id: 'student-003',
        scenario_id: 'scen-003',
        course_id: 'course-002',
        status: 'in_progress',
        started_at: new Date(Date.now() - 30 * 60000), // Hace 30 minutos
        current_task_index: 2,
        score: 0,
        time_elapsed_seconds: 1800
      }
    ];

    const simInstanceRepo = AppDataSource.getRepository(SimulationInstance);
    for (const simData of simInstances) {
      const sim = simInstanceRepo.create(simData);
      await simInstanceRepo.save(sim);
    }
    console.log(`✅ ${simInstances.length} instancias de simulación creadas`);

    console.log('\n✅✅✅ SEED COMPLETADO EXITOSAMENTE ✅✅✅\n');
    console.log('Resumen:');
    console.log(`  - ${users.length} usuarios (admin, profesores, alumnos)`);
    console.log(`  - ${courses.length} cursos profesionalizantes`);
    console.log(`  - ${techSheets.length} fichas técnicas ministeriales`);
    console.log(`  - ${scenarios.length} escenarios de simulación`);
    console.log(`  - ${kpis.length} KPIs/métricas de evaluación`);
    console.log(`  - ${tasks.length} tareas dentro de escenarios`);
    console.log(`  - ${modules.length} módulos de estudio`);
    console.log(`  - ${simInstances.length} simulaciones en progreso`);
    console.log('\n🎓 Sistema listo para pruebas\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();

import 'reflect-metadata';
import { AppDataSource } from '../database/connection';
import { User, UserRole } from '../entities/User';
import { Course } from '../entities/Course';
import { Scenario } from '../entities/Scenario';
import { MinistryRequirement } from '../entities/MinistryRequirement';
import { KPI } from '../entities/KPI';
import { Task } from '../entities/Task';
import { SimulationInstance } from '../entities/SimulationInstance';
import { PracticeLogs } from '../entities/PracticeLogs';
import crypto from 'crypto';

async function seedExampleData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = AppDataSource.getRepository(User);
    const courseRepo = AppDataSource.getRepository(Course);
    const scenarioRepo = AppDataSource.getRepository(Scenario);
    const ministryReqRepo = AppDataSource.getRepository(MinistryRequirement);
    const kpiRepo = AppDataSource.getRepository(KPI);
    const taskRepo = AppDataSource.getRepository(Task);
    const simInstanceRepo = AppDataSource.getRepository(SimulationInstance);
    const practiceLogsRepo = AppDataSource.getRepository(PracticeLogs);

    // ============================================================
    // 1. CREAR USUARIOS
    // ============================================================
    console.log('\n📝 Creando usuarios...');

    // Superadmin
    const superAdmin = userRepo.create({
      email: 'admin@simuverse.edu',
      passwordHash: 'Admin123!',
      name: 'Admin Sistema',
      role: 'admin' as any,
      isActive: true,
      lastLogin: new Date(),
    } as any);
    await userRepo.save(superAdmin);
    console.log('  ✅ Superadmin: admin@simuverse.edu');

    // Profesor
    const teacher = userRepo.create({
      email: 'profesor@simuverse.edu',
      passwordHash: 'Prof123!',
      name: 'Dr. José García',
      role: 'teacher' as any,
      isActive: true,
      lastLogin: new Date(),
    } as any);
    await userRepo.save(teacher);
    console.log('  ✅ Profesor: profesor@simuverse.edu');

    // Ministerio
    const ministry = userRepo.create({
      email: 'ministerio@simuverse.edu',
      passwordHash: 'Min123!',
      name: 'Representante Ministerio',
      role: 'admin' as any, // Con permiso para cargar requisitos
      isActive: true,
      lastLogin: new Date(),
    } as any);
    await userRepo.save(ministry);
    console.log('  ✅ Ministerio: ministerio@simuverse.edu');

    // Alumno
    const student = userRepo.create({
      email: 'alumno@simuverse.edu',
      passwordHash: 'Est123!',
      name: 'Carlos Mendez',
      role: 'student' as any,
      isActive: true,
      lastLogin: new Date(),
    } as any);
    await userRepo.save(student);
    console.log('  ✅ Alumno: alumno@simuverse.edu');

    // ============================================================
    // 2. CREAR CURSO
    // ============================================================
    console.log('\n📚 Creando curso...');

    const course = courseRepo.create({
      course_id: 'SGCE-2026',
      title: 'Simulación de Gestión Empresarial',
      description: 'Curso de simulación empresarial para aprender toma de decisiones en contextos complejos',
      family: 'management',
      duration_minutes: 300,
      is_active: true,
    });
    await courseRepo.save(course);
    console.log('  ✅ Curso: Simulación de Gestión Empresarial');

    // ============================================================
    // 3. CREAR REQUISITOS MINISTERIALES CON KPIs
    // ============================================================
    console.log('\n📋 Creando requisitos ministeriales...');

    const ministryReq = ministryReqRepo.create({
      course_id: course.id,
      user_id: ministry.id,
      file_name: 'requisitos_2026.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 245000,
      file_path: '/uploads/requisitos_2026.pdf',
      raw_text: `
        REQUISITOS MINISTERIALES 2026
        Competencias requeridas:
        1. Análisis de datos financieros
        2. Toma de decisiones estratégicas
        3. Gestión de recursos humanos
        4. Comunicación empresarial
        5. Resolución de conflictos
      `,
      extracted_content: {
        competencies: [
          'Análisis de datos financieros',
          'Toma de decisiones estratégicas',
          'Gestión de recursos humanos',
          'Comunicación empresarial',
          'Resolución de conflictos',
        ],
        learning_outcomes: [
          'Interpretar estados financieros',
          'Tomar decisiones bajo incertidumbre',
          'Liderar equipos efectivamente',
        ],
      },
      status: 'active',
      kpis_generated: 5,
      tasks_generated: 15,
    });
    await ministryReqRepo.save(ministryReq);
    console.log('  ✅ Requisitos ministeriales cargados');

    // ============================================================
    // 4. CREAR KPIs
    // ============================================================
    console.log('\n🎯 Creando KPIs...');

    const kpis = [];

    // KPI 1: Análisis Financiero
    const kpi1 = kpiRepo.create({
      course_id: course.id,
      ministry_requirement_id: ministryReq.id,
      name: 'Análisis Financiero',
      description: 'Capacidad para interpretar y analizar estados financieros',
      category: 'analytical',
      weight: 25,
      target_value: 80,
      minimum_pass_value: 60,
      thresholds: {
        excellent: 90,
        good: 80,
        acceptable: 70,
        poor: 0,
      },
      trigger_event: 'simulation_completed',
      tasks_count: 3,
      students_achieved: 0,
      is_active: true,
    });
    await kpiRepo.save(kpi1);
    kpis.push(kpi1);
    console.log('  ✅ KPI 1: Análisis Financiero');

    // KPI 2: Toma de Decisiones
    const kpi2 = kpiRepo.create({
      course_id: course.id,
      ministry_requirement_id: ministryReq.id,
      name: 'Toma de Decisiones Estratégicas',
      description: 'Capacidad para tomar decisiones bajo presión y con información incompleta',
      category: 'strategic',
      weight: 30,
      target_value: 85,
      minimum_pass_value: 65,
      thresholds: {
        excellent: 90,
        good: 80,
        acceptable: 70,
        poor: 0,
      },
      trigger_event: 'simulation_completed',
      tasks_count: 3,
      students_achieved: 0,
      is_active: true,
    });
    await kpiRepo.save(kpi2);
    kpis.push(kpi2);
    console.log('  ✅ KPI 2: Toma de Decisiones');

    // KPI 3: Gestión de Recursos Humanos
    const kpi3 = kpiRepo.create({
      course_id: course.id,
      ministry_requirement_id: ministryReq.id,
      name: 'Gestión de Recursos Humanos',
      description: 'Habilidad para gestionar y motivar equipos de trabajo',
      category: 'management',
      weight: 20,
      target_value: 75,
      minimum_pass_value: 60,
      thresholds: {
        excellent: 85,
        good: 75,
        acceptable: 65,
        poor: 0,
      },
      trigger_event: 'simulation_completed',
      tasks_count: 3,
      students_achieved: 0,
      is_active: true,
    });
    await kpiRepo.save(kpi3);
    kpis.push(kpi3);
    console.log('  ✅ KPI 3: Gestión de RRHH');

    // KPI 4: Comunicación
    const kpi4 = kpiRepo.create({
      course_id: course.id,
      ministry_requirement_id: ministryReq.id,
      name: 'Comunicación Empresarial',
      description: 'Capacidad para comunicar estrategias y resultados de forma clara',
      category: 'communication',
      weight: 15,
      target_value: 80,
      minimum_pass_value: 60,
      thresholds: {
        excellent: 85,
        good: 75,
        acceptable: 65,
        poor: 0,
      },
      trigger_event: 'simulation_completed',
      tasks_count: 3,
      students_achieved: 0,
      is_active: true,
    });
    await kpiRepo.save(kpi4);
    kpis.push(kpi4);
    console.log('  ✅ KPI 4: Comunicación');

    // KPI 5: Resolución de Conflictos
    const kpi5 = kpiRepo.create({
      course_id: course.id,
      ministry_requirement_id: ministryReq.id,
      name: 'Resolución de Conflictos',
      description: 'Capacidad para identificar y resolver conflictos organizacionales',
      category: 'problem_solving',
      weight: 10,
      target_value: 75,
      minimum_pass_value: 60,
      thresholds: {
        excellent: 80,
        good: 70,
        acceptable: 60,
        poor: 0,
      },
      trigger_event: 'simulation_completed',
      tasks_count: 3,
      students_achieved: 0,
      is_active: true,
    });
    await kpiRepo.save(kpi5);
    kpis.push(kpi5);
    console.log('  ✅ KPI 5: Resolución de Conflictos');

    // ============================================================
    // 5. CREAR ESCENARIOS DE SIMULACIÓN
    // ============================================================
    console.log('\n🎬 Creando escenarios de simulación...');

    // Escenario 1: Crisis Financiera (PRÁCTICA)
    const scenario1 = scenarioRepo.create({
      course_id: course.id,
      name: 'Gestión de Crisis Financiera',
      description:
        'Tu empresa enfrenta una crisis financiera. Debes tomar decisiones rápidas para evitar la quiebra.',
      type: 'practice',
      difficulty: 'hard',
      estimated_time_minutes: 45,
      initial_state: {
        company_name: 'TechCorp Ltd',
        cash_balance: 250000,
        monthly_expenses: 180000,
        revenue: 150000,
        employees: 45,
        debt: 500000,
        market_share: 12.5,
      },
      success_criteria: {
        min_cash_balance: 100000,
        max_employees_lost: 10,
        debt_reduction_target: 100000,
      },
      ai_prompt: `
        ERES UN ASESOR EMPRESARIAL EXPERTO
        
        La empresa TechCorp enfrenta una crisis financiera:
        - Gastos mensuales: $180,000
        - Ingresos: $150,000
        - Efectivo disponible: $250,000
        - Deuda: $500,000
        - Empleados: 45
        
        El alumno debe tomar decisiones para:
        1. Reducir gastos sin perder competitividad
        2. Aumentar ingresos o encontrar nuevas fuentes de financiamiento
        3. Negociar con acreedores
        4. Decidir sobre ajustes de personal
        
        Para cada decisión que tome, debes:
        - Explicar las consecuencias financieras (números específicos)
        - Mostrar el impacto en empleados y moral
        - Presentar escenarios alternativos
        - Evaluar la decisión según criterios empresariales
        - Proporcionar retroalimentación constructiva
        - Sugerir mejores alternativas si la decisión no es óptima
        
        Mantén un tono profesional pero empático. El objetivo es aprender, no solo resolver.
      `,
    });
    await scenarioRepo.save(scenario1);
    console.log('  ✅ Escenario 1: Crisis Financiera (PRÁCTICA)');

    // Escenario 2: Expansión Internacional (PRÁCTICA)
    const scenario2 = scenarioRepo.create({
      course_id: course.id,
      name: 'Expansión Internacional',
      description:
        'Tienes la oportunidad de expandir tu empresa a nuevos mercados. ¿Cuál es tu estrategia?',
      type: 'practice',
      difficulty: 'medium',
      estimated_time_minutes: 50,
      initial_state: {
        company_name: 'Global Commerce Inc',
        current_markets: 3,
        annual_revenue: 5000000,
        expansion_budget: 800000,
        employees: 120,
        market_opportunities: [
          { country: 'Brasil', potential_revenue: 2000000, risk_level: 'medium', investment: 500000 },
          { country: 'India', potential_revenue: 3000000, risk_level: 'high', investment: 700000 },
          { country: 'México', potential_revenue: 1500000, risk_level: 'low', investment: 400000 },
        ],
      },
      success_criteria: {
        target_revenue_increase: 1500000,
        max_investment: 800000,
        acceptable_risk: 'medium',
      },
      ai_prompt: `
        ERES UN CONSULTOR ESTRATÉGICO INTERNACIONAL
        
        La empresa Global Commerce tiene oportunidad de expandirse a 3 mercados:
        - Brasil: $2M potencial, riesgo medio, inversión $500K
        - India: $3M potencial, riesgo alto, inversión $700K
        - México: $1.5M potencial, riesgo bajo, inversión $400K
        
        Budget disponible: $800,000
        
        El alumno debe:
        1. Seleccionar mercado(s)
        2. Justificar con análisis
        3. Definir estrategia de entrada
        4. Gestionar riesgos
        5. Planificar recursos humanos
        
        Para cada decisión:
        - Calcula proyecciones financieras realistas
        - Analiza riesgos geopolíticos y culturales
        - Evalúa la capacidad operativa
        - Proporciona métricas de éxito/fracaso
        - Retroalimenta sobre la estrategia global
        
        Desafía las suposiciones del alumno. Hazlo pensar críticamente.
      `,
    });
    await scenarioRepo.save(scenario2);
    console.log('  ✅ Escenario 2: Expansión Internacional (PRÁCTICA)');

    // Escenario 3: Examen Final de Gestión (EVALUACIÓN)
    const scenario3 = scenarioRepo.create({
      course_id: course.id,
      name: 'Examen Final: Gestión Integral',
      description:
        'Simulación final: Debes demostrar todas las competencias adquiridas en una situación compleja y multidimensional.',
      type: 'evaluation',
      difficulty: 'hard',
      estimated_time_minutes: 120,
      initial_state: {
        company_name: 'Industrial Solutions Corp',
        quarter: 'Q2-2026',
        cash_balance: 1200000,
        monthly_revenue: 450000,
        monthly_expenses: 380000,
        employees: 180,
        debt: 2000000,
        market_position: 25,
        challenges: [
          'Competencia agresiva de startup',
          'Baja moral de empleados',
          'Tecnología obsoleta',
          'Presión de deuda bancaria',
          'Cambios regulatorios',
        ],
      },
      success_criteria: {
        financial_health: 'positive_cash_flow',
        employee_retention: 'min_80_percent',
        market_share_growth: 'min_3_percent',
        debt_reduction: 'min_300000',
        strategic_initiatives: 'min_2_completed',
      },
      ai_prompt: `
        ERES UN EVALUADOR DE COMPETENCIAS EMPRESARIALES
        
        CONTEXTO CRÍTICO:
        Industrial Solutions Corp enfrenta múltiples desafíos simultáneamente.
        El alumno debe demostrar competencia integral en 5 áreas clave.
        
        ESTRUCTURA DE EVALUACIÓN:
        
        1. ANÁLISIS FINANCIERO (25%)
           - ¿Lee correctamente los números?
           - ¿Identifica problemas ocultos?
           - ¿Proyecta con realismo?
        
        2. DECISIONES ESTRATÉGICAS (30%)
           - ¿Las decisiones alinean con objetivos?
           - ¿Considera trade-offs y riesgos?
           - ¿Hay visión a largo plazo?
        
        3. GESTIÓN DE RECURSOS HUMANOS (20%)
           - ¿Cuida al personal?
           - ¿Comunica cambios efectivamente?
           - ¿Motiva en contexto de crisis?
        
        4. COMUNICACIÓN (15%)
           - ¿Justifica decisiones claramente?
           - ¿Presenta información de forma persuasiva?
           - ¿Demuestra pensamiento crítico?
        
        5. RESOLUCIÓN DE CONFLICTOS (10%)
           - ¿Identifica conflictos?
           - ¿Busca soluciones ganar-ganar?
           - ¿Gestiona stakeholders?
        
        EVALUACIÓN RIGUROSA:
        - Califica CADA decisión de forma objetiva
        - Proporciona puntuación 0-100 para cada área
        - Explica por qué merece esa calificación
        - Sugiere áreas de mejora
        - No seas permisivo: evalúa como examen final
        
        El alumno necesita >= 60 en cada área para aprobar.
        Nota final = promedio ponderado de 5 áreas.
      `,
    });
    await scenarioRepo.save(scenario3);
    console.log('  ✅ Escenario 3: Examen Final (EVALUACIÓN)');

    // ============================================================
    // 6. CREAR TAREAS
    // ============================================================
    console.log('\n📌 Creando tareas...');

    let taskCount = 0;

    for (const kpi of kpis) {
      // Tarea de práctica 1
      const practiceTask1 = taskRepo.create({
        course_id: course.id,
        kpi_id: kpi.id,
        scenario_id: scenario1.id,
        type: 'practice',
        sequence_order: 1,
        title: `Práctica 1: ${kpi.name} - Nivel Básico`,
        description: `Primera práctica sobre ${kpi.name}. Enfócate en los conceptos fundamentales.`,
        ai_prompt_config: {
          temperature: 0.7,
          max_tokens: 2000,
          hints_enabled: true,
          max_attempts: 5,
          focus_areas: [kpi.name],
        },
        evaluation_criteria: {
          accuracy_required: 50,
          time_limit_minutes: 30,
          partial_credit: true,
        },
        students_completed: 0,
        average_completion_rate: 0,
        is_active: true,
      });
      await taskRepo.save(practiceTask1);
      taskCount++;

      // Tarea de práctica 2
      const practiceTask2 = taskRepo.create({
        course_id: course.id,
        kpi_id: kpi.id,
        scenario_id: scenario2.id,
        type: 'practice',
        sequence_order: 2,
        title: `Práctica 2: ${kpi.name} - Nivel Intermedio`,
        description: `Segunda práctica. Casos más complejos que requieren análisis profundo.`,
        ai_prompt_config: {
          temperature: 0.6,
          max_tokens: 2500,
          hints_enabled: true,
          max_attempts: 3,
          focus_areas: [kpi.name],
        },
        evaluation_criteria: {
          accuracy_required: 70,
          time_limit_minutes: 45,
          partial_credit: true,
        },
        students_completed: 0,
        average_completion_rate: 0,
        is_active: true,
      });
      await taskRepo.save(practiceTask2);
      taskCount++;

      // Tarea de evaluación
      const evalTask = taskRepo.create({
        course_id: course.id,
        kpi_id: kpi.id,
        scenario_id: scenario3.id,
        type: 'evaluation',
        sequence_order: 3,
        title: `Evaluación: ${kpi.name}`,
        description: `EVALUACIÓN FINAL - Demuestra dominio de ${kpi.name}. Sin hints. Máximo 1 intento.`,
        ai_prompt_config: {
          temperature: 0.5,
          max_tokens: 3000,
          hints_enabled: false,
          max_attempts: 1,
          focus_areas: [kpi.name],
          evaluation_mode: 'strict',
        },
        evaluation_criteria: {
          accuracy_required: 75,
          time_limit_minutes: 60,
          partial_credit: false,
        },
        students_completed: 0,
        average_completion_rate: 0,
        is_active: true,
      });
      await taskRepo.save(evalTask);
      taskCount++;
    }

    console.log(`  ✅ Total tareas creadas: ${taskCount}`);

    // ============================================================
    // 7. CREAR SIMULACIONES DE EJEMPLO
    // ============================================================
    console.log('\n▶️ Creando simulaciones de ejemplo...');

    // Simulación completada (PRÁCTICA - Crisis Financiera)
    const simInstance1 = simInstanceRepo.create({
      student_id: student.id,
      course_id: course.id,
      scenario_id: scenario1.id,
      status: 'completed',
      current_state: {
        stage: 'completed',
        final_decisions: [
          'Reducción de gastos operativos en 15%',
          'Renegociación de deuda con acreedores',
          'Despido de 8 empleados (17%)',
          'Búsqueda de inversor externo',
        ],
        outcomes: {
          cash_balance_final: 420000,
          employees_remaining: 37,
          debt_reduction: 120000,
          operational_efficiency: 85,
        },
      },
      progress: 100,
      performance_metrics: {
        accuracy: 78,
        time_spent: 2100,
        tasks_completed: 3,
        tasks_total: 3,
        error_count: 2,
      },
      metadata: {
        ai_feedback: [
          'Buena reducción de gastos, pero podrías haber negociado mejor',
          'El despido fue necesario pero fue duro con el personal',
          'Excelente búsqueda de inversor: plan B efectivo',
        ],
        learning_points: [
          'Análisis financiero básico domina',
          'Necesita mejorar en negociación',
          'Pensamiento estratégico en desarrollo',
        ],
      },
      started_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    await simInstanceRepo.save(simInstance1);
    console.log('  ✅ Simulación 1: Crisis Financiera (COMPLETADA)');

    // Simulación completada (PRÁCTICA - Expansión)
    const simInstance2 = simInstanceRepo.create({
      student_id: student.id,
      course_id: course.id,
      scenario_id: scenario2.id,
      status: 'completed',
      current_state: {
        stage: 'completed',
        markets_selected: ['México', 'Brasil'],
        investment_total: 900000,
        strategy: 'phased_approach_low_risk_first',
      },
      progress: 100,
      performance_metrics: {
        accuracy: 82,
        time_spent: 2400,
        tasks_completed: 3,
        tasks_total: 3,
        error_count: 1,
      },
      metadata: {
        ai_feedback: [
          'Excelente selección de mercados balanceada',
          'Estrategia de entrada es sólida',
          'Sobrepasaste presupuesto por $100K, pero justificado',
        ],
        learning_points: [
          'Análisis de riesgo-retorno muy bien ejecutado',
          'Gestión de presupuesto casi perfecta',
          'Estrategia de entrada es profesional',
        ],
      },
      started_at: new Date(Date.now() - 72 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });
    await simInstanceRepo.save(simInstance2);
    console.log('  ✅ Simulación 2: Expansión Internacional (COMPLETADA)');

    // Simulación en progreso (EVALUACIÓN FINAL)
    const simInstance3 = simInstanceRepo.create({
      student_id: student.id,
      course_id: course.id,
      scenario_id: scenario3.id,
      status: 'in_progress',
      current_state: {
        stage: 'phase_2_of_3',
        current_challenge: 'Presión de deuda y baja moral',
        decisions_made: [
          'Revisión estratégica del portafolio de productos',
          'Inicio de programa de transformación digital',
          'Aumento de 5% a empleados clave',
        ],
        next_decisions: [
          'Plan de retención de talento',
          'Negociación con bancos para refinanciamiento',
          'Lanzamiento de nuevo producto',
        ],
      },
      progress: 65,
      performance_metrics: {
        accuracy: 80,
        time_spent: 3600,
        tasks_completed: 2,
        tasks_total: 3,
        error_count: 1,
      },
      metadata: {
        ai_feedback_in_progress: [
          '✅ Análisis inicial sólido',
          '⚠️  Necesitas ser más agresivo en decisiones',
          '✅ Comunicación de cambios es clara',
        ],
        current_grade: 75,
        estimated_final_grade: 78,
      },
      started_at: new Date(Date.now() - 96 * 60 * 60 * 1000),
      updated_at: new Date(),
    });
    await simInstanceRepo.save(simInstance3);
    console.log('  ✅ Simulación 3: Examen Final (EN PROGRESO - 65%)');

    // ============================================================
    // 8. CREAR LOGS DE PRÁCTICA
    // ============================================================
    console.log('\n📊 Creando logs de práctica...');

    const decisions = [
      {
        timestamp: Date.now() - 2000000,
        decision: 'Reducir gastos operativos en 15%',
        rationale: 'Necesario para mantener flujo de caja positivo',
        ai_evaluation: 'Buena decisión, pero podrías haber llegado al 20%',
        impact: { cash_savings: 27000, morale_impact: -5 },
      },
      {
        timestamp: Date.now() - 1800000,
        decision: 'Despedir 8 empleados (17%)',
        rationale: 'Reducción proporcional de costos de personal',
        ai_evaluation:
          'Necesario pero considera impacto emocional. ¿Ofreciste outplacement?',
        impact: { salary_savings: 96000, talent_loss: -8 },
      },
      {
        timestamp: Date.now() - 1600000,
        decision: 'Buscar inversor externo por $500K',
        rationale: 'Inyección de capital para recuperación',
        ai_evaluation: 'Excelente plan B. Esto demuestra pensamiento estratégico.',
        impact: { cash_injection: 500000, equity_dilution: -15 },
      },
    ];

    for (let i = 0; i < decisions.length; i++) {
      const log = practiceLogsRepo.create({
        simulation_instance_id: simInstance1.id,
        student_id: student.id,
        course_id: course.id,
        decision_number: i + 1,
        decision_text: decisions[i].decision,
        decision_rationale: decisions[i].rationale,
        ai_evaluation: decisions[i].ai_evaluation,
        performance_score: 70 + i * 5,
        feedback: `Retroalimentación constructiva sobre tu decisión ${i + 1}`,
        metadata: decisions[i].impact,
        integrity_hash: crypto
          .createHash('sha256')
          .update(JSON.stringify(decisions[i]))
          .digest('hex'),
        timestamp: new Date(decisions[i].timestamp),
      });
      await practiceLogsRepo.save(log);
    }

    console.log(`  ✅ Logs de práctica creados`);

    // ============================================================
    // RESUMEN
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATOS DE EJEMPLO CARGADOS EXITOSAMENTE');
    console.log('='.repeat(60));

    console.log('\n👥 USUARIOS CREADOS:');
    console.log('  Admin:     admin@simuverse.edu (password: Admin123!)');
    console.log('  Profesor:  profesor@simuverse.edu (password: Prof123!)');
    console.log('  Ministerio: ministerio@simuverse.edu (password: Min123!)');
    console.log('  Alumno:    alumno@simuverse.edu (password: Est123!)');

    console.log('\n📚 CURSO:');
    console.log('  Simulación de Gestión Empresarial');

    console.log('\n🎯 KPIs (5 competencias):');
    console.log('  1. Análisis Financiero (25%)');
    console.log('  2. Toma de Decisiones Estratégicas (30%)');
    console.log('  3. Gestión de RRHH (20%)');
    console.log('  4. Comunicación (15%)');
    console.log('  5. Resolución de Conflictos (10%)');

    console.log('\n🎬 ESCENARIOS:');
    console.log('  Práctica 1: Crisis Financiera');
    console.log('  Práctica 2: Expansión Internacional');
    console.log('  Evaluación: Examen Final Integral');

    console.log('\n📊 SIMULACIONES DE ESTUDIANTE:');
    console.log('  ✅ Crisis Financiera: COMPLETADA (78% promedio)');
    console.log('  ✅ Expansión Internacional: COMPLETADA (82% promedio)');
    console.log('  ▶️  Examen Final: EN PROGRESO (65% completado)');

    console.log('\n💡 CÓMO USAR EL SISTEMA:');
    console.log('  1. Inicia sesión como profesor (profesor@simuverse.edu)');
    console.log('  2. Ve al curso "Simulación de Gestión Empresarial"');
    console.log('  3. Verás 3 escenarios: 2 de PRÁCTICA, 1 de EVALUACIÓN');
    console.log('  4. Inicia sesión como alumno para ver simulaciones');
    console.log('  5. El historial muestra decisiones y feedback de IA');
    console.log('  6. La simulación final se evalúa con criterios rigurosos');

    console.log('\n' + '='.repeat(60));

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedExampleData();

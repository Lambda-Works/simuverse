-- ============================================================
-- SIMUVERSE: SEED DATA COMPLETO - ESCENARIOS Y SIMULACIONES
-- Database: simuverse
-- Schema Versión: ACTUAL (Corregida)
-- ============================================================

-- NOTA IMPORTANTE: Este script usa la estructura REAL de la BD:
-- - courses.category (NO family)
-- - scenarios.title (NO name)
-- - scenarios.content (NO case_data)
-- - scenarios.scenario_type (NO type)

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. TABLA: SCENARIOS (Escenarios base para todos los cursos)
-- ============================================================

-- RRHH Course Scenarios
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(), 
    (SELECT id FROM courses WHERE category = 'rrhh' AND title LIKE '%Recursos Humanos%' LIMIT 1),
    'Crisis: Despidos por Reestructuración',
    'Debes gestionar el proceso de despido de 30 empleados por reestructuración de la empresa. Incluye comunicación, documentación legal y gestión de emociones.',
    'practice',
    'medium',
    JSON_OBJECT(
        'main_topic', 'Gestión de despidos y reestructuración',
        'context', 'La empresa necesita reducir costos reduciendo el 30% de personal. Tu rol es como Manager de RH.',
        'case_background', 'Empresa tecnológica de 300 empleados, 10 años en operación, momento económico difícil.',
        'estimated_time_minutes', 25,
        'key_actors', JSON_ARRAY('CEO', 'CFO', 'Equipo de RH', 'Empleados afectados', 'Abogado laboral'),
        'decision_points', JSON_OBJECT(
            'communication', 'Cómo comunicarás los despidos?',
            'criteria', 'Por antigüedad, performance, o habilidades?',
            'support', 'Qué beneficios de desvinculación ofrecerás?',
            'timing', 'Todo de una vez o en fases?'
        ),
        'crisis_factors', JSON_ARRAY('Moral de equipo', 'Riesgo legal', 'Productividad', 'Reputación'),
        'learning_focus', 'Gestión integral de procesos RH complejos con sensibilidad humana'
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Procesos legales de desvinculación laboral',
        'applies_skills', 'Comunicación efectiva, empatía, gestión de crisis',
        'shows_understanding', 'Impacto humano y empresarial de decisiones RH',
        'competencies', JSON_ARRAY('Gestión de cambio', 'Comunicación', 'Conocimiento legal laboral')
    ),
    1,
    NOW(),
    NOW()
);

-- RRHH Evaluation Scenario
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'rrhh' AND title LIKE '%Recursos Humanos%' LIMIT 1),
    'Evaluación: Plan Integral de Gestión de Talento',
    'Debes diseñar un plan estratégico de gestión de talento para los próximos 3 años incluyendo atracción, retención y desarrollo.',
    'evaluation',
    'hard',
    JSON_OBJECT(
        'main_topic', 'Estrategia integral de gestión de talento',
        'context', 'Como CHRO debes presentar una estrategia completa al directorio.',
        'case_background', 'Empresa en crecimiento, 500 empleados, rotación del 25% anual, brecha de liderazgo.',
        'estimated_time_minutes', 35,
        'evaluation_criteria', JSON_OBJECT(
            'strategic_alignment', 'Alineación con objetivos empresariales',
            'feasibility', 'Viabilidad financiera y operacional',
            'innovation', 'Elementos innovadores y diferenciadores',
            'implementation', 'Claridad del plan de implementación'
        ),
        'success_metrics', JSON_ARRAY(
            'Rotación voluntaria < 15%',
            'Retención de líderes > 95%',
            'Engagement > 75%',
            'Time-to-fill < 30 días'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Estrategia empresarial y gestión de talento',
        'applies_skills', 'Pensamiento estratégico, análisis de datos, comunicación ejecutiva',
        'shows_understanding', 'Conexión entre RRHH y resultados empresariales',
        'evaluation_scoring', 'Completitud, viabilidad, alineación estratégica'
    ),
    1,
    NOW(),
    NOW()
);

-- VENTAS Course Scenarios
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'ventas' LIMIT 1),
    'Deal: Venta a Cliente Fortune 500',
    'Debes cerrar una venta de USD 2.5M a una empresa Fortune 500 con múltiples stakeholders y ciclo de venta complejo.',
    'practice',
    'hard',
    JSON_OBJECT(
        'main_topic', 'Ventas empresariales complejas (B2B)',
        'context', 'Eres Sales Manager con acceso a C-suite, 3 competidores activos en la misma oportunidad.',
        'opportunity_details', JSON_OBJECT(
            'prospect_name', 'InnovateTech Solutions',
            'contract_value', 2500000,
            'currency', 'USD',
            'contract_duration', '3 años',
            'vertical', 'Transformación Digital'
        ),
        'stakeholders', JSON_OBJECT(
            'champion', 'CTO - Tech visionary, presupuesto limitado',
            'economic_buyer', 'CFO - Enfocado en ROI y riesgo',
            'users', 'Gerentes de IT (5) - Preocupados por integración',
            'influencers', 'Directora de Operaciones - Requiere cambio de procesos'
        ),
        'estimated_time_minutes', 30,
        'competitive_situation', JSON_ARRAY(
            'Competidor A: Más barato 15%',
            'Competidor B: Mejor integración técnica',
            'Competidor C: Relationship existente'
        ),
        'decision_points', JSON_OBJECT(
            'value_prop', 'Cómo diferencias tu solución?',
            'pricing', 'Estructura de precios y descuentos?',
            'relationships', 'A quién desarrollas más?',
            'timeline', 'Cuándo presionas a cerrar?'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Ciclo de ventas complejas, B2B enterprise',
        'applies_skills', 'Negociación, análisis de stakeholders, cierre de deals',
        'shows_understanding', 'Múltiples agendas en compras empresariales',
        'metrics', JSON_ARRAY('Deal size', 'Margen', 'Duración ciclo', 'Tasa de cierre')
    ),
    1,
    NOW(),
    NOW()
);

-- VENTAS Evaluation Scenario
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'ventas' LIMIT 1),
    'Evaluación: Estrategia de Ventas 2025',
    'Debes diseñar la estrategia de ventas para el próximo año incluyendo targets, segmentación, pricing y gestión de ciclo.',
    'evaluation',
    'hard',
    JSON_OBJECT(
        'main_topic', 'Estrategia comercial anual',
        'context', 'Como Director de Ventas presenta estrategia al CEO y CFO',
        'case_background', 'Empresa SaaS, revenue actual USD 50M, target crecimiento 40% YoY',
        'estimated_time_minutes', 40,
        'strategic_elements', JSON_OBJECT(
            'market_analysis', 'Análisis de mercado y posicionamiento',
            'customer_segmentation', 'Definición de segmentos clave',
            'go_to_market', 'Estrategia de entrada a mercado',
            'sales_structure', 'Estructura de equipo de ventas',
            'compensation', 'Plan de compensación alineado',
            'tools_process', 'CRM, procesos, métricas'
        ),
        'success_factors', JSON_ARRAY(
            'Pipeline visibility',
            'Sales cycle optimization',
            'Win rate improvement',
            'Customer retention',
            'Team productivity'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Estrategia comercial, gestión de ventas',
        'applies_skills', 'Pensamiento estratégico, análisis de mercado, liderazgo',
        'shows_understanding', 'Conexión entre estrategia de ventas y resultados',
        'evaluation_criteria', 'Alcanzabilidad, claridad, alineación, innovación'
    ),
    1,
    NOW(),
    NOW()
);

-- CONTABILIDAD Course Scenarios
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'contable' LIMIT 1),
    'Práctica: Cierre de Ciclo Contable con Ajustes Complejos',
    'Debes completar el cierre mensual de una empresa con múltiples operaciones, depreciaciones, provisiones y ajustes por inflación.',
    'practice',
    'medium',
    JSON_OBJECT(
        'main_topic', 'Ciclo contable y ajustes de cierre',
        'context', 'Eres Contador Senior en empresa manufacturera con operaciones en 3 países',
        'company_profile', JSON_OBJECT(
            'type', 'Manufactura',
            'size', '300 empleados',
            'complexity', 'Alta - multimoneda, activos fijos, inventarios',
            'reporting', 'IFRS + GAAP local'
        ),
        'estimated_time_minutes', 40,
        'closing_items', JSON_OBJECT(
            'depreciation', 'Depreciación de activos fijos (plantas, maquinaria)',
            'provisions', 'Provisión por garantías y litigios',
            'inventory_adjustment', 'Ajuste de inventarios por obsolescencia',
            'fx_impact', 'Impacto de variación de tipo de cambio',
            'revenue_recognition', 'Reconocimiento de ingresos diferidos'
        ),
        'required_documents', JSON_ARRAY(
            'Hoja de trabajo ajustes',
            'Conciliaciones bancarias',
            'Análisis de cuentas por cobrar',
            'Estado de cambios en patrimonio'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Normas contables (IFRS), ciclo completo',
        'applies_skills', 'Análisis de cuentas, reconocimiento de elementos',
        'shows_understanding', 'Impacto de ajustes en estados financieros',
        'accuracy_level', 'Exactitud en cálculos y documentación'
    ),
    1,
    NOW(),
    NOW()
);

-- CONTABILIDAD Evaluation Scenario
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'contable' LIMIT 1),
    'Evaluación: Auditoría de Estados Financieros',
    'Debes dirigir una auditoría externa identificando riesgos, diseñando procedimientos y emitiendo opinión sobre la razonabilidad.',
    'evaluation',
    'hard',
    JSON_OBJECT(
        'main_topic', 'Auditoría financiera y control interno',
        'context', 'Como Partner de auditoría responsable de la opinión de auditoría',
        'entity_data', JSON_OBJECT(
            'industry', 'Retail',
            'revenue', 150000000,
            'locations', 45,
            'complexity', 'Alta - cadena internacional'
        ),
        'estimated_time_minutes', 45,
        'audit_areas', JSON_ARRAY(
            'Evaluación de riesgos de fraude',
            'Testing de ingresos y cuentas por cobrar',
            'Evaluación de provisiones y contingencias',
            'Revisión de eventos posteriores',
            'Evaluación de control interno'
        ),
        'critical_findings', JSON_OBJECT(
            'revenue_recognition_issue', 'Posible desajuste en timing de ventas',
            'inventory_variance', 'Diferencias significativas en inventarios',
            'related_party', 'Transacciones con partes relacionadas sin documentación'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Estándares de auditoría (ISA), control interno',
        'applies_skills', 'Juicio profesional, evaluación de riesgos, conclusiones',
        'shows_understanding', 'Responsabilidad del auditor, materialidad, opinión',
        'deliverable', 'Opinión de auditoría fundamentada y profesional'
    ),
    1,
    NOW(),
    NOW()
);

-- LEGAL Course Scenarios
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'legal' LIMIT 1),
    'Práctica: Incumplimiento de Contrato Comercial',
    'Un cliente importante incumple contrato de suministro. Debes evaluar opciones legales, negociar resolución y minimizar riesgos.',
    'practice',
    'medium',
    JSON_OBJECT(
        'main_topic', 'Derecho comercial, incumplimiento contractual',
        'context', 'Eres Abogado In-House de empresa de servicios B2B',
        'dispute_details', JSON_OBJECT(
            'contract_value', 500000,
            'contract_duration', '2 años',
            'breach_type', 'Incumplimiento de obligaciones de suministro',
            'impact', 'Pérdida de ingresos USD 50K mensual'
        ),
        'estimated_time_minutes', 30,
        'contractual_analysis', JSON_OBJECT(
            'breach_severity', 'Material vs no material',
            'cure_period', 'Existe período para subsanar?',
            'damages_calculation', 'Cómo calculas daños?',
            'termination_rights', 'Tienes derecho a terminar?'
        ),
        'resolution_options', JSON_ARRAY(
            'Demanda en tribunal',
            'Arbitraje (cláusula existe)',
            'Mediación',
            'Renegociación términos',
            'Extinción de relación'
        ),
        'legal_considerations', JSON_ARRAY(
            'Jurisdicción aplicable (contrato es internacional)',
            'Cláusulas especiales (fuerza mayor, etc)',
            'Costos legales vs daños recuperables',
            'Relación comercial a futuro'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Derecho comercial, contratos, resolución de disputas',
        'applies_skills', 'Análisis legal, negociación, gestión de riesgos',
        'shows_understanding', 'Balance entre recuperación y relación comercial',
        'recommended_action', 'Estrategia fundamentada legalmente'
    ),
    1,
    NOW(),
    NOW()
);

-- LEGAL Evaluation Scenario
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'legal' LIMIT 1),
    'Evaluación: Defensa Integral en Litigio Laboral',
    'Tu empresa es demandada por 8 empleados por discriminación. Debes organizar defensa, evaluar riesgos y presentar estrategia.',
    'evaluation',
    'hard',
    JSON_OBJECT(
        'main_topic', 'Derecho laboral, litigios, defensa corporativa',
        'context', 'Director Legal debe reportar al CEO con estrategia de mitigación',
        'lawsuit_details', JSON_OBJECT(
            'plaintiffs', 8,
            'claim_basis', 'Discriminación por género y edad',
            'claimed_damages', 850000,
            'jurisdiction', 'Juzgado Laboral',
            'court_location', 'Capital'
        ),
        'estimated_time_minutes', 45,
        'defense_elements', JSON_OBJECT(
            'factual_analysis', 'Análisis de hechos vs alegaciones',
            'legal_framework', 'Leyes laborales aplicables',
            'evidence_strategy', 'Qué evidencia presentar',
            'witness_preparation', 'Testigos clave de la empresa',
            'settlement_evaluation', 'Conveniencia de transacción'
        ),
        'risk_assessment', JSON_ARRAY(
            'Probabilidad de perder en litigio',
            'Daño reputacional potencial',
            'Costos de defensa estimados',
            'Seguros de responsabilidad disponibles'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Derecho laboral, litigación civil, gestión de riesgos legales',
        'applies_skills', 'Análisis legal profundo, estrategia de defensa, comunicación ejecutiva',
        'shows_understanding', 'Equilibrio entre defensa vigorosa y responsabilidad corporativa',
        'deliverable', 'Memorándum de defensa integrado y fundamentado'
    ),
    1,
    NOW(),
    NOW()
);

-- GENERAL Course Scenarios
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'general' LIMIT 1),
    'Práctica: Gestión de Crisis de Liderazgo',
    'Tu equipo pierde confianza por cambios estratégicos rápidos. Debes restaurar credibilidad y mantener enfoque en objetivos.',
    'practice',
    'medium',
    JSON_OBJECT(
        'main_topic', 'Liderazgo, gestión de cambio, comunicación',
        'context', 'Eres Manager de equipo de 15 personas enfrentando incertidumbre',
        'crisis_situation', JSON_OBJECT(
            'trigger', 'Cambio estratégico inesperado anunciado',
            'team_reaction', 'Desmoralización, 2 renuncias, productividad baja',
            'timeline', 'Crisis surgió hace 5 días',
            'team_sentiment', 'Desconfianza en liderazgo, miedo al futuro'
        ),
        'estimated_time_minutes', 25,
        'leadership_challenges', JSON_ARRAY(
            'Restaurar confianza',
            'Comunicar cambio de forma efectiva',
            'Mantener productividad',
            'Gestionar las renuncias',
            'Crear nuevo sentido de propósito'
        ),
        'stakeholders_concerns', JSON_OBJECT(
            'team_members', 'Estabilidad laboral, claridad de roles',
            'peers', 'Capacidad de liderar en incertidumbre',
            'boss', 'Que equipo se mantenga productivo'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Liderazgo situacional, comunicación de crisis',
        'applies_skills', 'Empatía, comunicación clara, construcción de confianza',
        'shows_understanding', 'Impacto del liderazgo en clima laboral',
        'approach', 'Plan de acción para restaurar confianza'
    ),
    1,
    NOW(),
    NOW()
);

-- GENERAL Evaluation Scenario
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'general' LIMIT 1),
    'Evaluación: Competencias de Liderazgo Integral',
    'Debes demostrar competencias clave como liderador: visión, gestión de equipos, toma de decisiones, integridad, comunicación.',
    'evaluation',
    'hard',
    JSON_OBJECT(
        'main_topic', 'Competencias ejecutivas clave',
        'context', 'Serás evaluado para promoción a Senior Management',
        'evaluation_context', JSON_OBJECT(
            'current_role', 'Manager',
            'target_role', 'Director/Gerente Senior',
            'time_in_role', '3 años',
            'performance_rating', 'Top 15%'
        ),
        'estimated_time_minutes', 50,
        'key_competencies', JSON_OBJECT(
            'strategic_vision', 'Capacidad de definir dirección clara',
            'people_leadership', 'Desarrollar y motivar equipos',
            'decision_making', 'Decisiones complejas bajo incertidumbre',
            'integrity', 'Actuación ética y coherente',
            'communication', 'Comunicación clara en todos los niveles',
            'execution', 'Lograr resultados consistentemente'
        ),
        'assessment_method', 'Integración de múltiples casos de negocio complejos'
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Teoría y práctica de liderazgo moderno',
        'applies_skills', 'Todas las competencias líderes',
        'shows_understanding', 'Liderazgo como responsabilidad integral',
        'career_impact', 'Evaluación determinante para promoción'
    ),
    1,
    NOW(),
    NOW()
);

-- ADMINISTRACIÓN Course Scenarios
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'administracion' LIMIT 1),
    'Práctica: Optimización de Procesos Administrativos',
    'Tu área tiene 40% más trabajo que hace 2 años pero mismo presupuesto. Debes rediseñar procesos para mejorar eficiencia 25%.',
    'practice',
    'medium',
    JSON_OBJECT(
        'main_topic', 'Gestión operacional, optimización de procesos',
        'context', 'Eres Gerente de Operaciones en departamento de 12 personas',
        'operational_context', JSON_OBJECT(
            'current_volume', '500 transacciones/mes',
            'target_volume', '700 transacciones/mes',
            'staff_size', 12,
            'budget_constraint', 'Sin presupuesto para nuevas contrataciones'
        ),
        'estimated_time_minutes', 35,
        'process_areas', JSON_ARRAY(
            'Recepción y clasificación de solicitudes',
            'Asignación de tareas',
            'Seguimiento y control',
            'Reportes y análisis',
            'Archivo y documentación'
        ),
        'improvement_levers', JSON_OBJECT(
            'automation', 'Qué procesos automatizar?',
            'workflow', 'Cómo rediseñar flujos?',
            'tools', 'Herramientas necesarias?',
            'training', 'Capacitación requerida?'
        ),
        'success_criteria', JSON_ARRAY(
            'Reducir tiempo ciclo 30%',
            'Errores menor a 2%',
            'Satisfacción del cliente > 90%',
            'Costo por transacción reducido'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Gestión de procesos, gestión operacional',
        'applies_skills', 'Análisis de procesos, pensamiento de mejora continua',
        'shows_understanding', 'Cómo alcanzar más con menos recursos',
        'deliverable', 'Plan de optimización con métricas de éxito'
    ),
    1,
    NOW(),
    NOW()
);

-- ADMINISTRACIÓN Evaluation Scenario
INSERT INTO scenarios (
    id, course_id, title, description, scenario_type, difficulty, 
    content, expected_outcomes, is_active, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'administracion' LIMIT 1),
    'Evaluación: Gestión Administrativa Estratégica',
    'Debes diseñar modelo operacional para nueva línea de negocios: estructura, procesos, herramientas y presupuesto.',
    'evaluation',
    'hard',
    JSON_OBJECT(
        'main_topic', 'Modelado operacional, gestión administrativa estratégica',
        'context', 'Director de Operaciones diseña operación greenfield',
        'new_business', JSON_OBJECT(
            'type', 'Línea de negocios digital',
            'startup_investment', 2500000,
            'projected_revenue_y1', 3000000,
            'geographic_scope', 'Latina (5 países)',
            'go_live_timeline', '6 meses'
        ),
        'estimated_time_minutes', 50,
        'model_design_elements', JSON_OBJECT(
            'organizational_structure', 'Estructura óptima por función',
            'staffing_plan', 'Cantidad y roles necesarios',
            'process_design', 'Procesos core de operación',
            'technology_stack', 'Herramientas y sistemas',
            'controls_governance', 'Controles internos y compliance'
        ),
        'constraints', JSON_ARRAY(
            'Presupuesto limitado para infraestructura',
            'Equipo distribuido geográficamente',
            'Regulaciones variables por país',
            'Necesidad de escalabilidad futura'
        )
    ),
    JSON_OBJECT(
        'demonstrates_knowledge', 'Modelado operacional, gestión estratégica',
        'applies_skills', 'Pensamiento sistémico, diseño organizacional, presupuestación',
        'shows_understanding', 'Operaciones como ventaja competitiva',
        'evaluation_criteria', 'Viabilidad, escalabilidad, eficiencia, compliance'
    ),
    1,
    NOW(),
    NOW()
);

-- ============================================================
-- 2. TABLA: SIMULATIONS (Simulaciones por curso para estudiantes)
-- ============================================================

-- Crear simulaciones de muestra para demostraciones
-- Get los IDs de usuarios estudiantes demo
SET @alumno_demo_id = (SELECT id FROM users WHERE email LIKE '%alumno-demo%' LIMIT 1);
SET @profesor_demo_id = (SELECT id FROM users WHERE email LIKE '%profesor-demo%' LIMIT 1);

-- Simulation 1: Alumno intenta RRHH
INSERT INTO simulations (
    id, course_id, student_id, status, started_at, completed_at, score, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'rrhh' LIMIT 1),
    @alumno_demo_id,
    'active',
    NOW(),
    NULL,
    NULL,
    NOW(),
    NOW()
);

-- Simulation 2: Alumno intenta Ventas
INSERT INTO simulations (
    id, course_id, student_id, status, started_at, completed_at, score, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'ventas' LIMIT 1),
    @alumno_demo_id,
    'active',
    NOW(),
    NULL,
    NULL,
    NOW(),
    NOW()
);

-- Simulation 3: Alumno completó Contabilidad
INSERT INTO simulations (
    id, course_id, student_id, status, started_at, completed_at, score, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'contable' LIMIT 1),
    @alumno_demo_id,
    'completed',
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    88.50,
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY)
);

-- Simulation 4: Alumno no ha iniciado Legal
INSERT INTO simulations (
    id, course_id, student_id, status, started_at, completed_at, score, created_at, updated_at
) VALUES (
    UUID(),
    (SELECT id FROM courses WHERE category = 'legal' LIMIT 1),
    @alumno_demo_id,
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- RESUMEN DE DATOS CARGADOS
-- ============================================================
-- Escenarios creados: 12 (2 por curso × 6 cursos)
-- Simulaciones de ejemplo: 4
-- 
-- Estados de Simulaciones:
-- - in_progress: 2 (RRHH, Ventas)
-- - completed: 1 (Contabilidad - 88 puntos)
-- - not_started: 1 (Evaluación RRHH)
-- ============================================================

-- Seed data for MSM Framework - Course Configurations
-- Run after creating course_config table

-- ADM5536 - Asistente Certificado en Liquidación de Sueldos
INSERT INTO course_config (courseId, activeModules, uiConfig, iaConfig, calculatorConfig, familyType, createdAt, updatedAt)
VALUES (
  'adm5536',
  '[
    {"moduleId": 1, "enabled": true, "config": {"type": "salary_calculator"}},
    {"moduleId": 2, "enabled": true, "config": {"type": "document", "categories": ["CCT", "Escalas_2026"]}},
    {"moduleId": 3, "enabled": true, "config": {"type": "inbox", "templates": ["liquidation_request"]}}
  ]',
  '{
    "layout": "office",
    "primaryColor": "#1a237e",
    "secondaryColor": "#003366",
    "theme": "light"
  }',
  '{
    "enabled": true,
    "provider": "gemini",
    "systemPrompt": "Actúa como un Auditor Técnico de la AFIP/ARCA. Tu objetivo es supervisar la carga de impuestos o sueldos del alumno. Sé riguroso y formal. Si el alumno comete un error en una alícuota o concepto no remunerativo, no des la respuesta; hazle una pregunta técnica que lo obligue a revisar la ley.",
    "model": "gemini-2.0-flash",
    "temperature": 0.3
  }',
  '{
    "formulas": {
      "sueldoBasico": "salario_convenio",
      "cargas_sociales": "sueldoBasico * 0.24",
      "impuesto_ganancias": "MAX(0, (sueldoBasico - 18000) * 0.06)",
      "neto": "sueldoBasico - cargas_sociales - impuesto_ganancias"
    },
    "variables": {
      "salario_minimo_2026": 304644,
      "minimo_no_imponible": 18000,
      "tasa_iva": 0.21
    }
  }',
  'administration',
  NOW(),
  NOW()
);

-- RH3657 - Facilitador Certificado en Oratoria y Storytelling
INSERT INTO course_config (courseId, activeModules, uiConfig, iaConfig, familyType, createdAt, updatedAt)
VALUES (
  'rh3657',
  '[
    {"moduleId": 2, "enabled": true, "config": {"type": "document", "categories": ["Guiones", "Referencias"]}},
    {"moduleId": 4, "enabled": true, "config": {"type": "chat", "mode": "audience_simulation"}}
  ]',
  '{
    "layout": "office",
    "primaryColor": "#1b5e20",
    "secondaryColor": "#2e7d32",
    "theme": "light"
  }',
  '{
    "enabled": true,
    "provider": "gemini",
    "systemPrompt": "Actúa como un empleado con 15 años de antigüedad en una empresa de Rosario que acaba de recibir una sanción injustificada. Tu tono es defensivo y emocional. El alumno (como RRHH) debe calmarte usando comunicación no violenta y storytelling.",
    "model": "gemini-2.0-flash",
    "temperature": 0.7
  }',
  'rrhh',
  NOW(),
  NOW()
);

-- INF28517B - Asistente en Automatización de Procesos Industriales con IA
INSERT INTO course_config (courseId, activeModules, uiConfig, iaConfig, familyType, createdAt, updatedAt)
VALUES (
  'inf28517b',
  '[
    {"moduleId": 2, "enabled": true, "config": {"type": "document", "categories": ["Documentacion_API", "Ejemplos_Scripts"]}},
    {"moduleId": 4, "enabled": true, "config": {"type": "terminal", "language": "python"}}
  ]',
  '{
    "layout": "terminal",
    "primaryColor": "#001f3f",
    "secondaryColor": "#0066cc",
    "theme": "dark"
  }',
  '{
    "enabled": true,
    "provider": "gemini",
    "systemPrompt": "Actúa como un Tech Lead que supervisa una automatización de procesos. Eres extremadamente eficiente y solo hablas con datos. Si el alumno te da un prompt vago, respóndele: ''Instrucción poco clara. El script fallará en producción. Define variables y parámetros de salida''.",
    "model": "gemini-2.0-flash",
    "temperature": 0.2
  }',
  'it',
  NOW(),
  NOW()
);

-- EMP54525 - Gestión de Tiendas Online para Emprendedores
INSERT INTO course_config (courseId, activeModules, uiConfig, iaConfig, familyType, createdAt, updatedAt)
VALUES (
  'emp54525',
  '[
    {"moduleId": 2, "enabled": true, "config": {"type": "document", "categories": ["Inventario", "Politicas_Pago"]}},
    {"moduleId": 3, "enabled": true, "config": {"type": "inbox", "templates": ["customer_complaint", "order_confirmation"]}},
    {"moduleId": 4, "enabled": true, "config": {"type": "chat", "mode": "customer_service"}}
  ]',
  '{
    "layout": "dashboard",
    "primaryColor": "#ff6f00",
    "secondaryColor": "#e65100",
    "theme": "light"
  }',
  '{
    "enabled": true,
    "provider": "gemini",
    "systemPrompt": "Actúa como un cliente indignado que compró un producto en una tienda online y le llegó roto o fuera de plazo. Estás escribiendo en el muro público de Instagram de la marca. Eres impaciente y amenazas con hacer una denuncia en Defensa al Consumidor. El alumno debe aplicar técnicas de Customer Experience (CX) para revertir tu opinión.",
    "model": "gemini-2.0-flash",
    "temperature": 0.6
  }',
  'entrepreneurship',
  NOW(),
  NOW()
);

-- Scenarios for ADM5536
INSERT INTO scenarios (courseId, name, description, caseData, isActive, sequence, createdAt, updatedAt)
VALUES (
  'adm5536',
  'Caso Juan Pérez - Chofer de Camión',
  'Liquidar el sueldo de Juan Pérez (Chofer de Camión) considerando el CCT del Transporte. Tiene 2 días de falta y 4 horas de trabajo extra.',
  '{
    "title": "Liquidación Mensual - Transporte",
    "description": "Procesar novedad de liquidación",
    "difficulty": "intermediate",
    "estimatedTime": 45,
    "employeeInfo": {
      "nombre": "Juan Pérez",
      "puesto": "Chofer de Camión",
      "cct": "Convenio de Transporte Automotor",
      "diasFalta": 2,
      "horasExtra": 4
    }
  }',
  true,
  1,
  NOW(),
  NOW()
);

INSERT INTO scenarios (courseId, name, description, caseData, isActive, sequence, createdAt, updatedAt)
VALUES (
  'adm5536',
  'Caso María González - Ejecutiva Comercial',
  'Liquidar a María González (Ejecutiva Comercial) con comisión por ventas y bono de desempeño.',
  '{
    "title": "Liquidación con Comisiones",
    "description": "Calcular comisión por ventas",
    "difficulty": "advanced",
    "estimatedTime": 60,
    "employeeInfo": {
      "nombre": "María González",
      "puesto": "Ejecutiva Comercial",
      "ventasMes": 450000,
      "tasaComision": 0.05,
      "bonoPorDesempeño": 15000
    }
  }',
  true,
  2,
  NOW(),
  NOW()
);

-- Scenarios for RH3657
INSERT INTO scenarios (courseId, name, description, caseData, isActive, sequence, createdAt, updatedAt)
VALUES (
  'rh3657',
  'Pitch ante el Directorio',
  'Presentar una propuesta de startup ante un directorio de inversores en 5 minutos.',
  '{
    "title": "Presentación de Startup",
    "description": "Convencer inversores",
    "difficulty": "advanced",
    "estimatedTime": 30,
    "scenario": "Tienes 5 minutos para convencer al directorio de invertir $100K en tu startup de tecnología educativa."
  }',
  true,
  1,
  NOW(),
  NOW()
);

-- Scenarios for INF28517B
INSERT INTO scenarios (courseId, name, description, caseData, isActive, sequence, createdAt, updatedAt)
VALUES (
  'inf28517b',
  'Crisis de Temperatura en Línea de Producción',
  'El sensor 4 indica sobrecalentamiento inminente. Diseña una automatización que desvíe el flujo y notifique al equipo.',
  '{
    "title": "Automatización de Alerta Crítica",
    "description": "Prevenir falla de equipamiento",
    "difficulty": "advanced",
    "estimatedTime": 45,
    "scenario": "El sistema de monitoreo indica que la temperatura está subiendo. Tienes 10 minutos para escribir un script Python que maneje la situación antes de que el indicador de daños llegue al 100%."
  }',
  true,
  1,
  NOW(),
  NOW()
);

-- Scenarios for EMP54525
INSERT INTO scenarios (courseId, name, description, caseData, isActive, sequence, createdAt, updatedAt)
VALUES (
  'emp54525',
  'Reclamo Público por Producto Fallado',
  'Gestionar un reclamo crítico en Instagram por un producto defectuoso. El cliente amenaza con denuncia de defensa al consumidor.',
  '{
    "title": "Crisis de Reputación Online",
    "description": "Resolver reclamo en redes sociales",
    "difficulty": "intermediate",
    "estimatedTime": 20,
    "scenario": "Un cliente acaba de postar en tu muro de Facebook: ''Compré en su tienda hace 3 días, me llegó roto el producto y nadie responde. Voy a denunciarlos en Defensa al Consumidor''. Tienes que responder y resolver en tiempo real."
  }',
  true,
  1,
  NOW(),
  NOW()
);

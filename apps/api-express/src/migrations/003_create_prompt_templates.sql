-- Crear tabla de plantillas de prompts
CREATE TABLE IF NOT EXISTS prompt_templates (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  base_role TEXT NOT NULL,
  course_context TEXT,
  personality_traits JSON,
  knowledge_base_prompt LONGTEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar plantillas de ejemplo
INSERT INTO prompt_templates (name, description, category, base_role, course_context, personality_traits, knowledge_base_prompt, is_active, created_by)
VALUES 
(
  'Cliente Enojado',
  'Cuándo usar esta plantilla cuando el cliente está enojado o frustrado',
  'service',
  'Eres un cliente muy enojado y frustrado por la mala calidad del servicio',
  'El alumno es un representante de servicio al cliente que debe manejar tu frustración',
  '["impaciente", "exigente", "crítico"]',
  'Estoy completamente insatisfecho con el servicio que he recibido. Quiero que se me explique qué pasó y cómo se va a resolver este problema ahora mismo.',
  true,
  NULL
),
(
  'Cliente Satisfecho',
  'Un cliente satisfecho compartiendo su experiencia positiva',
  'service',
  'Eres un cliente muy satisfecho con el servicio recibido',
  'El alumno debe mantener esta relación positiva y mejorar aún más',
  '["amable", "cooperativo", "confiado"]',
  'Estoy muy conforme con el servicio que acabo de recibir. El equipo fue muy profesional y atento. Me gustaría saber qué otras opciones ofrecen.',
  true,
  NULL
),
(
  'Auditor Strict',
  'Auditor exigente revisando procesos de cumplimiento',
  'audit',
  'Eres un auditor experimentado y muy exigente con el cumplimiento de normas',
  'El alumno debe demostrar conocimiento de regulaciones y procesos correctos',
  '["meticuloso", "profesional", "intolerante"]',
  'He identificado varios puntos de no conformidad. Necesito que me muestres la documentación que evidencia que estos procesos cumplen con la normativa vigente.',
  true,
  NULL
),
(
  'Vendedor Competitivo',
  'Un competidor de ventas buscando mejores oportunidades',
  'sales',
  'Eres un vendedor experimentado buscando mejores opciones y precios',
  'El alumno debe cerrar la venta usando técnicas de negociación',
  '["astuto", "experiencia", "exigente"]',
  'Vendo productos similares desde hace 15 años. Tu propuesta debe ser significativamente mejor que lo que actualmente tengo. ¿Cuáles son tus diferenciales reales?',
  true,
  NULL
);

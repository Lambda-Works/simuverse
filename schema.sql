-- SimuVerse Database Schema
-- MySQL 8.0

USE simuverse;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin', 'ministerio') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  modules JSON,
  ai_config JSON,
  eval_criteria JSON,
  crisis_events JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_course_id (course_id),
  INDEX idx_category (category),
  INDEX idx_active (is_active),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de módulos
CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación curso-módulo
CREATE TABLE IF NOT EXISTS course_modules (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  module_id VARCHAR(36) NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_course_module (course_id, module_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de simulaciones (instancias de simulación del alumno)
CREATE TABLE IF NOT EXISTS simulations (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  status ENUM('active', 'completed', 'paused', 'abandoned') DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  score DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_course_id (course_id),
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de logs de telemetría
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id VARCHAR(36) PRIMARY KEY,
  simulation_id VARCHAR(36) NOT NULL,
  action VARCHAR(100),
  details JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_simulation_id (simulation_id),
  INDEX idx_action (action),
  FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de evaluaciones
CREATE TABLE IF NOT EXISTS assessments (
  id VARCHAR(36) PRIMARY KEY,
  simulation_id VARCHAR(36) NOT NULL,
  evaluator_id VARCHAR(36),
  criteria_met JSON,
  comments TEXT,
  grade DECIMAL(5, 2),
  evaluated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_simulation_id (simulation_id),
  INDEX idx_evaluator_id (evaluator_id),
  FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración de cursos
CREATE TABLE IF NOT EXISTS course_config (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL UNIQUE,
  config_data JSON NOT NULL,
  base_role TEXT,
  course_context TEXT,
  personality_traits JSON,
  knowledge_base_prompt LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de escenarios de práctica
CREATE TABLE IF NOT EXISTS scenarios (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scenario_type VARCHAR(100),
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  content JSON,
  expected_outcomes JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_course_id (course_id),
  INDEX idx_type (scenario_type),
  INDEX idx_active (is_active),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de instancias de simulación (progreso del alumno)
CREATE TABLE IF NOT EXISTS simulation_instances (
  id VARCHAR(36) PRIMARY KEY,
  scenario_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  status ENUM('not_started', 'in_progress', 'paused', 'completed') DEFAULT 'not_started',
  progress_percentage INT DEFAULT 0,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  time_spent_seconds INT DEFAULT 0,
  score DECIMAL(5, 2),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scenario_id (scenario_id),
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de logs de práctica (auditoría para Ministerio)
CREATE TABLE IF NOT EXISTS practice_logs (
  id VARCHAR(36) PRIMARY KEY,
  simulation_instance_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_details JSON,
  evidence TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  integrity_hash VARCHAR(255),
  verified_at TIMESTAMP NULL,
  verified_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_simulation_instance_id (simulation_instance_id),
  INDEX idx_student_id (student_id),
  INDEX idx_action_type (action_type),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (simulation_instance_id) REFERENCES simulation_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de demostración
INSERT IGNORE INTO users (id, email, name, password, role) VALUES
('1', 'student@example.com', 'Juan Estudiante', 'TestPassword123!', 'student'),
('2', 'teacher@example.com', 'María Docente', 'TestPassword123!', 'teacher'),
('3', 'admin@example.com', 'Carlos Admin', 'TestPassword123!', 'admin'),
('4', 'ministerio@example.com', 'Inspector Ministerio', 'TestPassword123!', 'ministerio');

INSERT IGNORE INTO modules (id, name, description, type) VALUES
('mod-chat', 'Chat IA', 'Simulación conversacional con IA', 'chat_ia'),
('mod-email', 'Email Simulado', 'Sistema de correo electrónico simulado', 'email_simulado'),
('mod-docs', 'Carpeta de Documentos', 'Gestor de documentos', 'documentos'),
('mod-calc', 'Hoja de Cálculo', 'Herramienta de cálculos', 'hoja_calculo'),
('mod-crisis', 'Motor de Crisis', 'Generador de eventos de crisis', 'crisis_engine'),
('mod-eval', 'Evaluación Automática', 'Sistema de evaluación con IA', 'evaluacion_auto');

-- Indices adicionales para optimización
CREATE INDEX idx_simulations_course_student ON simulations(course_id, student_id);
CREATE INDEX idx_telemetry_created ON telemetry_logs(created_at);
CREATE INDEX idx_practice_logs_verified ON practice_logs(verified_at, verified_by);

CREATE DATABASE IF NOT EXISTS simuverse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE simuverse;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(100) PRIMARY KEY,
    course_id VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    modules JSON,
    ai_config JSON,
    eval_criteria JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS simulations (
    id VARCHAR(100) PRIMARY KEY,
    course_id VARCHAR(100) NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    simulation_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS course_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'other',
    document_content TEXT,
    file_url VARCHAR(500),
    uploaded_by INT
);

CREATE TABLE IF NOT EXISTS tech_sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ministry_code VARCHAR(100),
    description TEXT,
    file_url VARCHAR(500),
    uploaded_by INT,
    extracted_data JSON,
    competencies JSON,
    kpi_requirements JSON,
    processed TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    is_valid TINYINT(1) DEFAULT 1,
    title VARCHAR(255),
    course_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS simulation_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    simulation_id VARCHAR(100) NOT NULL,
    student_id INT NOT NULL,
    course_id VARCHAR(100) NOT NULL,
    assigned_by INT,
    start_date DATE,
    end_date DATE,
    max_attempts INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS simulation_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    simulation_id VARCHAR(100) NOT NULL,
    attempt_number INT DEFAULT 1,
    kpi_results JSON,
    overall_score DECIMAL(5,2),
    overall_feedback TEXT,
    completion_percentage INT DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    responses JSON
);

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    role_type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    UNIQUE KEY unique_user_role (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    is_active TINYINT(1) DEFAULT 1
);

INSERT INTO roles (role_name, role_type) VALUES 
    ('Administrator', 'admin'),
    ('Teacher', 'teacher'),
    ('Student', 'student'),
    ('Ministry', 'ministry');

INSERT INTO users (email, name, password, role) VALUES 
    ('admin@simuverse.com', 'Administrator', 'admin123', 'admin');

INSERT INTO categories (name, code, description) VALUES
    ('Gestion y Finanzas', 'FIN', 'Cursos de gestion empresarial y finanzas'),
    ('Tecnologia y Sistemas', 'TEC', 'Cursos de tecnologia e informatica'),
    ('Liderazgo y RRHH', 'LID', 'Cursos de liderazgo y recursos humanos'),
    ('Ventas y Marketing', 'VTA', 'Cursos de ventas y marketing'),
    ('Seguros', 'SEG', 'Cursos de seguros y analisis de riesgos');

INSERT INTO courses (id, course_id, title, description, category, is_active, created_by) VALUES
    ('course-001', 'seguros-001', 'Seguros - Analisis de Riesgos', 'Curso de seguros con simulacion de analisis de riesgos', 'Seguros', 1, '1'),
    ('course-002', 'sueldos-001', 'Liquidacion de Sueldos y Jornales', 'Curso de liquidacion de sueldos con simulacion practica', 'Gestion y Finanzas', 1, '1'),
    ('course-003', 'oratoria-001', 'Oratoria y Comunicacion Efectiva', 'Curso de oratoria con simulacion de presentaciones', 'Liderazgo y RRHH', 1, '1'),
    ('course-004', 'automatizacion-001', 'Automatizacion de Procesos Administrativos', 'Curso de automatizacion con IA', 'Tecnologia y Sistemas', 1, '1');

CREATE USER IF NOT EXISTS 'simuverse'@'localhost' IDENTIFIED BY 'CHANGE_ME_PASSWORD';
GRANT ALL PRIVILEGES ON simuverse.* TO 'simuverse'@'localhost';
FLUSH PRIVILEGES;

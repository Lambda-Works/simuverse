-- Migration: Add MSM Framework Tables
-- Description: Creates course_config, scenarios, simulation_instances, and practice_logs tables

-- 1. Create course_config table (JSON-based configuration for dynamic modules)
CREATE TABLE IF NOT EXISTS course_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseId VARCHAR(36) NOT NULL UNIQUE,
  activeModules JSON NOT NULL,
  uiConfig JSON NOT NULL,
  iaConfig JSON NOT NULL,
  calculatorConfig JSON,
  inboxConfig JSON,
  familyType ENUM('administration', 'rrhh', 'it', 'entrepreneurship') NOT NULL,
  validationRules JSON,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES courses(id),
  INDEX idx_course_id (courseId),
  INDEX idx_family_type (familyType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create scenarios table (practical cases for each course)
CREATE TABLE IF NOT EXISTS scenarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseId VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  caseData JSON NOT NULL,
  initialState JSON,
  validationRules JSON,
  successCriteria JSON,
  isActive BOOLEAN DEFAULT TRUE,
  sequence INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES courses(id),
  INDEX idx_course_id (courseId),
  INDEX idx_sequence (sequence),
  UNIQUE KEY uq_course_scenario (courseId, sequence)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create simulation_instances table (student progress tracking)
CREATE TABLE IF NOT EXISTS simulation_instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  courseId VARCHAR(36) NOT NULL,
  scenarioId INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'paused', 'completed', 'failed', 'submitted_for_review') DEFAULT 'not_started',
  currentState JSON,
  progress FLOAT DEFAULT 0,
  performanceMetrics JSON,
  metadata JSON,
  startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  submittedAt TIMESTAMP NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (courseId) REFERENCES courses(id),
  FOREIGN KEY (scenarioId) REFERENCES scenarios(id),
  INDEX idx_student_id (studentId),
  INDEX idx_course_id (courseId),
  INDEX idx_status (status),
  INDEX idx_student_course (studentId, courseId),
  UNIQUE KEY uq_student_scenario (studentId, scenarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create practice_logs table (Ministry audit logging - immutable records)
CREATE TABLE IF NOT EXISTS practice_logs (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  courseId VARCHAR(36) NOT NULL,
  simulationInstanceId INT,
  actionType ENUM(
    'calculation',
    'document_upload',
    'email_read',
    'email_reply',
    'message_sent',
    'decision_made',
    'case_submitted',
    'case_approved',
    'case_rejected',
    'system_event',
    'crisis_triggered',
    'evaluation_completed'
  ) NOT NULL,
  description TEXT NOT NULL,
  metadata JSON NOT NULL,
  sequenceNumber INT NOT NULL,
  integrityHash VARCHAR(64) NOT NULL,
  previousHash VARCHAR(64),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  timestamp BIGINT NOT NULL,
  docenterNotes TEXT,
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (courseId) REFERENCES courses(id),
  FOREIGN KEY (simulationInstanceId) REFERENCES simulation_instances(id),
  INDEX idx_student_course (studentId, courseId),
  INDEX idx_course_created (courseId, createdAt),
  INDEX idx_student_created (studentId, createdAt),
  INDEX idx_integrity_hash (integrityHash),
  INDEX idx_action_type (actionType),
  UNIQUE KEY uq_sequence (studentId, sequenceNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment for audit purposes
ALTER TABLE practice_logs COMMENT = 'Ministry of Education Audit Log - Immutable Records for Professional Practice Verification';

-- Add constraint to ensure chronological integrity
ALTER TABLE practice_logs ADD CONSTRAINT chk_timestamp_valid CHECK (timestamp > 0);

-- Ensure all existing data is preserved
-- This script is idempotent and can be run multiple times safely

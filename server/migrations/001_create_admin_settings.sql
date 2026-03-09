-- Migration: Create admin_settings table for role-based permissions
-- Date: 2026-03-09
-- Purpose: Store admin configuration for teacher permissions to view AI data

CREATE TABLE IF NOT EXISTS admin_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default teacher permissions configuration
INSERT INTO admin_settings (setting_key, setting_value, created_at, updated_at)
VALUES (
  'teacher_permissions',
  JSON_OBJECT(
    'can_see_ai_config', false,
    'can_see_system_prompt', false,
    'can_see_temperature', false,
    'can_see_score_calculation', false,
    'description', 'Controls which AI configuration data teachers can see'
  ),
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_at = NOW();

-- Add comment for documentation
ALTER TABLE admin_settings COMMENT = 'Stores administrative configuration settings including teacher permissions for viewing AI data';

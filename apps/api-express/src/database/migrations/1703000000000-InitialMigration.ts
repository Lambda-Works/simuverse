import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1703000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`email\` varchar(255) NOT NULL UNIQUE,
        \`password_hash\` varchar(255) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`role\` enum('student', 'teacher', 'admin') DEFAULT 'student',
        \`is_active\` boolean DEFAULT true,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`last_login\` timestamp NULL,
        INDEX \`idx_email\` (\`email\`),
        INDEX \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create courses table
    await queryRunner.query(`
      CREATE TABLE \`courses\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`course_id\` varchar(100) NOT NULL UNIQUE,
        \`title\` varchar(255) NOT NULL,
        \`description\` longtext,
        \`family\` varchar(100) NOT NULL,
        \`duration_minutes\` int NOT NULL,
        \`is_active\` boolean DEFAULT true,
        \`ai_config\` json,
        \`eval_criteria\` json,
        \`crisis_events\` json,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_course_id\` (\`course_id\`),
        INDEX \`idx_family\` (\`family\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create modules table
    await queryRunner.query(`
      CREATE TABLE \`modules\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`name\` varchar(255) NOT NULL,
        \`type\` enum('communication', 'tools', 'documentation', 'assessment') NOT NULL,
        \`config\` json,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_name\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create course_modules junction table
    await queryRunner.query(`
      CREATE TABLE \`course_modules\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`course_id\` varchar(36) NOT NULL,
        \`module_id\` varchar(36) NOT NULL,
        \`order\` int DEFAULT 0,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`module_id\`) REFERENCES \`modules\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_course_id\` (\`course_id\`),
        INDEX \`idx_module_id\` (\`module_id\`),
        UNIQUE \`uq_course_module\` (\`course_id\`, \`module_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create simulations table
    await queryRunner.query(`
      CREATE TABLE \`simulations\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`user_id\` varchar(36) NOT NULL,
        \`course_id\` varchar(36) NOT NULL,
        \`status\` enum('not_started', 'in_progress', 'paused', 'completed', 'abandoned') DEFAULT 'not_started',
        \`current_state\` json,
        \`progress_percentage\` int DEFAULT 0,
        \`started_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`paused_at\` timestamp NULL,
        \`completed_at\` timestamp NULL,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_user_id\` (\`user_id\`),
        INDEX \`idx_course_id\` (\`course_id\`),
        INDEX \`idx_status\` (\`status\`),
        INDEX \`idx_created_at\` (\`started_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create telemetry_logs table (append-only)
    await queryRunner.query(`
      CREATE TABLE \`telemetry_logs\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`simulation_id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`course_id\` varchar(36) NOT NULL,
        \`action\` varchar(255) NOT NULL,
        \`action_type\` enum('user_input', 'system_action', 'ai_response', 'decision', 'error', 'state_change') NOT NULL,
        \`created_at\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        \`response_time_ms\` int NOT NULL,
        \`metadata\` json,
        \`integrity_hash\` varchar(64) NOT NULL,
        FOREIGN KEY (\`simulation_id\`) REFERENCES \`simulations\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_simulation_id\` (\`simulation_id\`),
        INDEX \`idx_user_id\` (\`user_id\`),
        INDEX \`idx_course_id\` (\`course_id\`),
        INDEX \`idx_created_at\` (\`created_at\`),
        INDEX \`idx_action_type\` (\`action_type\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create assessments table
    await queryRunner.query(`
      CREATE TABLE \`assessments\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`simulation_id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`course_id\` varchar(36) NOT NULL,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`completed_at\` timestamp NULL,
        \`kpis\` json NOT NULL,
        \`ai_evaluation\` longtext,
        \`recommendation\` longtext,
        \`feedback\` json,
        \`digital_signature\` varchar(64),
        FOREIGN KEY (\`simulation_id\`) REFERENCES \`simulations\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_simulation_id\` (\`simulation_id\`),
        INDEX \`idx_user_id\` (\`user_id\`),
        INDEX \`idx_course_id\` (\`course_id\`),
        INDEX \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS \`assessments\`;');
    await queryRunner.query('DROP TABLE IF EXISTS \`telemetry_logs\`;');
    await queryRunner.query('DROP TABLE IF EXISTS \`simulations\`;');
    await queryRunner.query('DROP TABLE IF EXISTS \`course_modules\`;');
    await queryRunner.query('DROP TABLE IF EXISTS \`modules\`;');
    await queryRunner.query('DROP TABLE IF EXISTS \`courses\`;');
    await queryRunner.query('DROP TABLE IF EXISTS \`users\`;');
  }
}

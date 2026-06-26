import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourseConfigTable1704000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`course_config\` (
        \`id\` varchar(36) NOT NULL,
        \`course_id\` varchar(36) NOT NULL,
        \`config_data\` json NOT NULL,
        \`base_role\` text NULL,
        \`course_context\` text NULL,
        \`personality_traits\` json NULL,
        \`knowledge_base_prompt\` longtext NULL,
        \`active_modules\` json NULL,
        \`ui_config\` json NULL,
        \`ia_config\` json NULL,
        \`family_type\` varchar(50) NULL,
        \`calculator_config\` json NULL,
        \`inbox_config\` json NULL,
        \`validation_rules\` json NULL,
        \`metadata\` json NULL,
        \`tech_sheet_id\` int NULL,
        \`prompt_template_id\` int NULL,
        \`prompt_generation_mode\` enum('template','manual','guided') NOT NULL DEFAULT 'template',
        \`prompt_generated_by\` varchar(36) NULL,
        \`prompt_generated_at\` timestamp NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_course_id\` (\`course_id\`),
        CONSTRAINT \`fk_course_config_course\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS \`course_config\`;');
  }
}

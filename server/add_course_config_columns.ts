/**
 * Script para agregar columnas faltantes a course_config
 * Ejecutar con: node add_course_config_columns.js
 */

import 'reflect-metadata';
import { AppDataSource } from './dist/database/connection.js';

async function addColumns() {
  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();

    console.log('🔄 Iniciando adición de columnas a course_config...');

    const queries = [
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS active_modules JSON DEFAULT NULL COMMENT 'Módulos activos';`,
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS ui_config JSON DEFAULT NULL COMMENT 'Configuración UI';`,
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS ia_config JSON DEFAULT NULL COMMENT 'Configuración IA';`,
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS family_type VARCHAR(50) DEFAULT NULL COMMENT 'Tipo familia';`,
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS calculator_config JSON DEFAULT NULL COMMENT 'Config calculadora';`,
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS inbox_config JSON DEFAULT NULL COMMENT 'Config bandeja';`,
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS validation_rules JSON DEFAULT NULL COMMENT 'Reglas validación';`,
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS prompt_generated_by VARCHAR(36) DEFAULT NULL COMMENT 'Usuario prompt';`,
      `ALTER TABLE course_config ADD COLUMN IF NOT EXISTS prompt_generated_at TIMESTAMP DEFAULT NULL COMMENT 'Cuándo prompt';`,
    ];

    for (const query of queries) {
      try {
        console.log(`📝 Ejecutando: ${query.substring(0, 60)}...`);
        await queryRunner.query(query);
        console.log('✅ OK');
      } catch (err: any) {
        if (err.message.includes('Duplicate column name')) {
          console.log('⚠️  Columna ya existe, saltando...');
        } else {
          console.error('❌ Error:', err.message);
        }
      }
    }

    console.log('\n✅ Proceso completado');
    await AppDataSource.destroy();
  } catch (err: any) {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
  }
}

addColumns();

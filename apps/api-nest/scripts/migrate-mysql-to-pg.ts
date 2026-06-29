/**
 * MySQL → PostgreSQL Data Migration Script
 *
 * Reads ALL data from MySQL (Docker at localhost:3309),
 * transforms types, and inserts into PostgreSQL via Prisma.
 *
 * Usage:
 *   npx ts-node scripts/migrate-mysql-to-pg.ts migrate
 *   npx ts-node scripts/migrate-mysql-to-pg.ts verify
 *
 * Env vars (from .env or override):
 *   MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 *   DATABASE_URL (PostgreSQL via Prisma)
 */

import { PrismaClient } from '@prisma/client';
import * as mysql from 'mysql2/promise';

// ── Config ─────────────────────────────────────────────────────────
const BATCH_SIZE = 1000;

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3309', 10),
  user: process.env.MYSQL_USER || 'simuverse',
  password: process.env.MYSQL_PASSWORD || 'SimuVerse2024secret',
  database: process.env.MYSQL_DATABASE || 'simuverse',
  connectTimeout: 10000,
};

// Prisma insertion order (respects FK dependencies)
const TABLE_ORDER: string[] = [
  'users',
  'categories',
  'modules',
  'roles',
  'system_functionalities',
  'courses',
  'course_config',
  'course_modules',
  'course_documents',
  'tech_sheets',
  'prompt_templates',
  'flow_templates',
  'scenarios',
  'simulations',
  'simulation_instances',
  'assessments',
  'practice_logs',
  'telemetry_logs',
  'ministry_requirements',
  'kpis',
  'tasks',
  'notifications',
  'file_uploads',
  'simulation_assignments',
  'simulation_evaluations',
  'simulation_chat_logs',
  'role_permissions',
];

// Prisma model name → table name mapping
const MODEL_MAP: Record<string, string> = {
  users: 'User',
  categories: 'Category',
  modules: 'Module',
  roles: 'Role',
  system_functionalities: 'SystemFunctionality',
  courses: 'Course',
  course_config: 'CourseConfig',
  course_modules: 'CourseModule',
  course_documents: 'CourseDocument',
  tech_sheets: 'TechSheet',
  prompt_templates: 'PromptTemplate',
  flow_templates: 'FlowTemplate',
  scenarios: 'Scenario',
  simulations: 'Simulation',
  simulation_instances: 'SimulationInstance',
  assessments: 'Assessment',
  practice_logs: 'PracticeLogs',
  telemetry_logs: 'TelemetryLog',
  ministry_requirements: 'MinistryRequirement',
  kpis: 'KPI',
  tasks: 'Task',
  notifications: 'Notification',
  file_uploads: 'FileUpload',
  simulation_assignments: 'SimulationAssignment',
  simulation_evaluations: 'SimulationEvaluation',
  simulation_chat_logs: 'SimulationChatLog',
  role_permissions: 'RolePermission',
};

// Tables with JSON columns that need passthrough (MySQL JSON → PG jsonb)
const JSON_COLUMNS: Record<string, string[]> = {
  courses: [
    'categories', 'modules', 'ai_config', 'eval_criteria', 'crisis_events',
  ],
  scenarios: ['categories', 'content', 'expected_outcomes', 'config'],
  simulations: ['current_state'],
  assessments: ['kpis', 'feedback'],
  practice_logs: ['metadata'],
  telemetry_logs: ['metadata'],
  ministry_requirements: ['extracted_content'],
  kpis: ['thresholds'],
  tasks: ['ai_prompt_config', 'evaluation_criteria'],
  notifications: ['metadata'],
  course_config: [
    'config_data', 'personality_traits', 'active_modules',
    'ui_config', 'ia_config', 'calculator_config', 'inbox_config',
    'validation_rules', 'metadata',
  ],
  tech_sheets: ['competencies', 'kpi_requirements', 'extracted_data'],
  prompt_templates: ['personality_traits'],
  simulation_evaluations: ['kpi_results', 'responses'],
  simulation_chat_logs: ['metadata'],
  role_permissions: [],
};

// Tables with BigInt columns (MySQL bigint → PG bigint via Prisma BigInt)
const BIGINT_COLUMNS: Record<string, string[]> = {
  practice_logs: ['timestamp'],
  ministry_requirements: ['file_size_bytes'],
  file_uploads: ['file_size_bytes'],
};

// Boolean columns stored as tinyint(1) in MySQL
const BOOLEAN_TABLES: Record<string, string[]> = {
  users: ['is_active'],
  courses: ['is_active'],
  scenarios: ['is_active'],
  course_config: [],
  kpis: ['is_active'],
  tasks: ['is_active'],
  notifications: ['is_read', 'is_sent'],
  file_uploads: ['is_active'],
  tech_sheets: ['processed'],
  prompt_templates: ['is_active'],
  flow_templates: ['is_active'],
  roles: ['is_active'],
  system_functionalities: ['is_active'],
  simulation_assignments: [],
};

// ── Helpers ────────────────────────────────────────────────────────

function convertRow(
  row: Record<string, any>,
  table: string,
): Record<string, any> {
  const out: Record<string, any> = {};

  for (const [key, val] of Object.entries(row)) {
    if (val === null || val === undefined) {
      out[key] = null;
      continue;
    }

    // Boolean conversion (tinyint(1) → boolean)
    if (BOOLEAN_TABLES[table]?.includes(key)) {
      out[key] = val === 1 || val === true;
      continue;
    }

    // BigInt conversion (Buffer/number → number for Prisma BigInt)
    if (BIGINT_COLUMNS[table]?.includes(key)) {
      if (Buffer.isBuffer(val)) {
        out[key] = parseInt(val.toString('utf-8'), 10);
      } else {
        out[key] = Number(val);
      }
      continue;
    }

    // JSON columns — mysql2 returns parsed objects for JSON columns,
    // but if it comes as string, parse it
    if (JSON_COLUMNS[table]?.includes(key)) {
      if (typeof val === 'string') {
        try {
          out[key] = JSON.parse(val);
        } catch {
          out[key] = val;
        }
      } else {
        out[key] = val;
      }
      continue;
    }

    // Buffer → string (for binary data, though unlikely)
    if (Buffer.isBuffer(val)) {
      out[key] = val.toString('utf-8');
      continue;
    }

    out[key] = val;
  }

  return out;
}

async function insertBatch(
  prisma: PrismaClient,
  table: string,
  rows: Record<string, any>[],
  totalInserted: number,
): Promise<number> {
  if (rows.length === 0) return totalInserted;

  const model = MODEL_MAP[table];
  if (!model) {
    console.error(`  ⚠ Unknown model for table: ${table}`);
    return totalInserted;
  }

  try {
    const result = await (prisma as any)[model].createMany({
      data: rows,
      skipDuplicates: true,
    });
    return totalInserted + result.count;
  } catch (err: any) {
    console.error(`  ✗ Error inserting into ${table}: ${err.message}`);
    // Try one-by-one to find the problematic row
    let inserted = 0;
    for (const row of rows) {
      try {
        await (prisma as any)[model].create({ data: row });
        inserted++;
      } catch (rowErr: any) {
        console.error(`    ✗ Skipping row: ${rowErr.message?.slice(0, 120)}`);
      }
    }
    return totalInserted + inserted;
  }
}

// ── Commands ───────────────────────────────────────────────────────

async function migrate(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  MySQL → PostgreSQL Migration');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`  MySQL:   ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}/${MYSQL_CONFIG.database}`);
  console.log(`  PG:      ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || '(from env)'}`);
  console.log(`  Batch:   ${BATCH_SIZE} rows\n`);

  // Connect to MySQL
  let mysqlConn: mysql.Connection;
  try {
    mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
    console.log('  ✓ MySQL connected\n');
  } catch (err: any) {
    console.error(`  ✗ MySQL connection failed: ${err.message}`);
    console.error('    Make sure MySQL is running: docker compose up mysql');
    process.exit(1);
  }

  // Connect to PostgreSQL via Prisma
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('  ✓ PostgreSQL connected\n');
  } catch (err: any) {
    console.error(`  ✗ PostgreSQL connection failed: ${err.message}`);
    await mysqlConn.end();
    process.exit(1);
  }

  // Disable FK checks during migration
  await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

  const results: Record<string, { mysql: number; pg: number }> = {};

  for (const table of TABLE_ORDER) {
    process.stdout.write(`  Migrating ${table}...`);

    try {
      // Count MySQL rows
      const [countResult] = await mysqlConn.execute(
        `SELECT COUNT(*) as cnt FROM \`${table}\``,
      );
      const mysqlCount = (countResult as any[])[0].cnt;
      results[table] = { mysql: Number(mysqlCount), pg: 0 };

      if (Number(mysqlCount) === 0) {
        console.log(` ✓ (0 rows, empty)`);
        continue;
      }

      // Read all rows from MySQL
      let offset = 0;
      let totalInserted = 0;

      while (offset < Number(mysqlCount)) {
        const [rows] = await mysqlConn.execute(
          `SELECT * FROM \`${table}\` LIMIT ${BATCH_SIZE} OFFSET ${offset}`,
        );

        const converted = (rows as Record<string, any>[]).map((row) =>
          convertRow(row, table),
        );

        totalInserted = await insertBatch(prisma, table, converted, totalInserted);
        offset += BATCH_SIZE;
      }

      results[table].pg = totalInserted;
      console.log(` ✓ (${totalInserted} rows)`);
    } catch (err: any) {
      console.log(` ✗ ${err.message}`);
      results[table] = { mysql: -1, pg: -1 };
    }
  }

  // Re-enable FK checks
  await prisma.$executeRawUnsafe('SET session_replication_role = origin;');

  await prisma.$disconnect();
  await mysqlConn.end();

  // Summary
  console.log('\n───────────────────────────────────────────────────────');
  console.log('  Migration Summary');
  console.log('───────────────────────────────────────────────────────');
  let totalMysql = 0;
  let totalPg = 0;
  for (const [table, counts] of Object.entries(results)) {
    if (counts.mysql >= 0) {
      totalMysql += counts.mysql;
      totalPg += counts.pg;
    }
  }
  console.log(`  Tables: ${Object.keys(results).length}`);
  console.log(`  MySQL rows:  ${totalMysql}`);
  console.log(`  PG rows:     ${totalPg}`);
  console.log(`  Match: ${totalMysql === totalPg ? '✓ YES' : '✗ NO — run verify'}`);
  console.log('───────────────────────────────────────────────────────\n');
}

async function verify(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Row Count Verification: MySQL vs PostgreSQL');
  console.log('═══════════════════════════════════════════════════════\n');

  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
  const prisma = new PrismaClient();
  await prisma.$connect();

  let allMatch = true;
  const mismatches: string[] = [];

  for (const table of TABLE_ORDER) {
    const [mysqlResult] = await mysqlConn.execute(
      `SELECT COUNT(*) as cnt FROM \`${table}\``,
    );
    const mysqlCount = Number((mysqlResult as any[])[0].cnt);

    const model = MODEL_MAP[table];
    let pgCount = 0;
    try {
      pgCount = await (prisma as any)[model].count();
    } catch {
      pgCount = -1;
    }

    const match = mysqlCount === pgCount;
    const symbol = match ? '✓' : '✗';
    const pct = mysqlCount > 0
      ? `${((pgCount / mysqlCount) * 100).toFixed(1)}%`
      : '—';

    console.log(
      `  ${symbol} ${table.padEnd(30)} MySQL: ${String(mysqlCount).padStart(6)}  PG: ${String(pgCount).padStart(6)}  (${pct})`,
    );

    if (!match) {
      allMatch = false;
      mismatches.push(table);
    }
  }

  await prisma.$disconnect();
  await mysqlConn.end();

  console.log('\n───────────────────────────────────────────────────────');
  if (allMatch) {
    console.log('  ✓ ALL TABLES MATCH — migration verified');
  } else {
    console.log(`  ✗ MISMATCH in: ${mismatches.join(', ')}`);
  }
  console.log('───────────────────────────────────────────────────────\n');

  process.exit(allMatch ? 0 : 1);
}

// ── CLI ────────────────────────────────────────────────────────────

const command = process.argv[2] || 'migrate';

switch (command) {
  case 'migrate':
    migrate().catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
    break;
  case 'verify':
    verify();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Usage: ts-node migrate-mysql-to-pg.ts [migrate|verify]');
    process.exit(1);
}

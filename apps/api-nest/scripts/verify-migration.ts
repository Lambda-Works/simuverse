/**
 * Row-count verification: MySQL vs PostgreSQL
 *
 * Standalone script to verify all 27 tables have matching row counts.
 * Usage: npx ts-node scripts/verify-migration.ts
 */

import { PrismaClient } from '@prisma/client';
import * as mysql from 'mysql2/promise';

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3309', 10),
  user: process.env.MYSQL_USER || 'simuverse',
  password: process.env.MYSQL_PASSWORD || 'SimuVerse2024secret',
  database: process.env.MYSQL_DATABASE || 'simuverse',
  connectTimeout: 10000,
};

const TABLES: [string, string][] = [
  ['users', 'User'],
  ['categories', 'Category'],
  ['modules', 'Module'],
  ['roles', 'Role'],
  ['system_functionalities', 'SystemFunctionality'],
  ['courses', 'Course'],
  ['course_config', 'CourseConfig'],
  ['course_modules', 'CourseModule'],
  ['course_documents', 'CourseDocument'],
  ['tech_sheets', 'TechSheet'],
  ['prompt_templates', 'PromptTemplate'],
  ['flow_templates', 'FlowTemplate'],
  ['scenarios', 'Scenario'],
  ['simulations', 'Simulation'],
  ['simulation_instances', 'SimulationInstance'],
  ['assessments', 'Assessment'],
  ['practice_logs', 'PracticeLogs'],
  ['telemetry_logs', 'TelemetryLog'],
  ['ministry_requirements', 'MinistryRequirement'],
  ['kpis', 'KPI'],
  ['tasks', 'Task'],
  ['notifications', 'Notification'],
  ['file_uploads', 'FileUpload'],
  ['simulation_assignments', 'SimulationAssignment'],
  ['simulation_evaluations', 'SimulationEvaluation'],
  ['simulation_chat_logs', 'SimulationChatLog'],
  ['role_permissions', 'RolePermission'],
];

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Migration Verification — Row Counts');
  console.log('═══════════════════════════════════════════════════════\n');

  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
  const prisma = new PrismaClient();
  await prisma.$connect();

  let allMatch = true;
  const results: { table: string; mysql: number; pg: number; match: boolean }[] = [];

  for (const [tableName, modelName] of TABLES) {
    const [mysqlResult] = await mysqlConn.execute(
      `SELECT COUNT(*) as cnt FROM \`${tableName}\``,
    );
    const mysqlCount = Number((mysqlResult as any[])[0].cnt);

    let pgCount = 0;
    try {
      pgCount = await (prisma as any)[modelName].count();
    } catch {
      pgCount = -1;
    }

    const match = mysqlCount === pgCount;
    if (!match) allMatch = false;
    results.push({ table: tableName, mysql: mysqlCount, pg: pgCount, match });

    const symbol = match ? '✓' : '✗';
    const pct = mysqlCount > 0
      ? `${((pgCount / mysqlCount) * 100).toFixed(1)}%`
      : '—';
    console.log(
      `  ${symbol} ${tableName.padEnd(30)} MySQL: ${String(mysqlCount).padStart(6)}  PG: ${String(pgCount).padStart(6)}  (${pct})`,
    );
  }

  await prisma.$disconnect();
  await mysqlConn.end();

  const totalMysql = results.reduce((s, r) => s + r.mysql, 0);
  const totalPg = results.reduce((s, r) => s + r.pg, 0);
  const mismatches = results.filter((r) => !r.match);

  console.log('\n───────────────────────────────────────────────────────');
  console.log(`  Tables verified: ${results.length}`);
  console.log(`  MySQL total: ${totalMysql}`);
  console.log(`  PG total:    ${totalPg}`);
  console.log(`  Match: ${allMatch ? '✓ ALL MATCH' : '✗ MISMATCHES FOUND'}`);
  if (mismatches.length > 0) {
    console.log(`  Mismatches: ${mismatches.map((m) => m.table).join(', ')}`);
  }
  console.log('───────────────────────────────────────────────────────\n');

  process.exit(allMatch ? 0 : 1);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

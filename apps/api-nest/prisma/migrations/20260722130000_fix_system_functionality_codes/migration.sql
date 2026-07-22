-- Repairs 20260717120000_add_code_to_system_functionalities, which aborted on
-- production. That migration backfilled "code" from hardcoded ids (1..18), a
-- mapping that only matched a dev database: production runs both seed.ts and
-- seed-demo.ts, so ids go well past 18. Every extra row kept code NULL and
-- `ALTER COLUMN "code" SET NOT NULL` failed, leaving the migration in a failed
-- state (P3009) that blocked every later migration.
--
-- Here the backfill keys off "name" — the natural key both seed scripts use to
-- look rows up — and every step is idempotent, so this runs cleanly whether the
-- column already exists (fresh DB, where the original migration succeeded on an
-- empty table) or not (production, where it rolled back entirely).

ALTER TABLE "system_functionalities" ADD COLUMN IF NOT EXISTS "code" VARCHAR(50);

-- Canonical name -> code mapping, taken from the seed scripts that created these
-- rows: seed.ts (Spanish names) and seed-demo.ts (snake_case names).
UPDATE "system_functionalities" AS sf
SET "code" = m.code
FROM (VALUES
  -- seed.ts
  ('Gestión de Usuarios',        'users.manage'),
  ('Configuración de Roles',     'rbac.manage'),
  ('Gestión de Cursos',          'courses.manage'),
  ('Reportes',                   'reports.read'),
  ('Lectura de Usuarios',        'users.read'),
  ('Lectura de Cursos',          'courses.read'),
  ('Lectura de Escenarios',      'scenarios.read'),
  ('Gestión de Escenarios',      'scenarios.manage'),
  ('Lectura de Simulaciones',    'simulations.read'),
  ('Gestión de Catálogo',        'catalog.manage'),
  ('Lectura de Documentos',      'documents.read'),
  ('Gestión de Documentos',      'documents.manage'),
  ('Lectura de Asignaciones',    'assignments.read'),
  ('Gestión de Asignaciones',    'assignments.manage'),
  ('Lectura de Plantillas',      'templates.read'),
  ('Gestión de Plantillas',      'templates.manage'),
  ('Gestión de Empresas',        'companies.manage'),
  ('Lectura del Ministerio',     'ministry.read'),
  ('Gestión del Ministerio',     'ministry.manage'),
  ('Gestión de Notificaciones',  'notifications.manage'),
  ('Lectura de Archivos',        'files.read'),
  ('Subida de Archivos',         'files.upload'),
  ('Gestión de Archivos',        'files.manage'),
  ('Lectura de Evaluaciones',    'assessments.read'),
  ('Creación de Evaluaciones',   'assessments.create'),
  -- seed-demo.ts
  ('manage_courses',             'courses.manage'),
  ('manage_users',               'users.manage'),
  ('view_evaluations',           'assessments.read'),
  ('view_legajos',               'legajos.read'),
  ('manage_roles',               'rbac.manage_extra'),
  ('manage_scenarios',           'scenarios.manage'),
  ('manage_assignments',         'assignments.manage'),
  ('manage_companies',           'companies.manage'),
  ('view_stats',                 'reports.read_stats'),
  ('manage_foundation',          'foundation.manage'),
  ('manage_endorsers',           'endorsers.manage'),
  ('manage_templates',           'templates.manage'),
  ('manage_prompts',             'templates.prompts'),
  ('manage_techsheets',          'techsheets.manage'),
  ('manage_categories',          'categories.manage'),
  ('manage_documents',           'documents.manage'),
  ('manage_groups',              'teacher_groups.manage'),
  ('manage_sessions',            'sessions.manage'),
  ('hard_delete_users',          'users.hard-delete'),
  ('manage_sponsors',            'sponsors.manage')
) AS m(name, code)
WHERE sf."name" = m.name AND sf."code" IS NULL;

-- Rows created by hand or by an older seed fall back to a slug of their name, so
-- SET NOT NULL below can never abort the way the original migration did.
UPDATE "system_functionalities"
SET "code" = left(regexp_replace(lower("name"), '[^a-z0-9]+', '.', 'g'), 40)
WHERE "code" IS NULL;

-- seed.ts and seed-demo.ts each created their own row for eight of the same
-- concepts (e.g. 'Gestión de Cursos' and 'manage_courses' both map to
-- courses.manage). Keep the canonical code on the oldest row — the one seed.ts
-- upserts against — and suffix the rest, rather than deleting rows that
-- role_permissions still references.
UPDATE "system_functionalities" AS sf
SET "code" = left(sf."code", 40) || '.' || sf."id"
FROM (
  SELECT "id", row_number() OVER (PARTITION BY "code" ORDER BY "id") AS rn
  FROM "system_functionalities"
) AS dup
WHERE sf."id" = dup."id" AND dup.rn > 1;

ALTER TABLE "system_functionalities" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "system_functionalities_code_key" ON "system_functionalities"("code");

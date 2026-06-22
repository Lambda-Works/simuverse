-- Migration: Corregir relación TechSheet ↔ Course y mejorar integridad referencial
-- Fecha: 11 de Marzo 2026
-- Razón: 
--  1. tech_sheets.course_id debería ser NOT NULL (siempre tiene curso)
--  2. courses.tech_sheet_id está roto (referencia incorrecta, nunca se usa)
--  3. Simplificar schema a relación N:1 correcta

USE simuverse;

-- PASO 1: Limpiar datos huérfanos (si los hay)
DELETE FROM tech_sheets WHERE course_id IS NULL OR course_id = '';

-- PASO 2: Alterar course_id para que sea NOT NULL
ALTER TABLE tech_sheets 
MODIFY COLUMN course_id VARCHAR(36) NOT NULL;

-- PASO 3: Remover columna courses.tech_sheet_id (opción A: simplificar schema)
-- Justificación: La relación correcta es TechSheet.course_id -> Course.id (N:1)
-- No tiene sentido Course.tech_sheet_id (1:1 invertida)
ALTER TABLE courses DROP COLUMN tech_sheet_id;

-- PASO 4: Agregar índices faltantes para mejorar performance (si no existen)
-- (MariaDB maneja CREATE INDEX IF NOT EXISTS)

-- PASO 5: Verificar estado final
SELECT 
  COUNT(*) as tech_sheets_total,
  COUNT(CASE WHEN course_id IS NULL THEN 1 END) as tech_sheets_sin_curso,
  COUNT(CASE WHEN course_id IS NOT NULL THEN 1 END) as tech_sheets_con_curso
FROM tech_sheets;

SELECT COUNT(*) as courses_total FROM courses;

-- PASO 6: Confirmación
SELECT '✅ Migration 002 completed successfully' as status;

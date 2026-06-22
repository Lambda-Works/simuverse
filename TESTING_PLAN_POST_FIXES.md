# 🧪 GUÍA DE TESTING POST-FIXES
## Validación de Cambios Implementados

---

## PREREQUISITOS

**BD Viva:** simuverse (MariaDB)  
**Backend:** Ejecutándose en puerto 5000  
**Frontend:** Ejecutándose en puerto 5173

### Verificar Conexión:
```bash
# Terminal 1: Backend
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server
npm run dev

# Terminal 2: Frontend  
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine
npm run dev

# Terminal 3: Verificar BD
mysql -h localhost -u simuverse -p"CHANGE_ME_PASSWORD" simuverse
```

---

## TEST 1: Validar Cambios BD ✅

```bash
mysql -h localhost -u simuverse -p"CHANGE_ME_PASSWORD" simuverse << 'EOF'

-- 1. Verificar tech_sheets.course_id es NOT NULL
DESCRIBE tech_sheets;
-- Esperado: course_id varchar(36) NO

-- 2. Verificar courses.tech_sheet_id eliminado
DESCRIBE courses;
-- Esperado: NO debe haber columna tech_sheet_id

-- 3. Verificar datos limpios
SELECT id, course_id, title FROM courses ORDER BY id;
-- Esperado:
-- 05df8823... | TIENDAS-ONLINE-2026-01 | Simulador para Tiendas...
-- dc3257e7... | GENERAL-2026-01        | Curso General...

-- 4. Verificar todas las fichas tienen course_id
SELECT COUNT(*) as total FROM tech_sheets;
SELECT COUNT(*) as con_curso FROM tech_sheets WHERE course_id IS NOT NULL;
-- Esperado: total = con_curso (2 = 2)

EOF
```

---

## TEST 2: Crear Nueva Tech-Sheet (API) ✅

```bash
curl -X POST http://localhost:5000/api/tech-sheets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Ficha 2026-03-11",
    "course_id": "dc3257e7-253f-4b0c-8087-9c930baa25c0",
    "ministry_code": "TEST-2026",
    "description": "Test ficha con criterios de evaluación y objetivos"
  }'

# Respuesta esperada:
# {
#   "id": [nuevo ID],
#   "name": "Test Ficha...",
#   "course_id": "dc3257e7...",  ← Debe estar presente (NOT NULL)
#   "created_at": "2026-03-11T..."
# }
```

---

## TEST 3: CRÍTICO - Analizar Tech-Sheet (Verificar KPIs se crean)

Este es el TEST MÁS IMPORTANTE para validar FIX 1.5

### 3.1: Obtener ID de una Tech-Sheet existente

```bash
curl http://localhost:5000/api/tech-sheets

# Respuesta: Array con fichas
# [{
#   "id": 32,
#   "name": "...",
#   "processed": 1,
#   "description": "...",
#   ...
# }]

# Guardar el id (ej: 32)
TECH_SHEET_ID=32
```

### 3.2: Verificar BD ANTES (deben estar vacías)

```bash
mysql -h localhost -u simuverse -p"CHANGE_ME_PASSWORD" simuverse << 'EOF'
SELECT COUNT(*) as kpis_antes FROM kpis;
SELECT COUNT(*) as tasks_antes FROM tasks;
-- Esperado: 0, 0
EOF
```

### 3.3: Enviar POST /analyze

```bash
COURSE_ID="dc3257e7-253f-4b0c-8087-9c930baa25c0"

curl -X POST "http://localhost:5000/api/tech-sheets/$TECH_SHEET_ID/analyze" \
  -H "Content-Type: application/json" \
  -d '{}'

# Respuesta esperada:
# {
#   "message": "Ficha técnica analizada con éxito",
#   "sheet": {...},
#   "config": {
#     "competencies": [...],
#     "kpis": [
#       {
#         "id": "kpi-1",
#         "name": "...",
#         "category": "performance",
#         ...
#       }
#     ],
#     "tasks": [...]
#   },
#   "summary": {
#     "competencies_count": 1,
#     "kpis_count": 1,
#     "tasks_count": 3
#   }
# }
```

### 3.4: Verificar BD DESPUÉS (deben estar pobladas)

```bash
mysql -h localhost -u simuverse -p"CHANGE_ME_PASSWORD" simuverse << 'EOF'

-- CRÍTICO: Verificar que existen KPIs reales
SELECT COUNT(*) as kpis_despues FROM kpis WHERE course_id = 'dc3257e7-253f-4b0c-8087-9c930baa25c0';
-- Esperado: > 0 (1 o más)

-- Listar KPIs creados
SELECT id, name, category FROM kpis WHERE course_id = 'dc3257e7-253f-4b0c-8087-9c930baa25c0';

-- CRÍTICO: Verificar que existen Tasks reales  
SELECT COUNT(*) as tasks_despues FROM tasks WHERE course_id = 'dc3257e7-253f-4b0c-8087-9c930baa25c0';
-- Esperado: > 0 (3 o más: 2 práctica + 1 evaluación por KPI)

-- Listar Tasks creadas
SELECT id, title, type FROM tasks WHERE course_id = 'dc3257e7-253f-4b0c-8087-9c930baa25c0';

-- Verificar relación KPI ↔ Task
SELECT 
  k.name as kpi_name,
  COUNT(t.id) as task_count
FROM kpis k
LEFT JOIN tasks t ON k.id = t.kpi_id
WHERE k.course_id = 'dc3257e7-253f-4b0c-8087-9c930baa25c0'
GROUP BY k.id;
-- Esperado: 3 tasks por KPI

EOF
```

### 3.5: Verificar Course Config guardada

```bash
mysql -h localhost -u simuverse -p"CHANGE_ME_PASSWORD" simuverse << 'EOF'

-- Verificar que course_config tiene metadata con analyzed_kpis_config
SELECT 
  id,
  course_id,
  JSON_EXTRACT(metadata, '$.analyzed_kpis_config.kpis') as kpis_in_config
FROM course_config
WHERE course_id = 'dc3257e7-253f-4b0c-8087-9c930baa25c0';

-- Esperado: metadata con analyzed_kpis_config contiene KPIs

EOF
```

---

## TEST 4: Validar Relaciones (No NULL enforcement)

```bash
-- Intentar crear Tech-Sheet SIN course_id (debe fallar)
curl -X POST http://localhost:5000/api/tech-sheets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test sin curso"
  }'

# Respuesta esperada:
# {
#   "error": "course_id es OBLIGATORIO...",
#   "reason": "Una ficha técnica siempre tiene un curso..."
# }
# Status: 400
```

---

## TEST 5: Frontend - Crear Tech-Sheet Vía UI

### 5.1: Navegar a Tech-Sheets ABM

1. Abrir http://localhost:5173
2. Login como Admin (si es necesario)
3. Ir a "Fichas Técnicas" o "Tech-Sheets ABM"

### 5.2: Crear Nueva Ficha

1. Click "Crear Nueva Ficha Técnica"
2. Llenar campos:
   - Nombre: "Nueva Ficha Test"
   - Curso: Seleccionar "GENERAL-2026-01" de dropdown
   - Descripción: "Test descripción" (optional)
3. Click "Crear"

**Esperado:**
- ✅ Ficha creada exitosamente
- ✅ Aparece en lista
- ✅ course_id se muestra

### 5.3: Marcar como Completa

1. Click botón "Completar" en la ficha
2. Modal se abre con campos:
   - Competencias (opcional)
   - KPIs (opcional)
3. Llenar al menos 1 campo:
   ```
   Competencias: Gestión, Liderazgo, Comunicación
   KPIs: Cumplimiento 95%, Calidad 90%
   ```
4. Click "Guardar"

**Esperado:**
- ✅ Ficha actualizada
- ✅ Modal cierra
- ✅ Datos persisten en BD

### 5.4: Clicar "Analizar" (Si existe botón)

1. Click botón "Analizar" en la ficha
2. Sistema ejecuta POST /analyze
3. Backend crea KPIs y Tasks

**Esperado (En Console/Backend Logs):**
```
[KPI_CREATION] Iniciando creación de X KPIs...
✅ KPI creado: [id] - [nombre]
  ✅ Task práctica 1 creada: [id]
  ✅ Task práctica 2 creada: [id]  
  ✅ Task evaluación creada: [id]
[KPI_CREATION] Completado: 3 tasks creadas
```

---

## TEST 6: Validación de Data Consistency

```bash
mysql -h localhost -u simuverse -p"CHANGE_ME_PASSWORD" simuverse << 'EOF'

-- 1. Verificar que TODAS las tech-sheets tienen course_id válido
SELECT 
  ts.id,
  ts.name,
  ts.course_id,
  c.title as course_title
FROM tech_sheets ts
LEFT JOIN courses c ON ts.course_id = c.id
WHERE c.id IS NULL;
-- Esperado: 0 rows (todas las FK son válidas)

-- 2. Verificar que NO hay KPIs sin course_id
SELECT COUNT(*) FROM kpis WHERE course_id IS NULL OR course_id = '';
-- Esperado: 0

-- 3. Verificar que NO hay Tasks sin course_id o kpi_id
SELECT COUNT(*) FROM tasks WHERE course_id IS NULL OR kpi_id IS NULL;
-- Esperado: 0

-- 4. Contar totales
SELECT 
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM tech_sheets) as total_tech_sheets,
  (SELECT COUNT(*) FROM kpis) as total_kpis,
  (SELECT COUNT(*) FROM tasks) as total_tasks;

EOF
```

---

## TABLA DE RESULTADOS ESPERADOS

| Test | Descripción | Esperado | Status |
|------|-------------|----------|--------|
| 1 | BD cambios aplicados | ✅ 4/4 | ⏳ |
| 2 | Crear Tech-Sheet API | ✅ course_id obligatorio | ⏳ |
| 3.1 | Analizar crea KPIs | ✅ COUNT > 0 | ⏳ CRÍTICO |
| 3.2 | Analizar crea Tasks | ✅ COUNT > 0 | ⏳ CRÍTICO |
| 3.3 | Config guardada | ✅ metadata presente | ⏳ |
| 4 | FK enforcement | ✅ course_id NOT NULL | ⏳ |
| 5 | Frontend creación | ✅ Ficha guardada | ⏳ |
| 5.2 | Frontend análisis | ✅ KPIs creados | ⏳ |
| 6 | Data consistency | ✅ Sin huérfanos | ⏳ |

---

## CHECKLIST DE ÉXITO

- [ ] TEST 1: BD cambios OK
- [ ] TEST 2: Crear Tech-Sheet OK
- [ ] TEST 3: Analizar crea KPIs en BD ✅ CRITICAL
- [ ] TEST 3: Analizar crea Tasks en BD ✅ CRITICAL
- [ ] TEST 4: FK enforcement OK
- [ ] TEST 5: Frontend creación OK
- [ ] TEST 6: Data consistency OK
- [ ] LOGS: Sin errores TypeScript
- [ ] LOGS: Sin errores MySQL
- [ ] LOGS: Sin 500 errors en API

---

## PASOS SIGUIENTES SI TODO PASA

1. ✅ Commit cambios a git
2. ✅ Deploy a staging/producción
3. ✅ Monitor logs 24h
4. ✅ Optional: Implementar FIX 1.4 (rutas desambiguas)

---

## ROLLBACK EN CASO DE ERROR

```bash
# BD Rollback
mysql -h localhost -u simuverse -p"CHANGE_ME_PASSWORD" simuverse << 'EOF'
-- Restaurar schema
ALTER TABLE tech_sheets MODIFY course_id VARCHAR(36) NULLABLE;
ALTER TABLE courses ADD COLUMN tech_sheet_id INT NULLABLE;

-- Restaurar datos originales
UPDATE courses SET course_id = 'xxxxxTIENDAS ONLINE' WHERE id = '05df8823-ab60-4f71-bfaf-6cad04ca54f4';
UPDATE courses SET course_id = '1' WHERE id = 'dc3257e7-253f-4b0c-8087-9c930baa25c0';

-- Eliminar KPIs/Tasks creados durante testing
DELETE FROM tasks WHERE course_id IN (SELECT id FROM courses);
DELETE FROM kpis WHERE course_id IN (SELECT id FROM courses);
EOF

# Código Rollback
git checkout server/src/entities/TechSheet.ts
git checkout server/src/entities/Course.ts
git checkout server/src/services/TechSheetAnalysisService.ts
```

---

**Testing Plan:** 11 de Marzo 2026  
**Responsable:** QA / Dev  
**Duración Estimada:** 30-60 minutos

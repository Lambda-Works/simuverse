# Plan de Demo — SimuVerse

**Fecha del demo**: Jueves  
**Fecha límite preparación**: Miércoles noche  
**Empresa ficticia**: Administración Las Tradiciones  
**Curso base**: Ofimática Básica para Empleado de Oficina

---

## 1. Objetivo del Demo

Mostrar a Marcela (y equipo de Ministerio) el ciclo completo de SimuVerse:

1. Un administrador configura un curso con módulos activos ("lego" de IA)
2. Un alumno entra a la simulación, interactúa con IA, lee emails, ve documentos
3. Un profesor ve el progreso del alumno
4. Un auditor del Ministerio ve la trazabilidad de actividad

**Mensaje clave**: "SimuVerse convierte una ficha técnica en una experiencia de aprendizaje simulada e interactiva, con trazabilidad completa para el Ministerio."

---

## 2. Escenario Ficticio

**Empresa**: Administración Las Tradiciones  
**Rubro**: Servicios administrativos y contables  
**Ciudad**: Rosario, Santa Fe

**Situación**: El empleado nuevo (el alumno) debe ayudar a su jefe de administración con tareas del día a día:
- Calcular una planilla de sueldos con datos específicos
- Armar una minuta de reunión a partir de notas
- Buscar hoteles para un viaje de capacitación
- Responder un email urgente del proveedor
- Resolver una situación de crisis (error en liquidación de sueldos)

**Módulos activos** (los que SimulationPage lee de `course.modules`):
- `chat_ia` — Compañero de trabajo que pide ayuda con Excel
- `email_simulado` — Emails del jefe y proveedores
- `documentos` — Documentos pre-cargados
- `hoja_calculo` — Planilla de sueldos
- `crisis_engine` — Alerta de crisis

---

## 3. Roles y Lo que Ve Cada Uno

### Admin (`admin@simuverse.edu`)
- Panel de administración completo
- Ve: cursos, escenarios, fichas técnicas, KPIs, tareas, usuarios
- Flujo demo: configurar el curso "Ofimática Básica", activar módulos, asignar escenario

### Alumno (`juan.perez@student.edu`)
- Dashboard con cursos asignados
- Inicia simulación → SimulationPage con 5 pestañas
- Flujo demo: chatear con compañero IA, leer emails, ver documentos, usar planilla, resolver crisis

### Profesor (`garcia@simuverse.edu`)
- Ve lista de alumnos y su progreso
- Flujo demo: revisar que Juan tiene una simulación activa

### Ministerio (`control@ministerio.gob`)
- Ve trazabilidad: intentos, éxitos, fracasos, KPIs alcanzados
- Flujo demo: ver logs de actividad del alumno

---

## 4. Flujos del Demo (Secuencia)

### Flujo A — Admin configura el curso (~5 min)

1. Login como `admin@simuverse.edu`
2. Ir a Panel Admin → Cursos
3. Crear/editar curso "Ofimática Básica para Empleado de Oficina"
4. Activar módulos: Chat IA, Email Simulado, Documentos, Hoja de Cálculo, Motor de Crisis
5. Ir a Escenarios → Crear escenario "Primer Día en Administración Las Tradiciones"
6. Asignar el curso al alumno Juan Pérez
7. Verificar que el curso aparece en el dashboard del alumno

### Flujo B — Alumno realiza la simulación (~10 min)

1. Login como `juan.perez@student.edu`
2. Ver curso asignado en dashboard → Click "Iniciar Simulación"
3. **Pestaña Chat IA**: El compañero de trabajo (gemini en rol) dice "Hola, necesito ayuda con una fórmula de Excel para liquidar sueldos"
4. **Pestaña Email**: Ver 3 emails pre-cargados:
   - Del jefe: "Armar minuta de reunión del viernes"
   - Del proveedor: "Confirmación de envío de material"
   - Urgente: "Error en liquidación de sueldos — resolver"
5. **Pestaña Documentos**: Ver 2 documentos pre-cargados (minuta modelo, contrato de proveedor)
6. **Pestaña Planilla**: Ver planilla con datos de ejemplo
7. **Crisis**: Recibir alerta de crisis (error en liquidación) → elegir opción → ver feedback

### Flujo C — Profesor revisa (~3 min)

1. Login como `garcia@simuverse.edu`
2. Ver lista de alumnos con simulaciones activas
3. Ver que Juan tiene una simulación en curso

### Flujo D — Ministerio ve trazabilidad (~3 min)

1. Login como `control@ministerio.gob`
2. Ver actividad de alumnos: intentos, resultados, KPIs
3. Ver que la simulación de Juan quedó registrada

---

## 5. Real vs Mock — Tabla Honesta

| Componente | Estado Actual | Para el Demo | Esfuerzo |
|---|---|---|---|
| **Auth / Login** | Funciona (7 usuarios seed) | **REAL** — no tocar | 0 |
| **Admin UI (CRUD)** | Funciona (cursos, escenarios, fichas, KPIs, tareas) | **REAL** — usar tal cual | 0 |
| **SimulationPage (frontend)** | Existe, lee módulos del curso, muestra pestañas | **REAL** — verificar que muestra las 5 pestañas | 1h |
| **Chat IA → Gemini** | Stubbed (retorna "OK"), servicio AI tiene fallback + integración Gemini real | **REAL** — reemplazar stub en controller, poner API key válida | 3h |
| **Emails** | Stubbed (retorna `[]`) | **MOCK** — pre-load estáticos en DB, controller los lee | 2h |
| **Documentos** | Stubbed (retorna `[]`) | **MOCK** — pre-load estáticos en DB, controller los lee | 2h |
| **Planilla** | Stubbed (retorna `{}`) | **MOCK** — retornar JSON hardcodeado con datos de ejemplo | 1h |
| **Crisis Engine** | Implementado pero sin endpoint | **REAL** — exponer endpoint `POST /simulations/:id/crisis` | 2h |
| **Seed data (simulaciones)** | 0 simulaciones en DB | **REAL** — script seed con curso, escenario, asignación, permisos | 2h |
| **role_permissions** | 0 filas | **REAL** — seed con permisos básicos | 1h |
| **Profesor: ver progreso** | Frontend existe (StudentReviewModal) | **REAL** — verificar que funciona con datos reales | 1h |
| **Ministerio: trazabilidad** | Controller existe con CRUD | **MOCK** — mostrar datos de la tabla `practice_logs` / `telemetry_logs` | 1h |
| **Pipeline: ficha → escenarios** | No existe | **OUT OF SCOPE** — crear escenario manual en admin | 0 |
| **Email real (envío)** | No existe | **OUT OF SCOPE** — solo mostrar inbox pre-cargado | 0 |
| **Dashboard ministerio agregado** | No existe | **OUT OF SCOPE** — mostrar tabla básica de logs | 0 |

---

## 6. Tareas Priorizadas

### Lunes (Día 1) — Infraestructura y Seed

| # | Tarea | Entregable | Est. |
|---|---|---|---|
| 1.1 | Obtener API key válida de Gemini (Google AI Studio) | Key funcionando en `.env` | 1h |
| 1.2 | Crear script `seed-demo.ts` con: curso "Ofimática Básica", escenario "Primer Día", CourseConfig con `active_modules: ["chat_ia","email_simulado","documentos","hoja_calculo","crisis_engine"]`, `family_type: administration` | Script ejecutable | 3h |
| 1.3 | Crear asignación de curso a Juan Pérez (`simulation_assignments`) | Registro en DB | 1h |
| 1.4 | Poblar `role_permissions` con permisos para admin, teacher, student, ministerio | Tabla con datos | 1h |
| 1.5 | Crear empresa ficticia "Administración Las Tradiciones" en `simulated_companies` | Registro en DB | 0.5h |
| 1.6 | Ejecutar seed completo y verificar que el curso aparece en el dashboard del alumno | Verificación visual | 1h |

**Checkpoint Lunes**: Alumno ve el curso asignado en su dashboard.

### Martes (Día 2) — Chat IA + Endpoints Mock

| # | Tarea | Entregable | Est. |
|---|---|---|---|
| 2.1 | Reemplazar stub `POST /simulations/:id/message` para usar `AIService.sendMessageToGemini()` con system prompt del `CourseConfig` | Chat funciona con Gemini real | 3h |
| 2.2 | Crear system prompt para el escenario: "Sos el compañero de trabajo de Juan en Administración Las Tradiciones. Pedile ayuda con una fórmula de Excel para liquidar sueldos. Mantené el roleplay." | Prompt guardado en `ai_config` del curso | 1h |
| 2.3 | Implementar `GET /simulations/:id/emails` — retornar array de 3 emails pre-cargados desde `course_documents` o JSON hardcodeado | Endpoint funcional | 2h |
| 2.4 | Implementar `GET /simulations/:id/documents` — retornar 2 documentos pre-cargados | Endpoint funcional | 1.5h |
| 2.5 | Implementar `GET /simulations/:id/spreadsheet` — retornar JSON con planilla de sueldos de ejemplo | Endpoint funcional | 1h |
| 2.6 | Verificar SimulationPage muestra las 5 pestañas con contenido | Test visual completo | 1h |

**Checkpoint Martes**: Alumno puede chatear con IA real, ver emails, documentos y planilla.

### Miércoles (Día 3) — Crisis + Pulido + Test Completo

| # | Tarea | Entregable | Est. |
|---|---|---|---|
| 3.1 | Exponer endpoint `POST /simulations/:id/crisis/get` y `POST /simulations/:id/crisis/resolve` usando `CrisisEngine` | Crisis funciona desde el frontend | 2h |
| 3.2 | Agregar botón "Crisis" en SimulationPage (o integrar en el chat) que dispare el endpoint de crisis | UI funcional | 1.5h |
| 3.3 | Verificar flujo del profesor: login → ver alumnos → ver progreso de Juan | Funcional | 1h |
| 3.4 | Verificar flujo del ministerio: login → ver logs de actividad de Juan | Funcional | 1h |
| 3.5 | Test end-to-end completo: login admin → configura curso → login alumno → inicia simulación → chatea → lee emails → ve documentos → resuelve crisis | Flujo completo validado | 2h |
| 3.6 | Preparar "guion del demo" — secuencia de clicks exacta para quien presente | Documento guion | 1h |
| 3.7 | Backup: si Gemini falla, el fallback del `AIService` genera respuestas en-rol automáticamente | Fallback verificado | 0.5h |

**Checkpoint Miércoles**: Todo funcional, guion listo, fallback probado.

---

## 7. Datos Seed Necesarios

### Curso

```json
{
  "id": "course-ofimatica-001",
  "course_id": "OFI-BAS-001",
  "title": "Ofimática Básica para Empleado de Oficina",
  "description": "Simulación interactiva de ofimática en entorno administrativo real",
  "category": "administracion",
  "modules": ["chat_ia", "email_simulado", "documentos", "hoja_calculo", "crisis_engine"],
  "is_active": true,
  "simulated_company_id": 1
}
```

### CourseConfig

```json
{
  "course_id": "course-ofimatica-001",
  "config_data": {},
  "base_role": "Eres el compañero de trabajo de Juan en Administración Las Tradiciones. Te llamas Carlos. Estás necesitás ayuda con una fórmula de Excel para liquidar sueldos.",
  "course_context": "Juan es un empleado nuevo en Administración Las Tradiciones, una empresa de servicios administrativos en Rosario. Está en su primer día y debe ayudar con tareas de oficina.",
  "personality_traits": ["amigable", "paciente", "práctico", "orientado a resultados"],
  "knowledge_base_prompt": "Si Juan pide ayuda con Excel, guialo paso a paso. Si se equivoca, corregilo con paciencia. Si se sale del rol, recordale el contexto.",
  "active_modules": ["chat_ia", "email_simulado", "documentos", "hoja_calculo", "crisis_engine"],
  "family_type": "administration"
}
```

### Escenario

```json
{
  "id": "scenario-primer-dia-001",
  "course_id": "course-ofimatica-001",
  "title": "Primer Día en Administración Las Tradiciones",
  "description": "Tu primer día como empleado de oficina. Tu compañero Carlos necesita ayuda con una planilla de sueldos.",
  "scenario_type": "daily_operations",
  "difficulty": "easy",
  "content": {
    "context": "Es lunes por la mañana. Estás en tu escritorio. Tu compañero Carlos se acerca con una planilla de Excel y te pide ayuda.",
    "student_data": {
      "nombre": "Juan Pérez",
      "rol": "Empleado nuevo",
      "empresa": "Administración Las Tradiciones"
    }
  },
  "expected_outcomes": {
    "main_objective": "Ayudar a Carlos con la fórmula de Excel, responder los emails del jefe y resolver la crisis de liquidación."
  }
}
```

### Emails Pre-cargados (3)

| # | De | Asunto | Cuerpo |
|---|---|---|---|
| 1 | Jefe de Administración | Reunión del viernes — armar minuta | "Juan, necesito que armes la minuta de la reunión del viernes pasado. Te adjunto las notas. Formato estándar de la empresa." |
| 2 | Proveedor OfficeMax | Confirmación de envío | "Su pedido de 20 resmas de papel A4 fue despachado. Llega el miércoles. N° de seguimiento: OM-2024-7891." |
| 3 | Jefe de Administración (URGENTE) | Error en liquidación de sueldos | "URGENTE: El sistema procesó mal el coeficiente de aportes. 47 empleados afectados. Necesitamos reliquidación inmediata." |

### Documentos Pre-cargados (2)

| # | Nombre | Tipo | Contenido |
|---|---|---|---|
| 1 | Minuta Reunión 2024-11-15 | procedure | "ORDEN DEL DÍA: 1. Revisión de presupuesto Q4. 2. Liquidación de sueldos. 3. Capacitación del equipo." |
| 2 | Contrato Proveedor OfficeMax | contract | "Contrato de suministro de material de oficina. Vigencia: 01/01/2024 — 31/12/2024. Condiciones de pago: 30 días." |

### Planilla de Sueldos (Ejemplo)

```json
{
  "name": "Liquidación de Sueldos — Noviembre 2024",
  "data": [
    { "item": "Sueldo base", "value": 450000, "currency": "ARS" },
    { "item": "Horas extra (10hs)", "value": 28000, "currency": "ARS" },
    { "item": "Aportes jubilatorios (17%)", "value": 81060, "currency": "ARS" },
    { "item": "Obra social (6%)", "value": 28620, "currency": "ARS" },
    { "item": "Total bruto", "value": 478000, "currency": "ARS" },
    { "item": "Descuento ART (1.5%)", "value": 7170, "currency": "ARS" },
    { "item": "Neto a cobrar", "value": 470830, "currency": "ARS" }
  ],
  "formulas": {
    "Aportes": "= Sueldo base × 17%",
    "Obra Social": "= Sueldo base × 6%",
    "ART": "= Sueldo base × 1.5%",
    "Neto": "= Sueldo base + Horas extra - Aportes - Obra Social - ART"
  }
}
```

### Crisis (ya implementada en `crisis-engine.service.ts`)

La crisis de "Error crítico en liquidación de sueldos" ya existe en el banco de `administracion`. Solo necesita el endpoint expuesto.

---

## 8. Riesgos y Plan B

| Riesgo | Probabilidad | Impacto | Plan B |
|---|---|---|---|
| **Gemini API key no funciona o rate limit** | Media | Alto | El `AIService` ya tiene fallback automático — genera respuestas en-rol sin Gemini. Verificar que el fallback funcione antes del demo. |
| **SimulationPage no muestra las 5 pestañas** | Baja | Alto | Verificar que `course.modules` incluye los 5 IDs. Si no, ajustar el seed. El frontend ya lee modules correctamente. |
| **Seed falla por constraint violation** | Media | Medio | Usar `upsert` en el seed. Verificar IDs únicos. Testear el script antes de ejecutar en producción. |
| **Crisis engine no expone endpoint a tiempo** | Media | Bajo | La crisis se puede mostrar manualmente desde la DB o se omite del demo. Los otros módulos son suficientes. |
| **Docker no levanta** | Baja | Alto | Tener un backup con `docker-compose down -v && docker-compose up --build`. Verificar que no hay puertos ocupados. |
| **Alumno no ve el curso asignado** | Media | Alto | Verificar que `simulation_assignments` tiene el registro correcto con `student_id = stud-001` y `course_id = course-ofimatica-001`. |
| **Emails/Documents aparecen vacíos** | Media | Medio | Verificar que el endpoint retorna el array hardcodeado. Si el frontend espera un formato distinto, ajustar la respuesta. |
| **Problema de conexión a DB** | Baja | Alto | Verificar `DATABASE_URL` en `.env`, que PostgreSQL está corriendo, y que las migraciones están aplicadas. |

---

## 9. Setup para el Jueves (Checklist)

### La mañana del jueves (quien presenta)

- [ ] **Pre-requisitos**: Docker corriendo, navegador Chrome actualizado
- [ ] **Limpiar estado**: Si hay datos residuales, correr `docker-compose down -v && docker-compose up --build` y luego el seed
- [ ] **Verificar Gemini**: Hacer un chat de prueba como alumno, confirmar que la IA responde en rol
- [ ] **Pre-cargar tabs del navegador**:
  - Tab 1: Login admin (`admin@simuverse.edu` / `Admin123!`)
  - Tab 2: Login alumno (`juan.perez@student.edu` / `Admin123!`)
  - Tab 3: Login profesor (`garcia@simuverse.edu` / `Admin123!`)
  - Tab 4: Login ministerio (`control@ministerio.gob` / `Admin123!`)
- [ ] **Cerrar sesiones activas** en todos los tabs antes de empezar
- [ ] **Velocidad de internet**: Verificar que Gemini responde rápido (si hay lag, considerar demo con fallback)

### Script del demo (orden de clicks)

1. **Admin** (3 min): Login → Panel Admin → Cursos → Ver "Ofimática Básica" → Escenarios → Ver "Primer Día" → Asignaciones → Ver que Juan está asignado
2. **Alumno** (5 min): Login → Ver curso en dashboard → "Iniciar Simulación" → Chat IA: escribir "Hola Carlos, ¿cómo andás?" → Ver respuesta de IA → Pestaña Email: abrir email URGENTE → Pestaña Documentos: ver minuta → Pestaña Planilla: ver datos → Botón Crisis: ver alerta → elegir opción
3. **Profesor** (2 min): Login → Ver lista de alumnos → Ver que Juan tiene simulación activa
4. **Ministerio** (2 min): Login → Ver trazabilidad de actividad → Ver logs de Juan

### Contacto de emergencia

- Si algo falla durante el demo, tener abierto el terminal de Docker para hacer restart rápido
- Tener la URL del frontend y backend escritas en un lugar visible
- Si Gemini falla, el fallback genera respuestas automáticas — no decir nada, simplemente mostrar que "el asesor responde"

---

## 10. Resumen de Cambios de Código Necesarios

| Archivo | Cambio | Prioridad |
|---|---|---|
| `.env` (API) | Poner `GEMINI_API_KEY` real | CRÍTICO |
| `.env.local` (Web) | Poner `NEXT_PUBLIC_GEMINI_API_KEY` real | CRÍTICO |
| `apps/api-nest/src/simulations/simulations.controller.ts` | Reemplazar stubs de `:id/message`, `:id/emails`, `:id/documents`, `:id/spreadsheet` con lógica real | CRÍTICO |
| `apps/api-nest/src/simulations/engines/crisis-engine.service.ts` | Ya implementado — solo exponer endpoints | ALTO |
| `apps/api-nest/src/prisma/seed.ts` | Agregar seed de curso, escenario, config, asignación, empresa, permisos | ALTO |
| `apps/web/src/views/SimulationPage.tsx` | Verificar que lee módulos correctamente (ya funciona) | BAJO |

---

## Notas Finales

- **Lo que ya funciona y no tocar**: Auth, Admin UI completo, estructura de SimulationPage, AI service con fallback
- **Lo que hay que conectar**: Stub de chat → Gemini real, stubs de emails/docs → datos pre-cargados
- **Lo que hay que crear**: Seed completo, endpoint de crisis, system prompt del escenario
- **El fallback es tu amigo**: Si Gemini falla, el `AIService` genera respuestas en-rol automáticamente. No panic.

---

*Documento generado el 2026-07-05. Última actualización: 2026-07-05.*

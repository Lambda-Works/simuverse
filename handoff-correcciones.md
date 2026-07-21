# Correcciones Simuverse — Diagnóstico completo y guía de fix

> **Para el dev**: este documento contiene todo el contexto necesario. No se necesita Engram, OpenSpec ni herramientas externas. Todo está verificado contra el código local (Julio 2026).

---

## Stack y entorno

```
simuverse-engine/          → monorepo npm workspaces
├── apps/web/              → Next.js 15 App Router, React 19, TypeScript
│                            shadcn/ui + Tailwind CSS 3, TanStack Query, Zod
│                            Vitest (unit) + Cypress (e2e) + Testing Library
│                            Corre en :3032 (docker)
├── apps/api-nest/         → NestJS 10, TypeScript, Prisma ORM
│                            PostgreSQL 15, JWT auth, RBAC con guards
│                            Corre en :3033 (docker)
├── apps/api-express/      → Express + TypeORM + MySQL 8 (legacy, no se usa activamente)
├── apps/markitdown/       → Servicio Python para convertir docs
│                            Corre en :5003
├── proxy/                 → http-proxy-middleware, rutea en :3031 → :5000 interno
└── docker-compose.yml     → 5 servicios: proxy, postgres, api-nest, markitdown, web
```

**Base de datos**: PostgreSQL 15 (`postgres:15-alpine`), puerto `5432` interno mapeado a `3029` host.

**Variables de entorno** (`.env`):
```
POSTGRES_USER=simuverse
POSTGRES_PASSWORD=SimuVerse2024secret
POSTGRES_DB=simuverse
JWT_SECRET=dev-secret
DATABASE_URL=postgresql://simuverse:SimuVerse2024secret@postgres:5432/simuverse
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-v4-flash
OPENAI_API_KEY=...
OPENAI_CHAT_MODEL=gpt-4o-mini
```

**Credenciales seed** (archivo: `apps/api-nest/src/prisma/seed.ts`):

| Email | Rol | Password |
|-------|-----|----------|
| admin@simuverse.edu | admin | Admin123! |
| garcia@simuverse.edu | teacher | Admin123! |
| martinez@simuverse.edu | teacher | Admin123! |
| control@ministerio.gob | ministerio | Admin123! |
| juan.perez@student.edu | student | Admin123! |

---

## Contexto importante: RBAC mergeado, NO deployado a prod

El branch `feature/rbac-endpoint-wiring` fue mergeado a main (commits: `7080715`, `045892a`, `28c20e0`, `bc8ebc4`, `d517b1a`, etc.). Esto agregó:

- `@Permissions()` decorators en todos los controladores
- `RolesGuard` y `PermissionsGuard` como guards globales
- Sidebar basado en permisos (no hardcodeado)

**Implicación**: varios items del archivo original de correcciones que reportan errores 403 en prod pueden YA ESTAR RESUELTOS en el código actual. Verificar localmente antes de tocar.

---

## Items YA CORREGIDOS (no hacer nada)

| # | Item | Dónde se arregló |
|---|------|-------------------|
| 1 | No se puede volver al listado de cursos | `SimulationPage.tsx` — ya tiene `ArrowLeft` para admin, teacher y student en 3 posiciones distintas |
| 2 | "1 simulaciónes" typo | `Dashboard.tsx:300` — template literal con pluralización correcta (`simulación` vs `simulaciones`) |
| 3 | Bot responde off-topic (cualquier consulta) | `ai.service.ts:buildSystemPrompt()` — se agregó guard `RESTRICCIÓN ABSOLUTA DE CONTENIDO` con `subject_domain`. Además `DEFAULT_MAX_TOKENS` subió de 2000 a 50000 para que no se trunque el system prompt. |

---

## CRÍTICO 1: Botón "Responder" no hace nada

**Archivo**: `apps/web/src/views/SimulationPage.tsx` ~línea 779

**Lo que pasa**: Al hacer clic en "Responder", solo se dispara un toast:

> "Abriendo redactor para responder a Ricardo (Jefe de Mantenimiento)"

Pero **no abre absolutamente nada**. No hay modal, no hay navegación, no hay redactor. El botón no tiene handler real más allá del toast.

**Fix**: El botón debe abrir el redactor de respuesta. Hay que:
1. Revisar si existe un componente `ResponseEditor` o `MessageEditor` que no se está montando
2. O agregar navegación programática a una ruta de respuesta
3. O abrir un modal/drawer con el editor de texto

---

## CRÍTICO 2: IA ignora system_prompt y coaching_prompt

**El bug es de LECTURA, no de escritura.**

El save a DB funciona **perfectamente**. Los prompts se persisten en dos lugares simultáneamente (tabla `tech_sheet_prompts` + JSONB `course_config.ia_config`). El problema es que **la simulación nunca los lee** al construir el prompt para GPT/DeepSeek.

### Flujo de ESCRITURA (funciona ✅)

**1. UI → API**
`apps/web/src/components/PromptTemplatesABM.tsx` ~167-180:
```tsx
await apiClient.put(`/tech-sheets/${bundle.sheet.id}/prompts`, {
  system_prompt: form.system_prompt,
  coaching_prompt: form.coaching_prompt,
  base_role: form.base_role,
  course_context: form.course_context,
  knowledge_base_prompt: form.knowledge_base_prompt,
});
```

**2. API → DB**
`apps/api-nest/src/catalog/tech-sheets.service.ts` `updatePrompts()` ~619-725:

El método hace 3 cosas en secuencia:
1. **Guarda en tabla `tech_sheet_prompts`** (líneas 629-648):
   ```typescript
   await tx.techSheetPrompt.upsert({
     where: { tech_sheet_id_type: { tech_sheet_id: id, type: 'system' } },
     update: { content: systemPrompt },
     create: { tech_sheet_id: id, type: 'system', content: systemPrompt },
   });
   // ... lo mismo para coaching con type: 'coaching'
   ```

2. **Sincroniza JSONB `extracted_data.analyzed_config.prompts`** en la tabla `tech_sheets` (líneas 650-668).

3. **Sincroniza `course_config.ia_config`** (líneas 695-725) — **este es el JSONB que la simulación debería leer**:
   ```typescript
   const configData = {
     ia_config: {
       ...prevIa,
       systemPrompt: sys,         // ← guardado correctamente
       coachingPrompt: coach,     // ← guardado correctamente
       temperature: prevIa.temperature ?? 0.7,
       maxTokens: prevIa.maxTokens ?? 4000,
     },
     base_role: dto.base_role,                      // ← guardado correctamente
     course_context: dto.course_context,            // ← guardado correctamente
     knowledge_base_prompt: dto.knowledge_base_prompt, // ← guardado correctamente
   };
   await this.prisma.courseConfig.upsert({
     where: { course_id: sheet.course_id },
     update: configData,
     create: { course_id: sheet.course_id, ...configData },
   });
   ```

### Flujo de LECTURA (roto ❌)

**`apps/api-nest/src/simulations/simulations.controller.ts`** `sendMessage()` ~190-260:

```typescript
const config = await this.simulationsService.getSimulationConfig(id);
// config es un CourseConfig COMPLETO que SÍ incluye:
//   config.ia_config.systemPrompt   ← EXISTE, pero NADIE lo lee
//   config.ia_config.coachingPrompt ← EXISTE, pero NADIE lo lee

const systemPrompt = this.aiService.buildSystemPrompt({
  base_role: config?.base_role || 'Eres un asistente.',        // ✅ leído
  course_context: config?.course_context || '',                // ✅ leído
  knowledge_base: config?.knowledge_base_prompt || '',         // ✅ leído
  personality_traits: (config?.personality_traits as string[]) || [],
  student_history: [],
  subject_domain: this.extractSubjectDomain(config?.course_context),
  ...practiceExtras,
  // ❌ NUNCA se pasa config.ia_config.systemPrompt
  // ❌ NUNCA se pasa config.ia_config.coachingPrompt
});
```

Hay **dos bloques** donde se construye `systemPrompt` (uno para `chatbot_humano_enabled = false`, línea ~200, y otro para `= true`, línea ~250). En **ninguno** se lee `ia_config`.

**`apps/api-nest/src/simulations/ai/ai.service.ts`** — interfaz `PromptData` ~5-25:

```typescript
export interface PromptData {
  base_role: string;
  course_context: string;
  knowledge_base: string;
  student_history: string[];
  personality_traits: string[];
  tone?: string;
  language?: string;
  role_behavior?: string;
  chatbot_humano_enabled?: boolean;
  current_state?: string;
  agent_key?: string;
  difficulty?: string;
  prior_context?: string;
  subject_domain?: string;
  // ❌ NO existe system_prompt
  // ❌ NO existe coaching_prompt
}
```

**`apps/api-nest/src/simulations/ai/ai.service.ts`** — `buildSystemPrompt()` ~157-309:

El método construye secciones con prioridad: off-topic guard → practice context → base_role → course_context → knowledge_base → personality_traits → role_behavior → state → history → tone/language. **No existe ninguna sección para system_prompt ni coaching_prompt.**

**`apps/api-nest/src/courses/course-config.service.ts`** ~93-98:

Existe un método `getSystemPrompt()` que SÍ lee `ia_config.systemPrompt`, pero es **código muerto** — ninguna parte de la simulación lo llama:
```typescript
getSystemPrompt(config: CourseConfig): string {
  const ia = config.ia_config as Record<string, any> | null;
  return ia?.systemPrompt || '';
}
```

### Esquema Prisma relevante

```prisma
// Tabla donde se guardan los prompts cuando se editan desde PromptTemplatesABM
model TechSheetPrompt {
  id            String @id @default(uuid())
  tech_sheet_id Int
  type          TechSheetPromptType   // 'system' | 'coaching'
  content       String @db.Text
  @@unique([tech_sheet_id, type])
  @@map("tech_sheet_prompts")
}

// Configuración del curso — acá es donde vive ia_config
model CourseConfig {
  id                    String  @id @default(uuid())
  course_id             String  @unique
  config_data           Json
  base_role             String? @db.Text       // ← la simulación SÍ lee esto
  course_context        String? @db.Text       // ← la simulación SÍ lee esto
  knowledge_base_prompt String? @db.Text       // ← la simulación SÍ lee esto
  personality_traits    Json?
  ia_config             Json?                  // ← contiene { systemPrompt, coachingPrompt, temperature, maxTokens }
  tone                  String?
  language              String?
  role_behavior         String?
  // ... más campos
  @@map("course_config")
}
```

### Fix esperado

1. **`ai.service.ts` — interfaz `PromptData`**: agregar `system_prompt?: string` y `coaching_prompt?: string`.

2. **`simulations.controller.ts` — `sendMessage()`** (~línea 200 y ~línea 250): leer `config.ia_config?.systemPrompt` y `config.ia_config?.coachingPrompt`, pasarlos al `PromptData`:
   ```typescript
   system_prompt: (config?.ia_config as any)?.systemPrompt || '',
   coaching_prompt: (config?.ia_config as any)?.coachingPrompt || '',
   ```

3. **`ai.service.ts` — `buildSystemPrompt()`**: si `system_prompt` está presente, agregarlo como sección de prioridad alta (ej. priority 0, justo después del off-topic guard pero antes de `base_role`) como cuerpo principal del system message. Si `coaching_prompt` está presente, agregarlo como sección de coaching.

4. **`course-config.service.ts`**: eliminar o conectar el método muerto `getSystemPrompt()`.

---

## ALTO: Bugs de UX

### 1. Ícono ojo en login muy chico

**Archivo**: `apps/web/src/views/Auth.tsx` ~260-268
**Problema**: Botón toggle visibilidad de contraseña mide ~16x16px sin padding. Imposible de clickear bien, especialmente en mobile.
**Fix**: Agregar `p-2` o `size-10` al botón contenedor. El ícono sigue igual, pero el área de click crece.

### 2. Error de contraseña de curso sin toast ni borde rojo

**Archivo**: `apps/web/src/views/Dashboard.tsx` ~238-242
**Problema**: Al errar la contraseña de un curso protegido, el error se muestra inline en un lugar fijo. Si el usuario scrolleó, no lo ve.
**Fix**: 
- Mostrar error como toast flotante (la app ya usa `sonner` o similar — `toast.success`/`toast.error`).
- Agregar `border-red-500` o clase de error al `Input` de contraseña cuando `error` está presente.

### 3. Día seleccionado usa hora del cliente

**Archivo**: `apps/web/src/components/SimulationCalendar.tsx` ~54, 89, 143
**Problema**: `new Date()` en frontend usa la hora de la máquina del usuario. Si tiene la zona horaria mal, el día "actual" es incorrecto.
**Fix**: Obtener timestamp del servidor vía `GET /api/health` (ya devuelve timestamp) o usar header `Date` de respuestas HTTP como referencia.

### 4. Tag "Completado" no aparece al terminar curso

**Problema**: Sin feedback visual de que el curso está completado.
**Fix**: Mostrar un `Badge` de "Completado" (shadcn/ui) en la vista del curso/review cuando el estado es `completed`. Buscar en `StudentReviewModal.tsx` o componente equivalente de detalle de curso.

### 5. Intentos restantes visibles post-completado

**Archivo**: `apps/web/src/views/Dashboard.tsx` ~425-429
**Problema**: Después de completar una práctica, el contador de "intentos restantes: X" sigue mostrándose.
**Fix**: Condicionar render: `{attempts.remaining > 0 && !completed && <span>Intentos restantes: {attempts.remaining}</span>}`.

### 6. Tabla Excel: columna "Moneda" con `$` para todo

**Archivo**: `apps/web/src/views/SimulationPage.tsx` ~949
**Problema**: 
```typescript
// Línea ~949 aproximadamente:
$${row.value?.toLocaleString()}
```
Esto aplica `$` a cualquier valor numérico: horas, grados centígrados, metros, porcentajes. Todo se ve como pesos.
**Fix**: Detectar tipo de unidad según el contexto de la columna. Si el header o metadata dice "Moneda" → `$`, si es "Horas" → `h`, si es "%" → `%`, etc. Si no se puede inferir, no poner símbolo.

---

## ALTO: Bugs de Admin

### 7. Botón "Desactivar" usa ícono de eliminar

**Archivo**: `apps/web/src/views/AdminPanel.tsx` ~904-907
**Problema**: El botón de desactivar (soft delete) usa `variant="destructive"` con `Trash2`, exactamente igual que un botón de delete. El usuario no distingue entre desactivar y borrar.
**Fix**: Cambiar a `variant="outline"` o `variant="secondary"` con ícono `Power` o `ToggleLeft` de `lucide-react`.

### 8. No existe hard delete de cursos

**Archivo**: `apps/api-nest/src/catalog/courses.service.ts` ~414
**Problema**: Solo existe soft delete. No hay endpoint para eliminación permanente.
**Fix**: Agregar `DELETE /courses/:id/permanent` con eliminación real y cascade en Prisma. Solo admin. Botón en UI con confirmación explícita.

### 9. Legajo dice "generado por admin" hardcodeado

**Archivo**: `apps/web/src/views/StudentLedger.tsx` ~334
**Problema**: Muestra "generado por admin" siempre, sin importar quién lo creó realmente.
**Fix**: Usar `legajo.createdBy.name` o campo equivalente que venga del backend.

### 10. "Sesiones" duplicado en sidebar admin

**Archivos**: `apps/web/src/config/nav-config.ts` ~22 y `apps/web/src/config/admin-nav.ts` ~44
**Problema**: La sección "Sesiones" aparece dos veces: una como item global y otra contextual. Confunde.
**Fix**: Consolidar o diferenciar labels (ej. "Sesiones (general)" y "Sesiones del curso").

### 11. Filtro de sesiones incluye profesores como alumnos

**Problema**: El dropdown de "Alumno" en la vista de sesiones lista también profesores.
**Fix**: Backend: filtrar por rol `student`. Si es query directa: `WHERE role.name = 'student'`. Si usa RBAC: filtrar usuarios con rol estudiante.

### 12. Catálogo sin paginación

**Archivo**: `apps/web/src/views/Dashboard.tsx` ~249
**Problema**: El backend solo acepta `?q=` (búsqueda textual). No hay `?page=&limit=`. Con 100+ cursos, carga lento.
**Fix**: 
- Backend: agregar query params `page` y `limit` (default 20). Retornar `{ data: [], total: number, page: number }`.
- Frontend: paginación con botones Previous/Next o infinite scroll.

### 13. Tags no visibles en buscador ni búsqueda por tag

**Problema**: Los cursos tienen `tags`/`categories` pero no se muestran como badges en la card de búsqueda, ni hay filtro por tag.
**Fix**: 
- Mostrar badges de tags en la card del curso.
- Backend: aceptar `?tag=` en endpoint de búsqueda.
- Frontend: chips cliqueables para filtrar por tag.

---

## MEDIO: Bugs misceláneos

### 14. Falta logo "Producido por lambdaWorks"

**Archivo**: `apps/web/src/app/layout.tsx`
**Problema**: No existe footer ni branding de lambdaWorks.
**Fix**: Agregar un footer sutil con el logo en el layout principal.

### 15. Nombre del tutor no aparece al completar curso

**Archivo**: `apps/web/src/components/StudentReviewModal.tsx`
**Problema**: Al finalizar, no se muestra quién fue el tutor del curso.
**Fix**: Incluir `course.teacher.name` o `course.teachers[0].name` en los datos y mostrarlo.

### 16. Caja "¿Cómo usar el simulador?" ilegible

**Archivo**: `apps/web/src/views/Dashboard.tsx` ~312-333
**Problema**: `text-xs` con 4 columnas — ilegible.
**Fix**: `text-sm` o `text-base`, máximo 2 columnas. O usar un drawer/modal para contenido completo, con un resumen en la card.

### 17. Botón "Material del curso" no funciona

**Problema**: Puede no ser bug de código — tal vez el curso simplemente no tiene documentos subidos.
**Fix**: Verificar endpoint `GET /courses/:id/materials`. Si funciona pero no hay datos, cambiar UI para mostrar "No hay material disponible" en vez de un botón roto.

### 18. Eye icon en /cursos tira "No se pudo cargar la revisión"

**Problema**: Posiblemente 403 pre-RBAC. Ya podría estar resuelto con el merge de RBAC.
**Fix**: Verificar endpoint de revisión (`GET /courses/:id/review`). Revisar permisos si sigue fallando.

### 19. Legajo no actualiza actividad, muestra simulaciones de más

**Problema**: Query de agregación backend posiblemente incorrecta (JOINs que duplican filas).
**Fix**: Revisar query SQL/Prisma que calcula conteo de simulaciones por alumno. Verificar que no incluya simulaciones de otros cursos o filas duplicadas.

### 20. /terminos no deja volver

**Problema**: Ruta `/terminos` tira 404 o no tiene botón de retorno.
**Fix**: Si la página existe, agregar botón "Volver al dashboard". Si el usuario ya aceptó términos, redirigir automáticamente a `/dashboard`.

---

## Items INCIERTOS (verificar antes de tocar)

Estos dependen de si el RBAC mergeado ya los resolvió. Probar localmente primero:

| # | Item | Qué verificar |
|---|------|---------------|
| 21 | Sesiones de profesores no funcionan | Si es 403, RBAC lo arregla. Si no, revisar query de sesiones filtrando por teacher |
| 22 | Update curso error 403 | `PUT /courses/:id` ya tiene `@Roles('admin','teacher')` y `@Permissions('courses.manage')`. Verificar si RBAC concede el permiso |
| 23 | Duplicar curso error 403 | Mismo endpoint y permisos que update |
| 24 | Eliminación de documentos por student | Verificar guard: `DELETE /documents/:id` debe requerir admin o teacher. El student no debe poder |
| 25 | Estado "Completado" no se actualiza | Backend: verificar si `calendar_status` o campo equivalente se actualiza al completar el curso |
| 26 | Botón "Responder" en simulación | Ya diagnosticado como CRÍTICO 1 — ver arriba |

---

## Items NO incluidos (decisión del PM)

Estos estaban en el documento original de correcciones pero fueron **explícitamente descartados** por el Product Manager. NO implementar:

- "Cuenta no encontrada" en pantalla de login
- Error claro para contraseña incorrecta en login
- Seleccionar rol "Maestro" al registrarse
- Filtrar cursos por tipo de acceso
- Cambio de idioma ES/EN (requiere i18n completo — proyecto aparte)
- Logo de Simuverse (el asset no existe todavía)

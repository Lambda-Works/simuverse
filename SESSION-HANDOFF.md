# Simuverse — Resumen de sesión (2026-07-14)

Branch: `develop`  
Commit: `440ef08` — `feat: prácticas secuenciales, sesiones persistentes y chat OpenAI`  
(ahead de `origin/develop` por 1 commit; push pendiente si se desea)

## Qué es Simuverse
Simulador de prácticas profesionalizantes (profesores + alumnos). Un agente usa system prompt de curso para simular situaciones/tareas definidas en el prompt. Las fichas técnicas del ministerio se pasan a MD (markitdown) y se extraen competencias, KPIs, preguntas, prompt de simulación y coaching. **Evaluaciones se eliminaron del producto.**

## Implementado en este roadmap

### A — Limpieza
- **Sin evaluaciones:** pipeline sin evaluation prompt; nav sin “Evaluaciones”; `POST /evaluate` deshabilitado; UI de scoring removida del visor.
- **employment-axis.md:** se inyecta en runtime en `AIService.buildSystemPrompt()` vía `DeepSeekService.getEmploymentAxis()`.
- **Documentos:** solo nombre + URL (Drive/Dropbox/https). El agente no recibe contenido del archivo.

### B — Sesiones
- Unificadas en `SimulationInstance` (session id = instance id).
- Hot path en memoria; **checkpoint cada 2 min + al cerrar** (`SessionCheckpointService`).
- Persist: turns → `SimulationChatLog`; FSM/triggers → `session_state` JSON.
- Profesor/admin: `/profesor/sesiones`, `/admin/sesiones` → `GET /teacher/sessions` (filtro curso/alumno, logs por hora, TeacherGroup).
- Fix: `GET /simulation-sessions/:id` ahora incluye `summary`; AdminPanel Sesiones usa `TeacherSessionsPage`.

### C — LLM
- **Chat:** OpenAI `gpt-5.4-nano` → DeepSeek → Gemini → scripted.
- **Pipeline fichas técnicas:** solo DeepSeek (nunca OpenAI).
- Env: `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL` en `.env.example`.

### D — Prácticas
- Profesor crea prácticas → `practica-{n}`, dificultad `very_low|low|medium` (muy baja/baja/media).
- Alumno avanza en secuencia; al completar se resume (LLM, sin score) → `practice_summary` → se inyecta como `prior_context` en practica-(n+1).
- ABM: Admin → Prácticas (`PracticesABM`).
- Fallback: si no hay `scenario_type: practice`, se usan escenarios activos del curso (seed legacy).

## Credenciales seed
Password todos: `Admin123!`  
- Alumno: `juan.perez@student.edu`  
- Profesor: `garcia@simuverse.edu`  
- Admin: `admin@simuverse.edu`

## Operativo pendiente
```bash
# Migración (si no corrió)
docker compose exec api-nest npx prisma migrate deploy

# Opcional: re-seed para normalizar scenario_type/agent_key
docker compose exec api-nest npx ts-node src/prisma/seed.ts
```
Setear `OPENAI_API_KEY` (y `DEEPSEEK_API_KEY` para pipeline/fallback).

## Archivos ancla
- Chat/prompt: `apps/api-nest/src/simulations/ai/ai.service.ts`
- Checkpoint: `apps/api-nest/src/simulations/session-checkpoint.service.ts`
- Prácticas: `apps/api-nest/src/simulations/practices.service.ts`
- Teacher sessions: `apps/api-nest/src/simulations/teacher-sessions.controller.ts`
- Pipeline: `apps/api-nest/src/catalog/analysis-pipeline.service.ts`
- Migration: `apps/api-nest/prisma/migrations/20260714_practices_and_session_state/`
- UI alumno: `apps/web/src/views/SimulationPage.tsx`, `Dashboard.tsx`
- UI profesor: `apps/web/src/views/TeacherSessionsPage.tsx`

## Docs
`docs/PROJECT-DOCUMENTATION.md` está parcial/desactualizada (hablaba de evals dinámicas). Preferir código + este resumen.

## No incluido / gaps conocidos
- Push a remote no hecho.
- `prompt.md` local sin commitear.
- E2E multi-práctica limitado (unit tests sí).
- Algunos tests e2e fallan por JWT_SECRET / setup preexistente.
- Dual modelo `Simulation` + `SimulationInstance` aún coexisten (legacy telemetry).

## WIP branch `feature/auth-firebase-cursos-seo` (2026-07-14)
- Firebase Auth option B (ID tokens + Admin verify), reCAPTCHA v2, T&C versionados, auto-inscripción con password de curso, SEO (metadata/sitemap/robots/llms.txt/next/font).
- Migración: `20260714_auth_courses_terms`
- Sin Firebase: `AUTH_TEST_MODE=jwt` o `NODE_ENV=test` mantiene login/register JWT para e2e.
- Script migración usuarios: `npx ts-node src/scripts/migrate-users-to-firebase.ts`

# SimuVerse — Documentación Completa del Proyecto

> **Última actualización**: Julio 2026
> **Para**: Onboarding de desarrolladores e IAs
> **Propósito**: Single source of truth del proyecto — arquitectura, datos, APIs, flujos, y deuda técnica conocida.

---

## 1. Visión General

**SimuVerse** es una plataforma de simulaciones educativas con evaluaciones dinámicas impulsadas por IA. Diseñada para escalar a 40+ cursos de educación profesionalizante bajo el marco del Ministerio de Educación de Santa Fe.

### Stakeholders

| Rol | Qué hace |
|-----|---------|
| **Admin** | Configura cursos, escenarios, fichas técnicas, KPIs, tareas, usuarios |
| **Alumno** | Realiza simulaciones interactivas (chat con IA, emails, documentos, planillas, crisis) |
| **Profesor** | Revisa progreso y sesiones de alumnos asignados |
| **Ministerio** | Audita trazabilidad de actividad, requisitos, y KPIs alcanzados |

### Empresa ficticia del demo
**Administración Las Tradiciones** — servicios administrativos en Rosario. Curso base: "Ofimática Básica para Empleado de Oficina".

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js (App Router, standalone output) | 15.0 |
| **Frontend UI** | React + Tailwind CSS + Radix + shadcn/ui | React 19 |
| **Backend** | NestJS | 10.4 |
| **ORM** | Prisma | 5.22 |
| **Base de datos** | PostgreSQL (Docker) | 15 (dev) / 16 (prod) |
| **Proxy** | Express + http-proxy-middleware | — |
| **AI Principal** | DeepSeek (vía DeepSeekService) | deepseek-v4-flash |
| **AI Auxiliar** | Gemini (Google AI) — fallback histórico | — |
| **Documentos** | Markitdown (Python FastAPI) — PDF/DOCX→Markdown | Python 3.11 |
| **Package manager** | npm (workspaces) | — |
| **Monorepo** | 3 paquetes: `apps/web`, `apps/api-nest`, `proxy` | — |
| **Auth** | JWT (Passport) + bcrypt | @nestjs/jwt 10.2 |
| **Testing** | Jest (backend) + Vitest (frontend) + Cypress (E2E) | — |
| **CI/CD** | GitHub Actions → Lambda Hub autodeploy | — |

---

## 3. Arquitectura del Sistema

### Diagrama conceptual

```
Navegador (Next.js :8080)
        │
        ▼
┌──────────────────────────────────┐
│  Proxy (Express, puerto :5000)   │
│  /api/*  → api-nest:5001         │
│  /*      → web:3000              │
└──────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│  API NestJS (puerto :5001/:5002)             │
│                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │   Auth   │ │Simulations│ │   Catalog    │ │
│  │  (JWT)   │ │(chatbot,  │ │(courses,     │ │
│  │          │ │ crisis,   │ │ scenarios,   │ │
│  │          │ │ sessions) │ │ tech-sheets) │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Ministry │ │  Admin   │ │     RBAC     │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└──────────────────┬───────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
┌─────────┐  ┌──────────┐  ┌───────────┐
│PostgreSQL│  │Markitdown│  │ DeepSeek  │
│  :5432  │  │  :5003   │  │  (API)    │
└─────────┘  └──────────┘  └───────────┘
```

### Estructura del monorepo

```
simuverse-engine/
├── package.json                 # npm workspaces (apps/*, proxy)
├── docker-compose.yml           # Desarrollo (hot reload)
├── docker-compose.prod.yml      # Producción
├── docker-compose.override.yml  # Overrides para dev
├── .env.example
├── .env / .env.local / .env.prod
├── proxy/                       # Express reverse proxy
│   ├── index.ts                 # http-proxy-middleware
│   ├── routes.json              # Configuración de rutas
│   ├── Dockerfile.dev
│   └── Dockerfile.prod
├── apps/
│   ├── web/                     # Next.js 15 (App Router)
│   │   ├── next.config.ts       # output: "standalone"
│   │   ├── Dockerfile.dev
│   │   ├── Dockerfile.prod
│   │   ├── app/                 # Rutas y layouts
│   │   └── src/
│   │       ├── views/           # Componentes de página
│   │       ├── components/      # Componentes reutilizables
│   │       ├── hooks/           # useAuth, etc.
│   │       ├── services/        # ApiClient (Axios)
│   │       └── lib/             # Utilidades
│   └── api-nest/                # NestJS
│       ├── Dockerfile.dev
│       ├── Dockerfile.prod
│       ├── Dockerfile.seed
│       ├── prisma/
│       │   ├── schema.prisma    # 37 modelos, 18 enums
│       │   ├── migrations/
│       │   └── seed*.ts         # 6 scripts de seed
│       └── src/
│           ├── simulations/     # Motor de simulación (core)
│           ├── catalog/         # Cursos, escenarios, pipeline
│           ├── auth/            # JWT + bcrypt
│           ├── users/           # CRUD de usuarios
│           ├── assessments/     # Evaluaciones
│           ├── ministry/        # Requisitos ministeriales
│           ├── admin/           # Panel de administración
│           ├── rbac/            # Roles y permisos
│           └── ...
└── docs/
    ├── demo-plan.md
    └── PROJECT-DOCUMENTATION.md  # Este documento
```

### Docker — Servicios

| Servicio | Dev Port | Prod Port | Descripción |
|----------|----------|-----------|-------------|
| `proxy` | 5000 | 5000 | Reverse proxy (Express) |
| `postgres` | 5433→5432 | 5432 | PostgreSQL + volume persistente |
| `api-nest` | 5002→5001 | 5001 | API NestJS |
| `web` | 8080→3000 | 3000 | Frontend Next.js |
| `markitdown` | 5003→5000 | 5003 | Conversión PDF/DOCX→Markdown |
| `seed` | — | — | Solo prod: corre migraciones + seeds una vez |

---

## 4. Modelo de Datos

### 4.1 Enums (18)

| Enum | Valores |
|------|--------|
| `SimulationStatus` | `not_started`, `active`, `paused`, `completed`, `abandoned` |
| `SimulationInstanceStatus` | `not_started`, `in_progress`, `paused`, `completed`, `failed`, `submitted_for_review` |
| `ActionType` | `calculation`, `document_upload`, `email_read`, `email_reply`, `message_sent`, `decision_made`, `case_submitted`, `case_approved`, `case_rejected`, `system_event`, `crisis_triggered`, `evaluation_completed` |
| `TelemetryActionType` | `user_input`, `system_action`, `ai_response`, `decision`, `error`, `state_change` |
| `Difficulty` | `easy`, `medium`, `hard` |
| `FileType` | `pdf`, `docx`, `xlsx`, `png`, `jpg`, `txt` |
| `RequirementStatus` | `uploaded`, `processing`, `extracted`, `active`, `archived` |
| `TaskType` | `practice`, `evaluation` |
| `TaskStatus` | `pending`, `in_progress`, `completed`, `archived` |
| `NotificationType` | `simulation_completed`, `feedback_received`, `kpi_achieved`, `kpi_failed`, `course_assigned`, `evaluation_ready`, `system_alert` |
| `FileUploadType` | `ministry_requirement`, `scenario_resource`, `student_submission`, `tech_sheet` |
| `DocumentType` | `case`, `contract`, `policy`, `legal`, `procedure`, `other` |
| `ModuleType` | `communication`, `tools`, `documentation`, `assessment` |
| `FamilyType` | `administration`, `rrhh`, `it`, `entrepreneurship` |
| `PromptGenerationMode` | `template`, `manual`, `guided` |
| `TechSheetCompetencyLevel` | `basic`, `intermediate`, `advanced` |
| `TechSheetTaskType` | `practice`, `evaluation` |
| `TechSheetPromptType` | `system`, `evaluation`, `coaching` |
| `AssignmentStatus` | `pending`, `in_progress`, `completed`, `expired` |

### 4.2 Modelos Principales (37)

#### Núcleo de Usuarios

| Modelo | Tabla | Campos clave | Relaciones |
|--------|-------|-------------|------------|
| **User** | `users` | `id` (uuid), `email` (unique), `password_hash`, `name`, `role` (String, default `"student"`), `is_active` | simulations[], instances[], practice_logs[], telemetry_logs[], assessments[], notifications[], file_uploads[] |
| **TeacherGroup** | `teacher_groups` | `id`, `teacher_id`, `student_id`, `created_at` | Planilla plana. Unique(teacher_id, student_id) |
| **AccessRequest** | `access_requests` | `id`, `student_id`, `course_id`, `reason`, `status` (default `"pending"`) | — |

#### Núcleo Académico

| Modelo | Tabla | Campos clave | Relaciones |
|--------|-------|-------------|------------|
| **Course** | `courses` | `id` (uuid), `course_id` (unique), `title`, `description`, `category`, `categories` (Json), `modules` (Json), `ai_config` (Json), `eval_criteria` (Json), `crisis_events` (Json), `simulated_company_id`, `tech_sheet_id`, `is_active` | config (1:1 CourseConfig), simulations[], scenarios[], assessments[], modules[], instances[], ministry_requirements[], kpis[], tasks[], practice_logs[], file_uploads[] |
| **CourseConfig** | `course_config` | `id` (uuid), `course_id` (unique→Course), `config_data` (Json), `base_role` (Text), `course_context` (Text), `personality_traits` (Json), `knowledge_base_prompt` (Text), `active_modules` (Json), `ui_config` (Json), `ia_config` (Json), `family_type` (FamilyType?), `tone`, `language`, `role_behavior` (Text), `chatbot_humano_enabled` (Boolean), `calculator_config` (Json), `inbox_config` (Json) | course (1:1), tech_sheet (optional), prompt_template (optional) |
| **Scenario** | `scenarios` | `id` (uuid), `course_id→Course`, `title`, `description`, `scenario_type`, `categories` (Json), `difficulty` (Difficulty), `content` (Json), `expected_outcomes` (Json), `config` (Json), `is_active` | course, instances[], tasks[] |
| **CourseModule** | `course_modules` | `id` (uuid), `course_id→Course`, `module_id→Module`, `order` | course, module |
| **Module** | `modules` | `id` (uuid), `name`, `type` (ModuleType), `config` (Json) | course_modules[] |
| **CourseDocument** | `course_documents` | `id`, `course_id`, `document_name`, `document_type` (DocumentType), `document_content`, `file_url`, `is_active` | — |

#### Simulación y Sesiones

| Modelo | Tabla | Campos clave | Relaciones |
|--------|-------|-------------|------------|
| **Simulation** | `simulations` | `id` (uuid), `student_id→User`, `course_id→Course`, `status` (SimulationStatus), `current_state` (Json), `progress_percentage`, `score`, `started_at`, `paused_at`, `completed_at`, `updated_at` | user, course, telemetry_logs[], assessments[] |
| **SimulationInstance** | `simulation_instances` | `id` (uuid), `student_id→User`, `scenario_id→Scenario`, `course_id→Course`, `status` (SimulationInstanceStatus), `progress_percentage`, `score` (Float), `feedback`, `time_spent_seconds`, `started_at`, `completed_at` | student, course, scenario, logs[], notifications[] |
| **SimulationChatLog** | `simulation_chat_logs` | `id`, `simulation_instance_id`, `turn_number`, `speaker`, `message` (Text), `is_correct`, `ref_number`, `metadata` (Json), `created_at` | Indexed by simulation_instance_id, ref_number |
| **SimulationEvaluation** | `simulation_evaluations` | `id`, `assignment_id?`, `student_id`, `simulation_id`, `attempt_number`, `kpi_results` (Json), `overall_score` (Decimal), `overall_feedback`, `completion_percentage` (Decimal), `time_spent_seconds`, `responses` (Json), `evaluated_at` | Indexed by student_id, simulation_id |
| **SimulationAssignment** | `simulation_assignments` | `id`, `simulation_id`, `student_id`, `course_id`, `assigned_by`, `start_date`, `end_date`, `max_attempts` (default 1), `status` (AssignmentStatus), `attempts_used` | — |
| **PracticeLogs** | `practice_logs` | `id` (uuid), `student_id→User`, `course_id→Course`, `simulation_instance_id→SimulationInstance?`, `action_type` (ActionType), `description`, `metadata` (Json), `sequence_number`, `integrity_hash` (VarChar 64), `previous_hash`, `timestamp` (BigInt), `docenter_notes` | student, course, instance (optional) |
| **TelemetryLog** | `telemetry_logs` | `id` (uuid), `simulation_id→Simulation`, `user_id→User`, `course_id→Course`, `action`, `action_type` (TelemetryActionType), `response_time_ms`, `metadata` (Json), `integrity_hash` (VarChar 64) | simulation, user, course (Cascade) |

#### Fichas Técnicas y Pipeline

| Modelo | Tabla | Campos clave | Relaciones |
|--------|-------|-------------|------------|
| **TechSheet** | `tech_sheets` | `id`, `name`, `course_id`, `ministry_code`, `description`, `competencies` (Json), `kpi_requirements` (Json), `context_scenario`, `extracted_data` (Json), `file_url`, `processed`, `pipeline_status`, `pipeline_output` (Json) | course_configs[], competencies_rel[], kpis_rel[], tasks_rel[], prompts_rel[] |
| **TechSheetCompetency** | `tech_sheet_competencies` | `id` (uuid), `tech_sheet_id→TechSheet`, `name`, `description`, `level` (TechSheetCompetencyLevel), `category` | tech_sheet (Cascade) |
| **TechSheetKPI** | `tech_sheet_kpis` | `id` (uuid), `tech_sheet_id→TechSheet`, `name`, `description`, `category`, `weight` (Float), `target_value` (Float), `minimum_pass_value` (Float) | tech_sheet (Cascade), tasks[] |
| **TechSheetTask** | `tech_sheet_tasks` | `id` (uuid), `tech_sheet_id→TechSheet`, `kpi_id→TechSheetKPI?`, `type` (TechSheetTaskType), `title`, `description`, `difficulty`, `sequence`, `expected_duration_minutes` | tech_sheet (Cascade), kpi (SetNull) |
| **TechSheetPrompt** | `tech_sheet_prompts` | `id` (uuid), `tech_sheet_id→TechSheet`, `type` (TechSheetPromptType), `content` (Text) | tech_sheet (Cascade). Unique(tech_sheet_id, type) |

#### KPIs, Tareas, Evaluaciones

| Modelo | Tabla | Campos clave | Relaciones |
|--------|-------|-------------|------------|
| **KPI** | `kpis` | `id` (uuid), `course_id→Course`, `ministry_requirement_id→MinistryRequirement?`, `name`, `description`, `category`, `weight` (Decimal), `target_value` (Decimal), `minimum_pass_value` (Decimal, default 80), `thresholds` (Json), `prompt_instruction`, `trigger_event`, `success_criteria`, `is_active` | course (Cascade), ministry_requirement (Cascade), tasks[] |
| **Task** | `tasks` | `id` (uuid), `course_id→Course`, `kpi_id→KPI`, `scenario_id→Scenario?`, `title`, `description`, `type` (TaskType), `sequence_order`, `ai_prompt_config` (Json), `evaluation_criteria` (Json), `status` (TaskStatus), `is_active` | course (Cascade), kpi (Cascade), scenario (SetNull) |
| **MinistryRequirement** | `ministry_requirements` | `id` (uuid), `course_id→Course`, `uploaded_by_id→User?`, `file_name`, `file_type` (FileType), `file_size_bytes` (BigInt), `file_path`, `raw_text`, `extracted_content` (Json), `status` (RequirementStatus), `processing_notes`, `kpis_generated`, `tasks_generated`, `is_active` | course (Cascade), uploaded_by (SetNull), kpis[], file_uploads[] |
| **Assessment** | `assessments` | `id` (uuid), `simulation_id→Simulation`, `user_id→User`, `course_id→Course`, `kpis` (Json), `ai_evaluation`, `recommendation`, `digital_signature`, `feedback` (Json) | simulation, user, course (Cascade) |
| **Notification** | `notifications` | `id` (uuid), `recipient_id→User`, `actor_id→User?`, `simulation_instance_id→SimulationInstance?`, `type` (NotificationType), `title`, `content`, `metadata` (Json), `is_read`, `read_at`, `is_sent` | recipient (Cascade), actor (SetNull), instance (SetNull) |

#### RBAC, Templates, Infraestructura

| Modelo | Tabla | Campos clave | Relaciones |
|--------|-------|-------------|------------|
| **Role** | `roles` | `id`, `name`, `description`, `color`, `is_active` | RBAC — separado del User.role |
| **SystemFunctionality** | `system_functionalities` | `id`, `name`, `description`, `module`, `icon`, `route`, `is_active` | RBAC |
| **RolePermission** | `role_permissions` | `id`, `role_name→Role`, `functionality_id→SystemFunctionality`, `enabled` (Boolean) | Unique(role_name, functionality_id) |
| **FlowTemplate** | `flow_templates` | `id` (VarChar 100), `course_id`, `course_code`, `title`, `family`, `version`, `template_data` (Text), `is_active` | — |
| **PromptTemplate** | `prompt_templates` | `id`, `name`, `description`, `category`, `base_role` (Text), `course_context` (Text), `personality_traits` (Json), `knowledge_base_prompt` (Text), `is_active` | course_configs[] |
| **Endorser** | `endorsers` | `id`, `name`, `short_name`, `logo_url`, `description`, `endorsement_type`, `website`, `is_active` | course_endorsers[] |
| **CourseEndorser** | `course_endorsers` | `id`, `course_id`, `endorser_id` | Unique(course_id, endorser_id) |
| **FoundationConfig** | `foundation_config` | `id`, `name`, `short_name`, `logo_url`, `address`, `city`, `province`, `country`, `phone`, `email`, `website`, `ministry_aval`, `is_active` | — |
| **SimulatedCompany** | `simulated_companies` | `id`, `name` (unique), `short_name`, `description`, `industry`, `logo_url`, `is_fictional`, `city`, `country`, `website`, `is_active` | — |
| **Category** | `categories` | `id`, `name` (unique), `code` (unique), `description`, `is_active` | — |
| **FileUpload** | `file_uploads` | `id` (uuid), `uploaded_by_id→User`, `course_id→Course?`, `ministry_requirement_id→MinistryRequirement?`, `file_name`, `file_type`, `upload_type` (FileUploadType), `file_size_bytes` (BigInt), `file_path`, `file_hash`, `is_active` | uploaded_by (Cascade), course (SetNull), ministry_requirement (Cascade) |

### 4.3 Dos Sistemas de RBAC

⚠️ **Importante**: Hay dos sistemas de roles coexistiendo:

1. **User.role** (String en la tabla `users`): Es un campo plano con valores `"student"`, `"teacher"`, `"admin"`, `"ministerio"`. Es lo que viaja en el JWT y lo que usa el `RolesGuard` para proteger endpoints.

2. **Tablas Role + RolePermission + SystemFunctionality**: Un sistema RBAC completo con permisos granulares por funcionalidad. Está implementado pero **no está vinculado al User.role**. Son dos sistemas independientes.

El `JwtAuthGuard` está registrado como `APP_GUARD` global — todos los endpoints requieren JWT por defecto. Para rutas públicas se usa el decorador `@Public()`.

---

## 5. API — Endpoints Completos

### 5.1 Auth (`/auth`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | Público (throttled: 5/min) | Login JWT → access_token (1h) + refresh_token (7d) |
| POST | `/auth/register` | Público (throttled: 3/min) | Registro de usuario 🔶 **Bug: retorna 500** |
| POST | `/auth/refresh` | Público (throttled: 10/min) | Refrescar token |
| GET | `/auth/me` | JWT | Perfil del usuario actual |
| GET | `/auth/profile` | JWT | Alias de /me |

### 5.2 Users (`/users`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/users` | JWT | Listar (?role=) |
| GET | `/users/all` | Público | Listar todos |
| POST | `/users/create` | JWT | Crear usuario (bcrypt hash) |
| GET | `/users/:id` | JWT | Obtener (alumnos solo self) |
| PUT | `/users/:id` | JWT | Actualizar (alumnos solo self) |
| DELETE | `/users/:id` | JWT | Soft-deactivate |
| PUT | `/users/:id/reactivate` | JWT | Reactivar |

### 5.3 Courses (`/courses`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/courses` | — | Listar (?is_active=) |
| GET | `/courses/:courseId` | — | Obtener curso |
| POST | `/courses` | — | Crear |
| PUT | `/courses/:id` | — | Actualizar |
| DELETE | `/courses/:id` | — | Soft-delete 🔶 **Bug: no hay hard-delete** |

### 5.4 Simulations (`/simulations`) — Core del producto

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/simulations/start` | JWT | Iniciar simulación (userId del token) |
| GET | `/simulations` | JWT | Listar (teacher/admin/ministerio) |
| GET | `/simulations/user/:userId` | JWT | Por usuario (alumnos solo self) |
| GET | `/simulations/course/:courseId` | JWT | Por curso |
| GET | `/simulations/:id` | JWT | Obtener una |
| PUT | `/simulations/:id/pause` | JWT | Pausar |
| PUT | `/simulations/:id/resume` | JWT | Reanudar |
| PUT | `/simulations/:id/complete` | JWT | Completar |
| PUT | `/simulations/:id/abandon` | JWT | Abandonar |
| POST | `/simulations/instances/start` | JWT | Iniciar instancia de simulación |
| GET | `/simulations/:id/emails` | JWT | Emails del escenario |
| GET | `/simulations/:id/documents` | JWT | Documentos del curso |
| GET | `/simulations/:id/spreadsheet` | JWT | Planilla de cálculo |
| GET | `/simulations/:id/logs` | JWT | 🔶 **Stub — retorna []** |
| **POST** | **`/simulations/:id/message`** | **JWT** | **Chat con IA (chatbot humano o legacy)** |
| POST | `/simulations/:id/crisis/get` | JWT | Obtener/activar crisis |
| POST | `/simulations/:id/crisis/resolve` | JWT | Resolver crisis |
| POST | `/simulations/:id/evaluate` | JWT | 🔶 **Stub — retorna {score:0, passed:false}** |
| GET | `/simulations/admin/:instanceId/history` | JWT + Roles(admin,teacher) | Historial de chat para revisión |
| GET | `/simulations/:id/messages` | JWT | Historial desde caché/DB |

### 5.5 Assessments (`/assessments`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/assessments` | JWT | Listar (?course_id, ?user_id; alumnos filtran self) |
| GET | `/assessments/simulation/:simulationId` | JWT | Por simulación |
| GET | `/assessments/:id` | JWT | Obtener |
| POST | `/assessments` | JWT | Crear |
| GET | `/assessments/:id/verify` | JWT | Verificar firma digital |

### 5.6 Catalog (Múltiples controladores)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| CRUD | `/categories`, `/categories/:id` | JWT | Categorías |
| CRUD | `/tech-sheets`, `/tech-sheets/:id` | JWT | Fichas técnicas |
| GET | `/tech-sheets/valid/list` | JWT | Fichas válidas |
| POST | `/tech-sheets/:id/analyze` | JWT | Pipeline de análisis IA |
| CRUD | `/documents`, `/documents/:id` | JWT | Documentos de curso |
| CRUD | `/assignments`, `/assignments/:id` | JWT | Asignaciones de simulación |
| GET | `/student-assignments/:studentId` | JWT | Asignaciones enriquecidas |
| GET | `/evaluations/student/all` | JWT | Evaluaciones (?course_id, ?student_id) |
| GET | `/evaluations/:simulationId` | JWT | Evaluación por simulación |
| GET | `/students/:studentId/history` | JWT | Historial de alumno |
| CRUD | `/simulated-companies` | JWT | Empresas simuladas |
| CRUD | `/foundation-config` | JWT | Config de fundación |
| CRUD | `/endorsers` | JWT | Avaladores |
| CRUD | `/course-endorsers` | JWT | Vínculos curso-avalador |
| GET | `/legajo/students` | JWT | Todos los alumnos con stats |
| GET | `/legajo/:userId` | JWT | Legajo detallado |
| GET | `/simulation-sessions` | JWT | Instancias con stats de chat |
| GET | `/simulation-sessions/ref/:ref` | JWT | Por ref_number |
| GET | `/simulation-sessions/:id` | JWT | Detalle de instancia + logs + evaluación |
| GET | `/certificates/:id` | JWT | 🔶 Stub de certificado |
| POST | `/certificates/send-email` | JWT | 🔶 Stub de envío |

### 5.7 Ministry, Files, Notifications, RBAC, Admin

| Módulo | Endpoints | Auth |
|--------|-----------|------|
| **Ministry** | CRUD `/ministry/requirements`, `/ministry/kpis` | JWT |
| **Files** | Upload/Download/CRUD `/files` | JWT |
| **Notifications** | CRUD `/notifications` + mark-read | JWT |
| **RBAC** | CRUD `/roles`, `/functionalities`, `/permissions` | JWT |
| **Admin** | `/admin/stats`, `/admin/access-requests` | JWT |
| **Student Review** | `/student-review/:instanceId` | JWT |
| **Health** | `/api/health` | Público |

---

## 6. Frontend — Estructura y Rutas

### 6.1 Árbol de rutas (App Router)

```
app/
├── layout.tsx                     # Root: metadata, providers
├── providers.tsx                  # QueryClient → Auth → Tooltip → Inactivity → Sonner
├── page.tsx                       # Home → redirect según auth
├── globals.css
├── not-found.tsx
├── auth/
│   └── page.tsx                   # Login/Register (Auth.tsx)
├── simulation/
│   └── [courseId]/
│       └── page.tsx               # Simulación (SimulationPage.tsx)
├── certificate/
│   └── page.tsx                   # Vista de certificado
├── clear-auth/                    # Debug: limpiar auth
├── debug-auth/                    # Debug: mostrar estado auth
└── (authenticated)/               # Route group — sidebar layout
    ├── layout.tsx                 # SidebarProvider + AppSidebar
    ├── estudiante/
    │   ├── layout.tsx
    │   └── cursos/
    │       └── page.tsx           # Dashboard alumno
    ├── profesor/
    │   ├── layout.tsx
    │   ├── cursos/
    │   │   └── page.tsx           # Dashboard profesor
    │   ├── evaluaciones/
    │   │   └── page.tsx           # Revisión de evaluaciones
    │   └── legajos/
    │       └── page.tsx           # Legajos de alumnos
    ├── admin/
    │   ├── layout.tsx
    │   ├── page.tsx               # AdminDashboard
    │   ├── [tab]/
    │   │   └── page.tsx           # Panel con tabs (CRUD)
    │   ├── evaluaciones/
    │   ├── legajos/
    │   └── mis-cursos/
    ├── evaluations/
    │   └── page.tsx               # EvaluationsPage (compartida)
    ├── legajos/
    │   └── page.tsx               # LegajosPage (compartida)
    ├── student-ledger/
    │   └── [userId]/
    │       └── page.tsx           # Legajo individual
    └── ministerio/
        ├── layout.tsx
        ├── page.tsx               # MinisterioDashboard
        ├── admin/
        ├── evaluaciones/
        └── legajos/
```

### 6.2 Componentes principales (`src/views/`)

| Vista | Descripción |
|-------|-------------|
| `SimulationPage.tsx` | Interfaz de simulación: chat IA, emails, documentos, planilla, crisis |
| `Dashboard.tsx` | Dashboard con contenido según rol |
| `EvaluationsPage.tsx` | Resultados y revisión de evaluaciones |
| `LegajosPage.tsx` | Listado de legajos de alumnos |
| `StudentLedger.tsx` | Detalle individual de legajo |
| `AdminPanel.tsx` | Paneles CRUD del admin |
| `AdminDashboard.tsx` | Estadísticas del admin |
| `MinisterioDashboard.tsx` | Dashboard de auditoría |
| `Auth.tsx` | Formulario login/registro |
| `StudentReviewModal.tsx` | Modal de revisión con tabs: Diálogo, Errores, KPIs |

### 6.3 Auth — Flujo completo

**`useAuth` hook** (`src/hooks/useAuth.tsx`):
- **Storage**: `sessionStorage` para tokens + datos de usuario
- **Roles**: `'student' | 'teacher' | 'admin' | 'ministerio'`
- **AuthUser**: `{id, email, name, role}`
- **Demo mode**: Se activa con `NEXT_PUBLIC_DEMO_MODE=true` o hostname con `vercel.app` → auto-login como admin
- **Cross-tab sync**: Escucha evento `storage` + custom `authChangeEvent`
- **signOut()**: Limpia sessionStorage, redirige a `/auth`

**⚠️ Inconsistencia**: `auth-fetch.ts` (`src/lib/auth-fetch.ts`) lee el token de `localStorage`, pero `useAuth.tsx` y `ApiClient.ts` usan `sessionStorage`. Esto puede causar bugs de auth en llamadas fetch directas.

**ApiClient** (`src/services/ApiClient.ts`):
- Axios con base URL de `NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api`)
- Timeout: 30s
- Interceptor JWT: inyecta token en cada request
- Auto-refresh: en 401, llama `POST /auth/refresh`, encola requests concurrentes, actualiza sessionStorage, retry
- Demo mode: intercepta TODOS los requests → `demoData` handler local

### 6.4 Provider Stack

```
QueryClientProvider (React Query)
  → AuthProvider (JWT context)
    → TooltipProvider (shadcn/ui)
      → InactivityProvider (auto-logout)
        → Sonner (toasts)
          → SidebarProvider + AppSidebar (layout autenticado)
            → SidebarHeaderProvider + AdminReadOnlyProvider (contexto)
```

---

## 7. Flujos de Negocio Principales

### 7.1 Chatbot de Simulación — `POST /simulations/:id/message`

Este es el endpoint más complejo del sistema. Flujo completo:

```
1. Feature flag gate
   ├── chatbot_humano_enabled = false → Legacy flow
   │   └── buildSystemPrompt() → sendMessageToGemini() → response
   └── chatbot_humano_enabled = true  → Chatbot Humano flow:

2. Hydrate session memory
   └── sessionMemory.getHistory(id)
       ├── Cache hit → return turns
       └── Cache miss → hydrateFromDb(SimulationChatLog) → cache

3. Check proactive triggers
   └── triggerService.check(id, {scenario, config, state})
       └── Returns: triggeredMessages[] (or empty)

4. Auto-transition conversation state
   └── conversationState.autoTransition(id)
       ├── messageCount >= 2  → greeting → development
       └── messageCount >= 20 → development → closing

5. Build history array for AI
   └── Map ChatTurn[] → [{role: 'user'|'assistant', content}]

6. Build system prompt
   └── aiService.buildSystemPrompt({
        base_role, course_context, knowledge_base,
        personality_traits, tone, language, role_behavior,
        current_state_prompt
     })
   └── Token budget: ~2000 max, priority-based trimming
       ├── Trim student_history first
       ├── Then knowledge_base
       └── Then course_context

7. Send to AI (DeepSeek)
   └── DeepSeekService.sendMessage(message, systemPrompt, history)
   └── Fallback on failure → offline engine
       └── Intent detection → scripted responses in Spanish

8. Prepend trigger messages to AI response

9. Append turns to session memory
   └── sessionMemory.append(id, userTurn)
   └── sessionMemory.append(id, aiTurn)

10. Fire-and-forget persist to DB
    └── asyncPersistence.saveTurn(id, turn)
        └── .then().catch() — errors logged, NEVER thrown

11. Return response
    └── {id, message, response, state, triggers[]}
```

**Servicios involucrados:**
- `SessionMemoryService` — caché de historial (Map en memoria)
- `TriggerService` — disparadores proactivos
- `ConversationStateService` — máquina de estados (FSM en memoria)
- `AIService` — system prompt + llamada DeepSeek + fallback
- `AsyncPersistenceService` — persistencia fire-and-forget a SimulationChatLog

### 7.2 Pipeline de Análisis de Fichas Técnicas (8 pasos)

```
POST /tech-sheets/:id/analyze

1. markitdownClient.convert()       → PDF/DOCX → Markdown (Python)
2. deepseek.validate()              → ¿Es una ficha técnica válida?
3. deepseek.extractCompetencies()   → Extraer competencias (JSON)
4. deepseek.extractKPIs()           → Extraer KPIs (JSON)
5. deepseek.generateQuestions()     → 8-12 preguntas (30-40% MC, 30-40% abiertas, 20-30% T/F)
6. deepseek.createSimulationPrompt()→ System prompt del escenario
7. deepseek.generateEvaluationPrompt() → Criterios de scoring 1-10
8. deepseek.generateCoachingPrompt()   → Prompt socrático para tutoría

Post-pipeline:
├── Validar respuestas JSON, limpiar markdown wrappers
├── Escribir tablas relacionales (TechSheetCompetency, KPI, Task, Prompt)
│   └── Fallo en relacionales NO bloquea — JSONB es el primary store
├── Auto-generar CourseConfig vía AI
│   └── Extraer base_role, course_context, knowledge_base_prompt
└── Atomic upsert en CourseConfig (evita race conditions)
```

### 7.3 Ciclo de Vida de Simulación

```
State machine de Simulation:
  not_started → active ↔ paused
  active       → completed | abandoned
  paused       → active | abandoned
  completed    → (terminal)
  abandoned    → (terminal)

State machine de SimulationInstance (por escenario):
  not_started → in_progress ↔ paused
  in_progress → completed | failed | submitted_for_review
  paused      → in_progress
```

### 7.4 Flujo de Autenticación y Refresco

```
Login:
  POST /auth/login {email, password}
  → bcrypt.compare
  → JWT sign {sub: userId, email, role} → access_token (1h)
  → JWT sign {sub: userId} → refresh_token (7d)
  → Frontend: sessionStorage.setItem('token', access_token)
              sessionStorage.setItem('refreshToken', refresh_token)

Auto-refresh (ApiClient interceptor):
  401 response
  → ¿Ya refrescando? → encolar request
  → POST /auth/refresh {refreshToken}
  → Actualizar sessionStorage
  → dispatchEvent('storage') para sync entre tabs
  → Retry request original con nuevo token
  → ¿Falla refresh? → limpiar auth → redirect /auth
```

---

## 8. Seeds y Datos de Prueba

### 8.1 Scripts de Seed (6 archivos, idempotentes)

| # | Archivo | Qué crea |
|---|---------|----------|
| 1 | `seed.ts` | 7 usuarios (admin, 2 profes, 3 alumnos, 1 ministerio) + empresa "Las Tradiciones" + curso "Ofimática Básica" + escenario + CourseConfig + 2 documentos + asignación y simulación para Juan Pérez |
| 2 | `seed-companies.ts` | 3 empresas (TextilNorte, Conservas Litoral, MetalRos) con 1 curso, 1 escenario, documentos y asignaciones cada una |
| 3 | `seed-demo.ts` | Fundación FEPEI, 3 avaladores, 8 categorías, 4 flow templates, 6 prompts IA, 3 fichas técnicas, 6 notificaciones, 3 grupos prof-alumno, 2 solicitudes de acceso, 2 requisitos ministeriales, 6 KPIs, 4 tareas, 6 módulos |
| 4 | `seed-demo-2.ts` | Asignaciones y simulaciones para María López (2 cursos) y Carlos Soto (2 cursos), 4 archivos subidos, 6 KPIs extra, 4 tareas extra, 4 notificaciones extra, 4 categorías extra |
| 5 | `seed-demo-3.ts` | 2 requisitos ministeriales extra (completa los 4 cursos), 4 KPIs, 4 tareas, grupos Prof. Martínez, 4 archivos extra, flow template emprendimiento, prompt Inversor Ángel, 1 solicitud extra, 3 notificaciones |
| 6 | `seed-review.ts` | 2 SimulationInstances pre-pobladas (Ofimática completada, TextilNorte en progreso), 14 chat turns con is_correct annotations, SimulationEvaluation records |

### 8.2 Credenciales de Prueba

Todos los usuarios usan contraseña: `Admin123!`

| Rol | Email | ID | Cursos |
|-----|-------|-----|--------|
| Admin | `admin@simuverse.edu` | admin-001 | — |
| Profesor | `garcia@simuverse.edu` | prof-001 | 3 alumnos asignados |
| Profesor | `martinez@simuverse.edu` | prof-002 | 2 alumnos asignados |
| Alumno | `juan.perez@student.edu` | stud-001 | 4 cursos |
| Alumno | `maria.lopez@student.edu` | stud-002 | 2 cursos |
| Alumno | `carlos.soto@student.edu` | stud-003 | 2 cursos |
| Ministerio | `control@ministerio.gob` | min-001 | — |

---

## 9. Infraestructura y CI/CD

### 9.1 Docker — Servicios

| Servicio | Imagen | Dev Port | Prod Port | Healthcheck |
|----------|--------|----------|-----------|-------------|
| `proxy` | Express + http-proxy-middleware | 5000 | 5000 | — |
| `postgres` | PostgreSQL 15/16 Alpine | 5433→5432 | 5432 | `pg_isready` |
| `api-nest` | NestJS (Node 22 Alpine) | 5002→5001 | 5001 | `wget /api/health` |
| `markitdown` | Python 3.11 FastAPI | 5003→5000 | 5003→5000 | — |
| `web` | Next.js (standalone/dev) | 8080→3000 | 3000 | — |
| `seed` | Solo prod | — | — | Corre una vez |

### 9.2 Dockerfiles (9 total)

| Archivo | Descripción |
|---------|-------------|
| `docker/Dockerfile.dev` | Imagen base compartida (Node 22 Alpine, npm ci, prisma generate) |
| `apps/api-nest/Dockerfile.prod` | Multi-stage: base→deps→builder→runner. Usuario `nestjs:1001` |
| `apps/api-nest/Dockerfile.seed` | Solo seeds, no levanta servidor |
| `apps/web/Dockerfile.prod` | Multi-stage, standalone output. Usuario `nextjs:1001` |
| `apps/web/Dockerfile.dev` | Dev server |
| `proxy/Dockerfile.prod` | Multi-stage, tsc compile. Usuario `proxyuser:1001` |
| `proxy/Dockerfile.dev` | Dev server |
| `apps/markitdown/Dockerfile` | Python 3.11 slim, uvicorn |

### 9.3 GitHub Actions

**`ci.yml`**:
- `build-dev` (develop): `docker compose up -d --build` + health checks + verify
- `build-prod` (main): `docker compose -f docker-compose.prod.yml up -d --build` + seed wait + health checks

**`deploy.yml`**:
- Trigger: push a `main`
- Auto-bump versión con `github-tag-action` (patch via Conventional Commits)
- POST al Lambda Hub webhook con environment, version, branch
- Rollback automático en el Hub si falla

---

## 10. Problemas Conocidos y Deuda Técnica

### 🔴 CRÍTICO

| # | Problema | Ubicación | Impacto | Abordaje sugerido |
|---|----------|-----------|---------|-------------------|
| 1 | **Sesiones no persistentes** | `SessionMemoryService`, `ConversationStateService`, `AsyncPersistenceService` | Reinicio de server = pérdida total de triggers, estado de conversación, email tracking | Ver sección 10.1 detallada abajo |
| 2 | **Persistencia fire-and-forget sin reintento** | `AsyncPersistenceService.saveTurn()` | Chat logs se pierden silenciosamente si falla la escritura a DB | Dead letter queue o al menos retry con backoff |
| 3 | **Inconsistencia de storage** | `auth-fetch.ts` (localStorage) vs `useAuth.tsx`/`ApiClient.ts` (sessionStorage) | Tokens pueden faltar en llamadas fetch directas | Unificar a sessionStorage |

### 🟠 ALTO

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| 4 | `POST /simulations/:id/evaluate` es un stub | `simulations.controller.ts` | Retorna `{score:0, passed:false}` siempre |
| 5 | `POST /auth/register` retorna 500 | `auth.controller.ts` | No se pueden crear usuarios nuevos vía API |
| 6 | Respuesta de alumno en curso no hace nada | `SimulationPage.tsx` + controller | Flujo de simulación roto |
| 7 | "Ver documento completo" no funciona | `SimulationPage.tsx` | Documentos inaccesibles |
| 8 | "Descargar planilla Excel" no funciona | `SimulationPage.tsx` | Funcionalidad de planillas rota |
| 9 | Cards de cursos: "99 intentos restantes" y "NaN puntos" | `Dashboard.tsx` | Datos incorrectos en UI |
| 10 | Ministerio ve botones duplicados de admin | `MinisterioDashboard.tsx` | Roles y Permisos, Solicitudes visibles sin deber |
| 11 | Sin endpoints de revisión docente | `SimulationInstance.submitted_for_review` sin workflow | Profesores no pueden evaluar sesiones |
| 12 | No hay rutas dedicadas `/estudiante`, `/profesor` | App Router | Rutas usan grupos pero paths no dedicados |

### 🟡 MEDIO

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| 13 | `localhost` hardcodeado en docker-compose | `docker-compose.yml` | No funciona en red externa |
| 14 | Dos sistemas RBAC independientes | `User.role` string vs tablas Role/Permission | Confusión de permisos |
| 15 | `sendMessageToGemini()` llama a DeepSeek | `AIService` | Nombre engañoso — Gemini es solo fallback histórico |
| 16 | CRUD de Calendario no conectado al frontend | Backend existe, frontend no | Funcionalidad invisible |
| 17 | Hard-delete de cursos no implementado | `courses.service.ts` | Solo soft-delete |
| 18 | Ficha médica: no se pueden seleccionar cursos | Admin panel | Selector roto |
| 19 | Logout muestra dashboard residual | Estado de carga | "Loading-Page" visible después de logout |
| 20 | `TeacherGroup` existe pero no se usa | Schema + tabla | Sin endpoints ni lógica de filtrado |
| 21 | Firebase mencionado pero no integrado | `Cosas-que-hacer` #17 | Pendiente |
| 22 | Notificación cuando no hay sesión activa debe cambiar | Frontend | UX confuso |

---

### 10.1 Crisis de Persistencia de Sesiones (DETALLADO)

Este es el problema técnico más grave del proyecto. Documentación completa para quien vaya a resolverlo.

#### Estado actual: qué hay en memoria vs qué se persiste

| Dato | ¿En memoria? | ¿En DB? | ¿Sobrevive restart? |
|------|:-----------:|:-------:|:-------------------:|
| Chat turns (historial) | ✅ SessionMemoryService | ✅ SimulationChatLog | ✅ Parcial (se rehidrata) |
| Trigger cooldowns (`lastTriggerFires`) | ✅ SessionMemoryService | ❌ | ❌ |
| Emails ya disparados (`triggeredEmails`) | ✅ SessionMemoryService | ❌ | ❌ |
| Estado de conversación (greeting/development/milestone/closing) | ✅ ConversationStateService | ❌ | ❌ |
| Contador de mensajes (auto-transition) | ✅ ConversationStateService | ❌ | ❌ |

#### Qué pasa exactamente en un reinicio

1. `SessionMemoryService`: el `Map<string, SessionMemory>` se vacía
2. Al próximo mensaje del alumno: `hydrateFromDb()` carga SOLO los chat turns desde `SimulationChatLog`
3. `triggeredEmails` y `lastTriggerFires` arrancan vacíos → triggers que ya se dispararon pueden volver a dispararse
4. `ConversationStateService`: el `Map<string, ConversationState>` se vacía
5. El alumno vuelve a estado `greeting` sin importar cuánto haya avanzado
6. El chatbot lo saluda de nuevo como si fuera la primera interacción

#### Infraestructura existente que NO está cableada

| Pieza | Estado | Qué falta |
|-------|--------|-----------|
| `SimulationInstance.submitted_for_review` | Enum existe | Sin trigger de envío, sin endpoint |
| `SimulationEvaluation` | Tabla existe | Sin endpoint de anotaciones docentes |
| `TeacherGroup` | Tabla existe | Sin endpoints de consulta/filtrado |
| `PracticeLogs.docenter_notes` | Campo existe | Sin endpoint para escribir |
| `GET admin/:instanceId/history` | Endpoint existe (Roles: admin,teacher) | Sin UI de profesor para listar sesiones |
| `StudentReviewModal` | Componente existe | Solo muestra datos, no permite escribir anotaciones |

#### Qué hay que construir

1. **Modelo `Session` persistente** (o refactorizar `SimulationInstance`):
   - Estado de triggers (`triggeredEmails`, `lastTriggerFires`) → columnas JSONB
   - Estado de conversación (`currentState`, `messageCount`) → columnas
   - Metadata de docente (`reviewStatus`, `teacherNotes`, `reviewedAt`, `reviewedBy`)
   - Checkpoint de reanudación

2. **Persistencia en tiempo real** (reemplazar fire-and-forget):
   - Escribir estado a DB en cada turno (o al menos en cada transición de estado)
   - Reintento con backoff en fallos de escritura
   - Dead letter queue para chat turns

3. **Endpoints de docente**:
   - `GET /teacher/sessions` — listar sesiones de alumnos asignados (usa TeacherGroup)
   - `GET /teacher/sessions/:id` — detalle completo (chat + estado + métricas)
   - `PUT /teacher/sessions/:id/review` — escribir anotaciones
   - `PUT /teacher/sessions/:id/status` — force-pause, reabrir, marcar revisado

4. **Frontend — vistas de docente**:
   - Lista de sesiones de alumnos (filtrable por curso, estado, fecha)
   - Vista de sesión individual con chat replay + anotaciones
   - Modal de revisión con capacidad de escribir feedback

---

## 11. Guía de Desarrollo

### Quick Start

```bash
cp .env.example .env
# Editar .env con valores reales (JWT_SECRET, GEMINI_API_KEY, etc.)
docker compose up -d --build
```

- Web: `http://localhost:8080`
- API (vía proxy): `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

### Variables de Entorno Esenciales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Usuario PostgreSQL | `simuverse` |
| `POSTGRES_PASSWORD` | Password PostgreSQL | — |
| `POSTGRES_DB` | Nombre de BD | `simuverse` |
| `DATABASE_URL` | Connection string Prisma | — |
| `JWT_SECRET` | Secreto JWT | — |
| `NEXT_PUBLIC_API_URL` | URL del API | `http://localhost:5000/api` |
| `GEMINI_API_KEY` | API key de Gemini | — |
| `ASSESSMENT_HMAC_SECRET` | Firma de evaluaciones | — |
| `DEEPSEEK_API_KEY` | API key DeepSeek | — |

### Comandos Útiles

```bash
# Desarrollo (hot reload)
docker compose up -d --build

# Producción
docker compose -f docker-compose.prod.yml up -d --build

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Seeds manuales
docker compose exec api-nest npx ts-node src/prisma/seed.ts
docker compose exec api-nest npx ts-node src/prisma/seed-companies.ts
docker compose exec api-nest npx ts-node src/prisma/seed-demo.ts
docker compose exec api-nest npx ts-node src/prisma/seed-demo-2.ts
docker compose exec api-nest npx ts-node src/prisma/seed-demo-3.ts

# Frontend standalone
npm run dev          # Dev server
npm run build        # Build producción
npm run test         # Vitest
npm run cypress:e2e  # E2E

# Backend standalone
npm run dev:nest      # Hot reload
npm run build:nest    # Compilar
npm run test:nest     # Jest

# Reset completo
docker compose down -v && docker compose up -d --build
```

---

## 12. Roadmap y Pendientes

### Bugs activos (de `Cosas-que-hacer`)

- [ ] Fix `POST /auth/register` — 500 error
- [ ] Fix rutas de dashboard role-specific (`/estudiante`, `/profesor`, `/admin`)
- [ ] Fix cards de cursos ("99 intentos", "NaN puntos")
- [ ] Fix respuesta de alumno en simulación
- [ ] Fix "Ver documento completo"
- [ ] Fix descarga de Excel
- [ ] Fix ministerio viendo botones de admin
- [ ] Fix ficha médica — selector de cursos
- [ ] Fix logout mostrando dashboard residual
- [ ] Conectar CRUD de calendario al frontend
- [ ] Definir alcance de profesor (con PM)
- [ ] Definir acceso a legajo y evaluaciones por rol (con PM)

### Demo Plan — pendientes

- [ ] Endpoint `POST /simulations/:id/crisis` expuesto correctamente
- [ ] Botón de crisis en SimulationPage
- [ ] Verificar flujo profesor: listar alumnos → ver progreso
- [ ] Verificar flujo ministerio: logs de actividad

### Sesiones persistentes — trabajo futuro

- [ ] Diseñar modelo `Session` persistente
- [ ] Migrar `SessionMemoryService` a DB (triggers, estado)
- [ ] Migrar `ConversationStateService` a DB
- [ ] Endpoints de revisión docente
- [ ] Vistas de profesor para sesiones de alumnos
- [ ] Workflow `submitted_for_review → reviewed`

### Integraciones pendientes

- [ ] Firebase
- [ ] Email real (envío, no solo inbox pre-cargado)

---

## Apéndice: Archivos Clave

| Archivo | Rol |
|---------|-----|
| `apps/api-nest/prisma/schema.prisma` | Modelo de datos completo (37 modelos) |
| `apps/api-nest/src/simulations/session-memory.service.ts` | Caché de sesiones en memoria |
| `apps/api-nest/src/simulations/conversation-state.service.ts` | FSM de conversación en memoria |
| `apps/api-nest/src/simulations/async-persistence.service.ts` | Persistencia fire-and-forget |
| `apps/api-nest/src/simulations/simulations.controller.ts` | Controller principal de simulación |
| `apps/api-nest/src/simulations/ai/ai.service.ts` | System prompt + DeepSeek + fallback |
| `apps/api-nest/src/catalog/analysis-pipeline.service.ts` | Pipeline de 8 pasos para fichas técnicas |
| `apps/api-nest/src/auth/auth.service.ts` | JWT + bcrypt |
| `apps/web/src/views/SimulationPage.tsx` | UI de simulación |
| `apps/web/src/views/Dashboard.tsx` | Dashboard con lógica por rol |
| `apps/web/src/hooks/useAuth.tsx` | Contexto de autenticación |
| `apps/web/src/services/ApiClient.ts` | Cliente HTTP con auto-refresh |
| `proxy/index.ts` | Reverse proxy Express |
| `docker-compose.yml` / `docker-compose.prod.yml` | Orquestación de servicios |
| `docs/demo-plan.md` | Plan del demo para el Ministerio |
| `Cosas-que-hacer` | Lista de bugs y pendientes |

# 🏗️ ARQUITECTURA DEL SISTEMA - MSM FEPEI 360

---

## 📡 DIAGRAMA DE FLUJO GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                        🌐 NAVEGADOR WEB                          │
│                   http://localhost:5173                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
        ┌────────────────────┐ ┌────────────────────┐
        │ React Frontend     │ │ WebSockets         │
        │ (src/)             │ │ Real-time logs     │
        └────────────────────┘ └────────────────────┘
                     │                   │
                     └─────────┬─────────┘
                               │
            ◄──────────────────┴──────────────────►
            │  HTTP REST + JSON                   │
            │  http://localhost:5000              │
            │  CORS Enabled                       │
            │                                     │
        ┌───▼──────────────────────────────────┐
        │    🖥️  BACKEND NODEJS/EXPRESS         │
        │     (server/src/)                    │
        │                                      │
        │  ┌──────────────────────────────┐   │
        │  │  API Routes                  │   │
        │  │  - /api/courses              │   │
        │  │  - /api/simulations          │   │
        │  │  - /api/health               │   │
        │  └──────────────────────────────┘   │
        │                │                     │
        │  ┌─────────────▼─────────────────┐  │
        │  │     Services Layer            │  │
        │  │  ┌────────────────────────┐   │  │
        │  │  │ CourseService         │   │  │
        │  │  │ SimulationService     │   │  │
        │  │  │ TelemetryService      │   │  │
        │  │  │ AIService             │   │  │
        │  │  │ RulesEngine           │   │  │
        │  │  └────────────────────────┘   │  │
        │  └──────────────┬──────────────────┘  │
        │                 │                     │
        │  ┌──────────────▼─────────────────┐  │
        │  │  Middleware Stack              │  │
        │  │  ┌────────────────────────┐    │  │
        │  │  │ promptInjectionFilter │    │  │
        │  │  │ rateLimitMiddleware   │    │  │
        │  │  │ auditLoggingMW        │    │  │
        │  │  │ integrityChecker      │    │  │
        │  │  └────────────────────────┘    │  │
        │  └─────────────────────────────────┘  │
        └───┬──────────────────────────────────┘
            │
    ◄───────┼───────┬────────────────┬────────────────►
    │       │       │                │                │
    ▼       ▼       ▼                ▼                ▼
┌───────┐┌──────┐┌──────────┐┌──────────┐┌─────────┐
│MongoDB││Redis ││ Gemini   ││OpenAI   ││ Files   │
│ DB    ││Cache ││ API      ││ API      ││Storage │
└───────┘└──────┘└──────────┘└──────────┘└─────────┘

```

---

## 🎯 FLUJO DE UNA SIMULACIÓN

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ALUMNO ACCEDE AL SISTEMA                                      │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: src/pages/SimulationPage.tsx                       │
│    ├─ Lee courseId de URL                                        │
│    ├─ Llama: GET /api/courses/:courseId                         │
│    └─ Renderiza DynamicInterface con config                     │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND: POST /api/simulations/start                         │
│    ├─ Validación de usuario y curso                             │
│    ├─ Crear documento Simulation en MongoDB                     │
│    ├─ Inicializar telemetría                                    │
│    └─ Retornar simulationId + courseData                        │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND: DynamicInterface renderiza módulos                 │
│    ├─ Lee course.modules: ["email", "chat", "tools", "docs"]   │
│    ├─ Renderiza CommunicationModule (chat)                      │
│    ├─ Renderiza ToolsModule (calculadora)                       │
│    ├─ Renderiza DocumentationModule (archivos)                  │
│    └─ Inicia Timer (elapsedMinutes += 1)                        │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ALUMNO INTERACTÚA: Envía mensaje a IA                        │
│    └─ "Hola, necesito cotizar 50 pólizas..."                   │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND: CommunicationModule.handleSendMessage()            │
│    ├─ POST /api/simulations/:id/message                         │
│    │   { message: "Hola, necesito..." }                         │
│    └─ Espera respuesta de IA                                    │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. BACKEND: AIService.sendMessageToGemini()                     │
│    ├─ buildSystemPrompt():                                      │
│    │   ├─ Lee course.ai_config.base_role                        │
│    │   ├─ Inserta course.ai_config.course_context              │
│    │   ├─ Incluye student_history (últimos 10 mensajes)         │
│    │   └─ Genera SYSTEM_PROMPT dinámico                         │
│    ├─ Llama Gemini API con:                                     │
│    │   ├─ SYSTEM_PROMPT (confidencial)                          │
│    │   ├─ Conversation history                                  │
│    │   └─ Mensaje del alumno                                    │
│    └─ Retorna: { response: "...", usage: {...} }               │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. BACKEND: TelemetryService.logAction()                        │
│    ├─ Crear documento TelemetryLog con:                         │
│    │   ├─ action: "Consulta sobre cotización"                   │
│    │   ├─ action_type: "message"                                │
│    │   ├─ timestamp: NOW                                        │
│    │   ├─ metadata: { tokens: 332, ... }                        │
│    │   └─ integrity_hash: SHA256(sim_id+action+ts)              │
│    ├─ Guardar en MongoDB                                        │
│    └─ Retornar OK                                               │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. FRONTEND: CommunicationModule recibe respuesta               │
│    ├─ Renderiza mensaje del usuario                             │
│    ├─ Renderiza respuesta de IA                                 │
│    ├─ Scroll automático al final                                │
│    └─ Input field listo para nuevo mensaje                      │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. ALUMNO INTERACTÚA: Realiza cálculo                          │
│     └─ Abre ToolsModule, ingresa datos: salario=85000, días=22  │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. FRONTEND: ToolsModule.handleCalculate()                     │
│     ├─ POST /api/simulations/:id/action                         │
│     │   {                                                        │
│     │     action_type: "calculation",                            │
│     │     action_name: "calculate_salary",                       │
│     │     data: { salary: 85000, days: 22 }                      │
│     │   }                                                        │
│     └─ Espera validación del servidor                           │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 12. BACKEND: RulesEngine.validateAction()                       │
│     ├─ Identifica familia: "administracion"                     │
│     ├─ Llama: SalaryLiquidationRules.validate()                 │
│     │   ├─ Verifica datos de entrada                            │
│     │   ├─ Aplica cálculos (salario bruto → neto)               │
│     │   ├─ Valida contra CCT                                    │
│     │   └─ Retorna: { valid: true, result: {...} }             │
│     └─ Registra en telemetría con precisión de cálculo          │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 13. FRONTEND: ToolsModule.Results renderiza                     │
│     └─ Salario neto: $55.929,72 ✓ Validado                      │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼ [Continúa interacción...]
    │
┌─────────────────────────────────────────────────────────────────┐
│ X. SISTEMA DETECTA CRISIS TRIGGER (minuto 10 en ADM3534)        │
│    ├─ elapsedMinutes == 10 && crisis_events[0].trigger_minutes  │
│    ├─ Backend notifica al frontend (polling o WebSocket)        │
│    ├─ Frontend renderiza Alert rojo: "SINIESTRO TOTAL"          │
│    ├─ IA cambia de rol (Advisor → Disaster Manager)             │
│    └─ Telemetría registra: action_type: "crisis"                │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Y. ALUMNO COMPLETA SIMULACIÓN                                   │
│    ├─ Hace clic "Finalizar"                                      │
│    ├─ POST /api/simulations/:id/complete                        │
│    └─ Backend calcula KPIs basado en logs                       │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Z. GENERACIÓN DE REPORTE                                        │
│    ├─ AIService.analyzeStudentPerformance()                     │
│    │   ├─ Lee todos los logs de la simulación                   │
│    │   ├─ Evalúa contra eval_criteria                           │
│    │   ├─ IA genera análisis narrativo                          │
│    │   └─ Calcula puntuación (0-100)                            │
│    ├─ Crear Assessment en MongoDB                               │
│    ├─ Preparar PDF descargable (futuro)                         │
│    └─ Firma digital del Ministerio (futuro)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏢 ESTRUCTURA DE DIRECTORIOS

```
simuverse-engine/
│
├── 📄 LEER.md                        ← Especificaciones originales
├── 📄 README.md                      ← Guía principal
├── 📄 RESUMEN_IMPLEMENTACION.md      ← Este documento
├── 📄 PROXIMOS_PASOS.md              ← Roadmap
├── 📄 TEST_CASES.md                  ← Casos de prueba
├── 📄 ARQUITECTURA.md                ← Este archivo
│
│
├── 📁 server/                        ← 🖥️ BACKEND NODEJS
│   │
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 .env.example               ← Copiar a .env
│   │
│   ├── 📁 src/
│   │   │
│   │   ├── 📄 server.ts              ← Express app (Puerto 5000)
│   │   │
│   │   ├── 📁 config/
│   │   │   ├── 📄 database.ts        ← Conexión MongoDB
│   │   │   └── 📄 env.ts             ← Variables de entorno
│   │   │
│   │   ├── 📁 models/
│   │   │   ├── 📄 Course.ts          ← Schema: Cursos
│   │   │   ├── 📄 Simulation.ts       ← Schema: Simulaciones
│   │   │   ├── 📄 TelemetryLog.ts     ← Schema: Logs de auditoría
│   │   │   ├── 📄 User.ts            ← Schema: Alumnos
│   │   │   └── 📄 Assessment.ts       ← Schema: Evaluaciones
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── 📄 CourseService.ts         ← CRUD de cursos
│   │   │   ├── 📄 SimulationService.ts     ← Gestión de simulaciones
│   │   │   ├── 📄 AIService.ts             ← Gemini API + Prompts
│   │   │   ├── 📄 RulesEngine.ts           ← Validadores por familia
│   │   │   └── 📄 TelemetryService.ts      ← Logging + integridad
│   │   │
│   │   ├── 📁 routes/
│   │   │   ├── 📄 courses.ts              ← GET/POST /api/courses/*
│   │   │   └── 📄 simulations.ts          ← GET/POST /api/simulations/*
│   │   │
│   │   ├── 📁 middleware/
│   │   │   └── 📄 security.ts             ← Filtros + rate limit
│   │   │
│   │   └── 📁 scripts/
│   │       └── 📄 seedDatabase.ts         ← Carga datos iniciales
│   │
│   ├── 📁 data/
│   │   ├── 📄 course-ADM3534-Seguros.json
│   │   ├── 📄 course-ADM5536-Sueldos.json
│   │   ├── 📄 course-RH3657-Oratoria.json
│   │   └── 📄 course-INF28517B-IA.json
│   │
│   └── 📄 README.md                  ← API documentation
│
│
├── 📁 src/                           ← 🎨 FRONTEND REACT
│   │
│   ├── 📄 main.tsx
│   ├── 📄 App.tsx
│   ├── 📄 vite-env.d.ts
│   │
│   ├── 📁 pages/
│   │   ├── 📄 Index.tsx              ← Página de inicio
│   │   ├── 📄 Auth.tsx               ← Login
│   │   ├── 📄 Dashboard.tsx           ← Dashboard de cursos
│   │   ├── 📄 SimulationPage.tsx      ← Simulación en curso
│   │   ├── 📄 AdminPanel.tsx          ← Panel de administrador
│   │   ├── 📄 EvaluationsPage.tsx     ← Reportes
│   │   └── 📄 NotFound.tsx            ← 404
│   │
│   ├── 📁 components/
│   │   ├── 📄 DynamicInterface.tsx    ← 🎯 Main component (900 líneas)
│   │   │                                 ├─ Timer
│   │   │                                 ├─ Progress
│   │   │                                 ├─ Crisis Alert
│   │   │                                 ├─ Dynamic tabs
│   │   │                                 └─ Eval criteria
│   │   │
│   │   ├── 📁 modules/
│   │   │   ├── 📄 CommunicationModule.tsx    ← Chat IA
│   │   │   ├── 📄 ToolsModule.tsx            ← Calculadora + Editor
│   │   │   └── 📄 DocumentationModule.tsx    ← Gestor de archivos
│   │   │
│   │   ├── 📁 ui/
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 dialog.tsx
│   │   │   ├── 📄 tabs.tsx
│   │   │   ├── 📄 alert.tsx
│   │   │   ├── 📄 badge.tsx
│   │   │   └── ... (40+ componentes shadcn/ui)
│   │   │
│   │   └── 📄 NavLink.tsx             ← Navegación
│   │
│   ├── 📁 hooks/
│   │   ├── 📄 useAuth.tsx             ← Autenticación
│   │   ├── 📄 use-toast.ts            ← Notificaciones
│   │   └── 📄 use-mobile.tsx           ← Responsive mobile
│   │
│   ├── 📁 services/
│   │   └── 📄 api.ts                  ← [TODO] API client
│   │
│   ├── 📁 integrations/
│   │   └── 📁 supabase/
│   │       ├── 📄 client.ts
│   │       └── 📄 types.ts
│   │
│   ├── 📁 lib/
│   │   └── 📄 utils.ts
│   │
│   └── 📁 css/
│       ├── 📄 index.css               ← Tailwind + Global styles
│       └── 📄 App.css                 ← Component styles
│
│
├── 📁 public/
│   └── 📄 robots.txt
│
│
├── 📁 supabase/                      ← [FUTURE] Migraciones SQL
│   ├── 📁 functions/
│   │   └── 📁 simulation-chat/
│   │       └── 📄 index.ts            ← Edge functions
│   │
│   ├── 📁 migrations/
│   │   └── 📄 20260305150110...sql
│   │
│   └── 📄 config.toml
│
│
├── 📁 test/
│   ├── 📄 example.test.ts
│   └── 📄 setup.ts
│
│
├── 📄 .gitignore
├── 📄 package.json                   ← Frontend dependencies
├── 📄 tsconfig.json
├── 📄 vite.config.ts
├── 📄 vitest.config.ts
├── 📄 tailwind.config.ts
├── 📄 postcss.config.js
└── 📄 eslint.config.js
```

---

## 🔗 FLUJO DE DATOS: MÁS DETALLE

### Envío de Mensaje (Happy Path)

```
┌──────────────────┐
│  React Frontend  │
│ CommunicationMod │
└────────┬─────────┘
         │
         │ setIsLoading(true)
         │ handleSendMessage("mensaje")
         │
         ▼
┌──────────────────────────────────┐
│ API Call:                        │
│ POST /api/simulations/:id/message│
│ Body: { message: "..." }         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Express Middleware Stack                 │
│ 1. express.json()                        │
│ 2. promptInjectionFilter()                │
│    ├─ ✓ Valida: "Hola, ..."             │
│    └─ ✗ Rechaza: "Ignora instrucciones" │
│ 3. rateLimitMiddleware()                  │
│    └─ ✓ 15/30 mensajes usados            │
│ 4. auditLoggingMiddleware()               │
│    └─ Log: POST /api/simulations/...     │
└────────┬─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ POST /api/simulations/:id/message   │
│ (simulations.ts route handler)      │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ AIService.sendMessageToGemini()  │
│                                  │
│ 1. buildSystemPrompt()           │
│    ├─ base_role: "Auditor..."   │
│    ├─ course_context: "..."      │
│    ├─ student_history: [msgs...] │
│    └─ SYSTEM_PROMPT final        │
│                                  │
│ 2. Fetch to Gemini API           │
│    ├─ Headers: Auth, Content-Type│
│    ├─ Body: {                    │
│    │   "contents": [{            │
│    │     "role": "user",         │
│    │     "parts": [{             │
│    │       "text": "Hola..."     │
│    │     }]                      │
│    │   }],                       │
│    │   "systemInstruction": ... │
│    │ }                           │
│    └─ Timeout: 30s               │
│                                  │
│ 3. Parse Response                │
│    └─ response: "Buenos días..." │
└────────┬───────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ TelemetryService.logAction()     │
│                                  │
│ 1. Create log object:            │
│    {                             │
│      simulation_id: "...",       │
│      user_id: "...",             │
│      action: "Msg: Hola...",     │
│      action_type: "message",     │
│      timestamp: NOW,             │
│      response_time_ms: 245,      │
│      metadata: {                 │
│        tokens: 332,              │
│        roles: ["user","assist"]  │
│      },                          │
│      integrity_hash: SHA256(...)│
│    }                             │
│                                  │
│ 2. Insert en MongoDB             │
│    db.telemetry_logs.insertOne() │
│                                  │
│ 3. Return: OK                    │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────┐
│ API Response 200 OK        │
│ {                          │
│   "response": "Buenos...", │
│   "usage": {               │
│     "prompt_tokens": 245,  │
│     "completion_tokens": 87│
│   },                       │
│   "timestamp": "..."       │
│ }                          │
└────────┬──────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ React Frontend               │
│ setIsLoading(false)          │
│ setMessages([...new message])│
│ scrollToBottom()             │
│ Input focused                │
└──────────────────────────────┘
```

---

## 🎨 ESTRUCTURA DE COMPONENTES REACT

```
App.tsx (Router)
│
├─ Index.tsx
│  └─ Bienvenida + Links
│
├─ Auth.tsx
│  └─ Login form
│
├─ Dashboard.tsx
│  ├─ CourseGrid
│  │  └─ CourseCard[] (4 cursos)
│  └─ CardsContainerSticky
│
├─ SimulationPage.tsx
│  ├─ Parámetros de ruta (courseId)
│  ├─ useEffect: Fetch curso + Crear simulación
│  └─ DynamicInterface (MAIN)
│     │
│     ├─ Header
│     │  ├─ CourseTitle + Family Badge
│     │  ├─ Description
│     │  └─ CourseId
│     │
│     ├─ InfoCards Grid (3 cols responsive)
│     │  ├─ Time Card: Clock icon + Timer
│     │  ├─ Progress Card: Progress bar + %
│     │  └─ Modules Card: Active module count
│     │
│     ├─ CrisisAlert (Conditional)
│     │  ├─ Alert component (rojo si activo)
│     │  └─ Contenido: Crisis event details
│     │
│     ├─ Tabs (Dynamic)
│     │  ├─ Tab 1: CommunicationModule
│     │  │  ├─ ScrollArea (messages)
│     │  │  │  ├─ UserMessage bubble (azul)
│     │  │  │  └─ AssistantMessage bubble (gris)
│     │  │  ├─ Input field
│     │  │  └─ Send button
│     │  │
│     │  ├─ Tab 2: ToolsModule
│     │  │  ├─ Sub-tabs: Calculator | Code | Results
│     │  │  │  ├─ Calculator
│     │  │  │  │  ├─ Input: salary_base
│     │  │  │  │  ├─ Input: days_worked
│     │  │  │  │  ├─ Input: extra_hours
│     │  │  │  │  ├─ Button: Calculate
│     │  │  │  │  └─ Result display
│     │  │  │  │
│     │  │  │  ├─ Code
│     │  │  │  │  ├─ CodeEditor (simple textarea)
│     │  │  │  │  └─ Validate button
│     │  │  │  │
│     │  │  │  └─ Results
│     │  │  │     └─ Table de resultados
│     │  │
│     │  └─ Tab 3: DocumentationModule
│     │     ├─ Dropzone
│     │     │  ├─ Drag/drop area
│     │     │  └─ Upload button
│     │     └─ DocumentList
│     │        ├─ DocumentCard[]
│     │        │  ├─ File icon
│     │        │  ├─ Nombre
│     │        │  ├─ Tamaño
│     │        │  ├─ Badge "Requerido"
│     │        │  └─ Download button
│     │        └─ ScrollArea (400px max)
│     │
│     └─ Evaluation Criteria Display
│        └─ Criteria cards con badges
│
├─ AdminPanel.tsx
│  ├─ ActiveSimulations table
│  ├─ CoursesManager
│  └─ LogsViewer
│
├─ EvaluationsPage.tsx
│  ├─ ReportList[]
│  └─ ReportDetail (PDF export)
│
└─ NotFound.tsx
```

---

## 💾 ESQUEMA DE BASE DE DATOS

```
MongoDB: simuverse_db

┌─────────────────────────────────┐
│ courses (collection)            │
├─────────────────────────────────┤
│ _id: ObjectId                   │
│ course_id: "ADM3534" (unique)   │
│ title: "Asistente en Seguros"   │
│ description: "..."              │
│ family: "administracion"        │  ← Determina RulesEngine
│ modules: ["email", "chat", ...] │  ← DynamicInterface
│ duration_minutes: 30            │
│ is_active: boolean              │
│ ai_config: {                    │
│   base_role: "Auditor...",      │
│   course_context: "...",        │
│   knowledge_base: {...},        │
│   personality_traits: {...}     │
│ }                               │
│ eval_criteria: [{               │
│   name: "Cálculo Prima",        │
│   weight: 0.4,                  │
│   target: "exactitud"           │
│ }, ...]                         │
│ crisis_events: [{               │
│   trigger_minutes: 10,          │
│   event_name: "Siniestro",      │
│   severity: "crítico"           │
│ }, ...]                         │
│ config_specific: {              │  ← JSON custom por familia
│   email_templates: [...],       │
│   scenarios: [...]              │
│ }                               │
│                                 │
│ Index: (course_id, is_active)   │
│ Index: (family)                 │
└─────────────────────────────────┘

┌──────────────────────────────┐
│ simulations (collection)      │
├──────────────────────────────┤
│ _id: ObjectId                │
│ user_id: "alumno_123"        │
│ course_id: "ADM3534"         │
│ status: "in-progress"        │  ← not-started|in-progress|...
│ progress: 45                 │  ← 0-100%
│ scenario_id: "scenario_1"    │
│ started_at: Date             │
│ paused_at: Date (optional)   │
│ completed_at: Date (optional)│
│ total_duration_minutes: 30   │
│ current_state: {             │
│   elapsedMinutes: 8.5,       │
│   crisis_triggered: false,   │
│   last_message_id: "msg_42"  │
│ }                            │
│                              │
│ Index: (user_id, course_id)  │
│ Index: (status)              │
│ Index: (started_at)          │
└──────────────────────────────┘

┌──────────────────────────────┐
│ telemetry_logs (collection)   │
├──────────────────────────────┤
│ _id: ObjectId                │
│ simulation_id: FK            │
│ user_id: "alumno_123"        │
│ course_id: "ADM3534"         │
│ action: "Calculó prima..."   │  ← Descripción legible
│ action_type: "calculation"   │  ← Enum
│ timestamp: Date              │  ← Append-only
│ response_time_ms: 245        │
│ integrity_hash: "a1b2c3..."  │  ← SHA256
│ metadata: {                  │
│   base_salary: 85000,        │
│   result: 55929.72,          │
│   validation: "success",     │
│   ...                        │
│ }                            │
│                              │
│ Index: (simulation_id, ts)   │
│ Index: (user_id, course_id)  │
│ Index: (action_type)         │
└──────────────────────────────┘

┌──────────────────────────────┐
│ users (collection)           │
├──────────────────────────────┤
│ _id: ObjectId                │
│ user_id: "alumno_123"        │
│ email: "alumno@uni.ar"       │
│ name: "Juan Pérez"           │
│ role: "student"              │  ← student|admin|teacher
│ institution: "UTN"           │
│ created_at: Date             │
│ updated_at: Date             │
└──────────────────────────────┘

┌──────────────────────────────┐
│ assessments (collection)      │
├──────────────────────────────┤
│ _id: ObjectId                │
│ simulation_id: FK            │
│ user_id: FK                  │
│ course_id: FK                │
│ completed_at: Date           │
│ kpis: {                      │
│   final_score: 87.5,         │
│   calculation_accuracy: 0.95, │
│   decision_quality: 0.82,    │
│   compliance: 1.0            │
│ }                            │
│ ai_evaluation: "Muy bien..." │  ← Análisis narrativo
│ recommendation: "Aprobar"    │
│ digital_signature: "..."     │  ← Firma Ministerial
└──────────────────────────────┘
```

---

## 🔐 SEGURIDAD: CAPAS

```
┌─────────────────────────────────────────────┐
│ 1. CORS (Express)                           │
│    └─ Origen: FRONTEND_URL env              │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ 2. Rate Limiting Middleware                 │
│    ├─ Max: 30 requests/min                  │
│    ├─ Storage: Memory cache con timestamp   │
│    └─ Response: 429 Too Many Requests       │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ 3. Prompt Injection Filter                  │
│    ├─ Input: message text                   │
│    ├─ Patterns: /ignora/, /forget/, /actúa/│
│    └─ Response: "Entrada no permitida"      │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ 4. Input Validation                         │
│    ├─ Tipos: courseId, userId, etc         │
│    ├─ Longitud máxima                       │
│    └─ Caracteres permitidos                 │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ 5. Audit Logging Middleware                 │
│    ├─ Log: All requests + responses         │
│    ├─ Storage: MongoDB telemetry_logs       │
│    └─ Info: User, action, timestamp, result │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ 6. Integrity Hashing                        │
│    ├─ Hash: SHA256(simId + action + ts)     │
│    ├─ Storage: En cada log                  │
│    └─ Verificación: Prevents tampering      │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ 7. Prompt Isolation (Backend Only)          │
│    ├─ System Prompt: NUNCA enviado al user  │
│    ├─ Storage: Solo en backend RAM          │
│    └─ Response: Solo mensaje de IA          │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ 8. MongoDB Authorization                    │
│    ├─ Collection: telemetry_logs append-only│
│    ├─ No delete/update permitido            │
│    └─ Audits: Immutable records             │
└─────────────────────────────────────────────┘
```

---

## 📊 FLUJO DE IA (System Prompt Factory)

```
Input: Mensaje del alumno
         │
         ▼
┌──────────────────────────────────────┐
│ AIService.buildSystemPrompt()        │
│                                      │
│ Inputs:                              │
│  ├─ course.ai_config.base_role:      │
│  │  "Eres auditor técnico..."        │
│  │                                   │
│  ├─ course.ai_config.course_context: │
│  │  "Dominio: Seguros de vida..."    │
│  │                                   │
│  ├─ course.ai_config.personality:    │
│  │  ├─ tone: "formal"                │
│  │  ├─ strictness: 8/10              │
│  │  └─ patience: 6/10                │
│  │                                   │
│  ├─ student_history (últimos 10):    │
│  │  ├─ msg1: "Hola"                  │
│  │  ├─ resp1: "Buenos días..."       │
│  │  └─ ...                           │
│  │                                   │
│  └─ Contexto actual:                 │
│     ├─ elapsed_minutes: 8.5          │
│     └─ crisis_active: false          │
│                                      │
│ Output: SYSTEM_PROMPT dinámico:      │
│ "Eres auditor técnico. El alumno     │
│  está en minuto 8.5. Dominio:        │
│  Seguros. Sé formal pero paciente..."│
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ POST to Gemini API                   │
│                                      │
│ {                                    │
│   "system": SYSTEM_PROMPT,           │
│   "messages": [                      │
│     {"role": "user", ...},           │
│     {"role": "assistant", ...},      │
│     ...                              │
│     {"role": "user",                 │
│      "content": "nuevo mensaje"}     │
│   ]                                  │
│ }                                    │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Gemini Response                      │
│ {                                    │
│   "content": "Buenos días, veo que..│
│   "usage": {                         │
│     "prompt_tokens": 450,            │
│     "completion_tokens": 120         │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Log en TelemetryService              │
│ ├─ action: "Mensaje de IA"           │
│ ├─ tokens_used: 570                  │
│ ├─ response_time: 245ms              │
│ ├─ integrity_hash: SHA256(...)       │
│ └─ metadata: { ... }                 │
└──────────────────────────────────────┘
         │
         ▼
Output: Response enviada al frontend
```

---

## 🎯 CÓMO AGREGAR NUEVO CURSO

### Paso 1: Crear JSON de configuración

```json
// server/data/course-COD2345-NuevoNombre.json
{
  "course_id": "COD2345",
  "title": "Nuevo Curso",
  "family": "administracion",
  "modules": ["chat_ia", "documentos"],
  "ai_config": {
    "base_role": "Eres especialista en...",
    "course_context": "Dominio: ...",
    "personality_traits": { ... }
  },
  "eval_criteria": [ ... ],
  "crisis_events": [ ... ]
}
```

### Paso 2: Ejecutar seed

```bash
npm run seed
```

### Paso 3: Agregar validador al RulesEngine (si necesario)

```typescript
// src/services/RulesEngine.ts
case 'administracion':
  return new CustomRules().validate(action);
```

### Paso 4: ¡Listo! DynamicInterface se adapta automáticamente

No necesitas modificar React code.

---

**Documento**: ARQUITECTURA.md  
**Versión**: 2.0.0  
**Fecha**: 5 de Marzo de 2026

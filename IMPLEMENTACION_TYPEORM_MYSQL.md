# 📋 IMPLEMENTACIÓN TYPEORM + MYSQL/MARIADB

## Resumen de cambios realizados

Este documento describe todos los cambios implementados para migrar de **MongoDB + Supabase** a **MySQL/MariaDB + TypeORM + JWT**.

---

## 1️⃣ DEPENDENCIAS ACTUALIZADAS

### Archivo: `server/package.json`

**Reemplazado:**
- ❌ `mongoose` (MongoDB ODM)
- ❌ `express-cors` 
- ❌ `bcryptjs` (versión antigua)

**Agregado:**
- ✅ `typeorm` (v0.3.17) - ORM para MySQL/MariaDB
- ✅ `mysql2` (v3.6.0) - Driver MySQL
- ✅ `reflect-metadata` (v0.1.13) - Requerido por TypeORM
- ✅ `cors` (v2.8.5) - CORS moderno
- ✅ `bcrypt` (v5.1.1) - Hash de contraseñas seguro
- ✅ `@types/bcrypt` - Tipos TypeScript para bcrypt
- ✅ `@types/jsonwebtoken` - Tipos TypeScript para JWT

---

## 2️⃣ ENTITIES CREADAS (TypeORM)

### 2.1 User.ts
**Ubicación:** `server/src/entities/User.ts`

```typescript
- id: UUID (Primary Key)
- email: VARCHAR(255) - UNIQUE
- password_hash: VARCHAR(255) - bcrypt hash
- name: VARCHAR(255)
- role: ENUM (student|teacher|admin)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_login: TIMESTAMP (nullable)

Relations:
- oneToMany: simulations
- oneToMany: telemetry_logs
- oneToMany: assessments
```

### 2.2 Course.ts
**Ubicación:** `server/src/entities/Course.ts`

```typescript
- id: UUID (Primary Key)
- course_id: VARCHAR(100) - UNIQUE
- title: VARCHAR(255)
- description: TEXT
- family: VARCHAR(100)
- duration_minutes: INT
- is_active: BOOLEAN
- ai_config: JSON
- eval_criteria: JSON
- crisis_events: JSON
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Relations:
- oneToMany: simulations
- manyToMany: modules
- oneToMany: course_modules
- oneToMany: telemetry_logs
- oneToMany: assessments
```

### 2.3 Simulation.ts
**Ubicación:** `server/src/entities/Simulation.ts`

```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- course_id: UUID (Foreign Key → courses)
- status: ENUM (not_started|in_progress|paused|completed|abandoned)
- current_state: JSON
- progress_percentage: INT
- started_at: TIMESTAMP
- paused_at: TIMESTAMP (nullable)
- completed_at: TIMESTAMP (nullable)
- updated_at: TIMESTAMP

Relations:
- manyToOne: user
- manyToOne: course
- oneToMany: telemetry_logs (cascade delete)
- oneToMany: assessments
```

### 2.4 Module.ts
**Ubicación:** `server/src/entities/Module.ts`

```typescript
- id: UUID (Primary Key)
- name: VARCHAR(255)
- type: ENUM (communication|tools|documentation|assessment)
- config: JSON
- created_at: TIMESTAMP

Relations:
- manyToMany: courses (via course_modules)
```

### 2.5 CourseModule.ts
**Ubicación:** `server/src/entities/CourseModule.ts`

```typescript
- id: UUID (Primary Key)
- course_id: UUID (Foreign Key)
- module_id: UUID (Foreign Key)
- order: INT (default: 0)
- created_at: TIMESTAMP

Relations:
- manyToOne: course
- manyToOne: module
```

### 2.6 TelemetryLog.ts
**Ubicación:** `server/src/entities/TelemetryLog.ts`

```typescript
- id: UUID (Primary Key)
- simulation_id: UUID (Foreign Key)
- user_id: UUID (Foreign Key)
- course_id: UUID (Foreign Key)
- action: VARCHAR(255)
- action_type: ENUM (user_input|system_action|ai_response|decision|error|state_change)
- created_at: TIMESTAMP(3) - Para precisión de milisegundos
- response_time_ms: INT
- metadata: JSON
- integrity_hash: VARCHAR(64) - SHA-256 hash

Relations:
- manyToOne: simulation
- manyToOne: user
- manyToOne: course

IMPORTANTE: Tabla append-only - NO SE ACTUALIZA, solo INSERT
```

### 2.7 Assessment.ts
**Ubicación:** `server/src/entities/Assessment.ts`

```typescript
- id: UUID (Primary Key)
- simulation_id: UUID (Foreign Key)
- user_id: UUID (Foreign Key)
- course_id: UUID (Foreign Key)
- created_at: TIMESTAMP
- completed_at: TIMESTAMP (nullable)
- kpis: JSON
- ai_evaluation: LONGTEXT
- recommendation: LONGTEXT
- feedback: JSON
- digital_signature: VARCHAR(64) - HMAC-SHA256

Relations:
- manyToOne: simulation
- manyToOne: user
- manyToOne: course
```

---

## 3️⃣ SERVICIOS CREADOS/ACTUALIZADOS

### 3.1 AuthService.ts
**Ubicación:** `server/src/services/AuthService.ts`

**Métodos:**
- `register(payload)` - Registrar usuario con bcrypt
- `login(payload)` - Login con JWT token
- `verifyToken(token)` - Validar JWT
- `refreshAccessToken(refreshToken)` - Renovar token

**Seguridad:**
- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT tokens: 15 min acceso, 7 días refresh
- No se retorna password_hash en respuestas

### 3.2 UserService.ts
**Ubicación:** `server/src/services/UserService.ts`

**Métodos:**
- `getUserById(id)` - Obtener usuario por ID
- `getUserByEmail(email)` - Obtener usuario por email
- `updateUser(id, updates)` - Actualizar usuario (RLS: self o admin)
- `listUsers(role?)` - Listar usuarios (RLS: admin only)
- `listActiveUsers()` - Listar usuarios activos
- `deactivateUser(id)` - Desactivar usuario
- `activateUser(id)` - Activar usuario
- `deleteUser(id)` - Eliminar usuario
- `getTeachers()` - Listar profesores activos
- `getStudents()` - Listar estudiantes activos

---

## 4️⃣ MIDDLEWARE CREADO

### 4.1 auth.ts
**Ubicación:** `server/src/middleware/auth.ts`

**Middleware:**
- `authMiddleware` - Valida JWT, requiere token en Authorization header
- `optionalAuthMiddleware` - JWT opcional, continúa sin usuario si no valida

**Formato:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 authorization.ts
**Ubicación:** `server/src/middleware/authorization.ts`

**Middleware RLS (Row Level Security):**
- `isAdmin()` - Solo admins
- `isSelfOrAdmin()` - Solo acceso a datos propios o admin
- `canAccessSimulation()` - RLS: propietario de simulación o admin
- `canAccessCourse()` - RLS: acceso a cursos (todos los autenticados)
- `isTeacher()` - Solo profesores y admins
- `isStudent()` - Solo estudiantes y admins

---

## 5️⃣ RUTAS CREADAS

### 5.1 auth.ts (Rutas)
**Ubicación:** `server/src/routes/auth.ts`

**Endpoints públicos:**
```
POST   /api/auth/register
  - body: { email, password, name, role? }
  - response: { user, token }

POST   /api/auth/login
  - body: { email, password }
  - response: { user, token, refreshToken }

POST   /api/auth/refresh
  - body: { refreshToken }
  - response: { token, refreshToken }
```

**Endpoints protegidos:**
```
POST   /api/auth/logout
  - headers: Authorization: Bearer <token>
  - response: { message }

GET    /api/auth/me
  - headers: Authorization: Bearer <token>
  - response: { user }

PUT    /api/auth/profile
  - headers: Authorization: Bearer <token>
  - body: { name? }
  - response: { user }
```

---

## 6️⃣ CONFIGURACIÓN BASE DE DATOS

### 6.1 connection.ts
**Ubicación:** `server/src/database/connection.ts`

Configura TypeORM con:
- Driver: MySQL
- Host, puerto, usuario, contraseña desde .env
- Entities registradas
- Migrations habilitadas
- Logging en desarrollo

### 6.2 InitialMigration.ts
**Ubicación:** `server/src/database/migrations/1703000000000-InitialMigration.ts`

**Crea todas las tablas:**
- users (con índices)
- courses (con índices)
- modules (con índices)
- course_modules (junction table)
- simulations (con índices)
- telemetry_logs (append-only)
- assessments (con índices)

**Características:**
- Foreign keys con CASCADE delete
- Índices en columnas frecuentes
- UTF8MB4 character set
- InnoDB engine

---

## 7️⃣ SCRIPTS Y CONFIGURACIÓN

### 7.1 .env.example
**Actualizado con:**
```
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME

JWT_SECRET
JWT_EXPIRY
REFRESH_TOKEN_EXPIRY

CORS_ORIGIN

GEMINI_API_KEY
OPENAI_API_KEY
```

### 7.2 setup.sh
**Script de instalación que:**
1. Verifica .env
2. Prueba conexión a MySQL
3. Crea la base de datos
4. Instala dependencias
5. Ejecuta migraciones
6. Seed de datos iniciales
7. Build de TypeScript

### 7.3 seedDatabase.ts
**Crea datos iniciales:**
- 3 usuarios de prueba (admin, teacher, student)
- 4 módulos (Communication, Tools, Documentation, Assessment)
- 4 cursos cargados de JSON
- Enlaces entre cursos y módulos

---

## 8️⃣ ACTUALIZAR SERVER.TS EXISTENTE

### Paso 1: Imports
```typescript
import 'reflect-metadata'; // NUEVO - Requerido por TypeORM
import { initializeDatabase, AppDataSource } from './database/connection'; // NUEVO
import { createAuthRoutes } from './routes/auth'; // NUEVO
import { authMiddleware } from './middleware/auth'; // NUEVO
import cors from 'cors'; // ACTUALIZADO - ahora es la librería real
```

### Paso 2: Middleware de base de datos
```typescript
// Antes de cualquier ruta
const initDb = async (req, res, next) => {
  if (!isDbInitialized) {
    await initializeDatabase();
    isDbInitialized = true;
  }
  next();
};
app.use(initDb);
```

### Paso 3: Registrar rutas de auth
```typescript
app.use('/api/auth', createAuthRoutes());
```

### Paso 4: Proteger rutas existentes
```typescript
app.get('/api/profile', authMiddleware, async (req, res) => {
  // req.user contiene: { userId, email, role }
});
```

---

## 9️⃣ FLUJO DE AUTENTICACIÓN

### Registro
```
1. POST /api/auth/register
   { email, password, name, role? }

2. AuthService.register():
   - Validar email no existe
   - Hash password con bcrypt
   - Crear user en BD
   - Generar JWT token

3. Respuesta:
   { user: {...}, token: "jwt..." }
```

### Login
```
1. POST /api/auth/login
   { email, password }

2. AuthService.login():
   - Buscar usuario por email
   - Verificar contraseña con bcrypt
   - Generar JWT access token
   - Generar JWT refresh token
   - Actualizar last_login

3. Respuesta:
   { user: {...}, token: "jwt...", refreshToken: "jwt..." }
```

### Request Autenticado
```
1. Cliente:
   GET /api/auth/me
   Headers: Authorization: Bearer <token>

2. Middleware authMiddleware:
   - Extraer token del header
   - Validar JWT signature
   - Verificar expiry
   - Poblar req.user

3. Ruta:
   Acceso a req.user.userId, req.user.role, etc.
```

---

## 🔟 ROW LEVEL SECURITY (RLS)

Implementado a nivel de middleware:

```typescript
// Ejemplo: Usuario solo puede ver sus propias simulaciones
@ManyToOne(() => User)
simulation.user_id === req.user.userId || req.user.role === 'admin'

// Ejemplo: Admin puede listar todos los usuarios
@Param('role')
req.user.role === 'admin' || throw Forbidden
```

**Patrones de RLS por entidad:**
- **User**: self o admin
- **Simulation**: propietario o admin
- **Course**: acceso general (puede expandirse)
- **TelemetryLog**: propietario o admin
- **Assessment**: propietario o admin

---

## 1️⃣1️⃣ PASOS PARA COMPLETAR LA IMPLEMENTACIÓN

### Fase 1: Instalación
```bash
# 1. Actualizar dependencias
npm install

# 2. Crear .env
cp .env.example .env
# Editar con credenciales reales

# 3. Crear base de datos MySQL
mysql -u root -p
> CREATE DATABASE msm_fepei CHARACTER SET utf8mb4;
> CREATE USER 'msm_user'@'localhost' IDENTIFIED BY 'password';
> GRANT ALL PRIVILEGES ON msm_fepei.* TO 'msm_user'@'localhost';
```

### Fase 2: Compilación y Migración
```bash
# 4. Build TypeScript
npm run build

# 5. Ejecutar migraciones
npm run migration:run

# 6. Seed datos iniciales
npm run seed
```

### Fase 3: Actualizar Services Existentes
Para cada service existente (CourseService, SimulationService, etc.):

**Antes (Mongoose):**
```typescript
const course = await Course.findById(id);
course.title = 'new';
await course.save();
```

**Después (TypeORM):**
```typescript
const courseRepo = AppDataSource.getRepository(Course);
const course = await courseRepo.findOne({ where: { id } });
course.title = 'new';
await courseRepo.save(course);
```

### Fase 4: Frontend Integration
En `src/hooks/useAuth.tsx`:

**Antes (Supabase):**
```typescript
const { data } = await supabase.auth.signInWithPassword({...});
```

**Después (JWT):**
```typescript
const response = await fetch('/api/auth/login', {...});
const { token } = await response.json();
localStorage.setItem('token', token);
```

---

## 1️⃣2️⃣ VERIFICACIÓN

### Pruebas de endpoints
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@msm-fepei.com","password":"CHANGE_ME_ADMIN_PASSWORD"}'

# Get current user (con token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## 1️⃣3️⃣ ESTRUCTURA DE ARCHIVOS

```
server/
├── src/
│   ├── database/
│   │   ├── connection.ts          ✅ NUEVO
│   │   └── migrations/
│   │       └── 1703000000000-*.ts ✅ NUEVO
│   ├── entities/
│   │   ├── User.ts                ✅ NUEVO
│   │   ├── Course.ts              ✅ NUEVO
│   │   ├── Simulation.ts           ✅ NUEVO
│   │   ├── Module.ts              ✅ NUEVO
│   │   ├── CourseModule.ts        ✅ NUEVO
│   │   ├── TelemetryLog.ts        ✅ NUEVO
│   │   └── Assessment.ts          ✅ NUEVO
│   ├── services/
│   │   ├── AuthService.ts         ✅ NUEVO
│   │   ├── UserService.ts         ✅ NUEVO
│   │   ├── CourseService.ts       🔄 ACTUALIZAR
│   │   └── SimulationService.ts   🔄 ACTUALIZAR
│   ├── routes/
│   │   └── auth.ts                ✅ NUEVO
│   ├── middleware/
│   │   ├── auth.ts                ✅ NUEVO
│   │   └── authorization.ts       ✅ NUEVO
│   ├── scripts/
│   │   └── seedDatabase.ts        ✅ ACTUALIZAR
│   └── server.ts                  🔄 ACTUALIZAR
├── .env                           🔄 CREAR
├── .env.example                   ✅ ACTUALIZADO
├── setup.sh                       ✅ ACTUALIZADO
└── package.json                   ✅ ACTUALIZADO
```

---

## 1️⃣4️⃣ CAMBIOS DE LÓGICA DE NEGOCIO

### ⚠️ IMPORTANTE: Sin cambios en lógica, solo en persistencia

La lógica de negocio **NO cambió**:
- ✅ Reglas de simulación: igual
- ✅ Evaluación de KPIs: igual
- ✅ Filtros anti-jailbreak: igual
- ✅ Rate limiting: igual
- ✅ Hashing de integridad: igual

Solo cambió **CÓMO** se persiste:
- ❌ MongoDB → ✅ MySQL
- ❌ Mongoose → ✅ TypeORM
- ❌ Supabase Auth → ✅ JWT + bcrypt

---

## 1️⃣5️⃣ ROLLBACK (si es necesario)

Para volver a MongoDB:
```bash
# 1. Revertir package.json a versión anterior
# 2. npm install
# 3. Cambiar connection.ts a usar MongoDB
# 4. Convertir entities a Mongoose schemas
# 5. npm run seed (con seed old)
```

---

## 📝 PRÓXIMOS PASOS

1. ✅ Entities creadas
2. ✅ Services básicos creados
3. ✅ Rutas de auth creadas
4. ✅ Middleware de RLS creado
5. 🔄 Actualizar services existentes (CourseService, SimulationService, etc.)
6. 🔄 Actualizar frontend auth (useAuth hook)
7. 🔄 Actualizar frontend requests (agregar Authorization header)
8. 🔄 Testing completo
9. 🔄 Deployment a producción

---

## 📞 SOPORTE

**Para problemas comunes:**

- **"JWT token expired"** → Usar refreshToken para obtener nuevo token
- **"Row Level Security violation"** → Usuario intenta acceder a recurso de otro usuario
- **"Database connection failed"** → Verificar .env y que MySQL esté corriendo
- **"Hash doesn't match"** → Integridad de datos comprometida, revisar logs


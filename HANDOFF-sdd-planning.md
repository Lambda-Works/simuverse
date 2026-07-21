# Handoff — Cambios Simuverse (Jul 20, 2026)

**Branch**: `feature/agent-fix-and-ui-polish`
**Stack**: Next.js 15 (apps/web) + NestJS 10 (apps/api-nest) + Prisma + PostgreSQL 15 + shadcn/ui + lucide-react

---

## Orden de implementación

```
1. admin-user-management (~230 líneas, 1 PR)
2. entity-polish (~500 líneas, 3 PRs encadenados)
3. course-multi-associations (~600-800 líneas, PRs encadenados)
```

Cada cambio es independiente. Este orden va de menor a mayor complejidad.

---

# Cambio 1 — Gestión de usuarios (`admin-user-management`)

## 1. Sacar botón "Nuevo Usuario" de `/admin/users`

**Archivo**: `apps/web/src/components/UsersABM.tsx`

- El botón está en línea ~138-140, condicional `!readOnly`. Tiene ícono `Plus` de lucide-react.
- **Quitar el botón y la lógica de creación del diálogo** (líneas ~262-322: el `Dialog` maneja create + edit — el modo create se dispara con estado `editingUser === null`).

**NO tocar el backend**:
- `apps/api-nest/src/users/users.controller.ts` línea 44-56: `POST /users/create` **se queda**. Lo usa `AuthService` para el flujo de registro (`auth.service.ts` llama a `usersService.create()`).
- `apps/api-nest/src/users/users.service.ts` línea 121: método `create()` **se queda**.
- Solo se oculta UI. Creación manual queda restringida a seeds/CLI.

## 2. Reemplazar emoji 🔄 por ícono Lucide

**Archivo**: `apps/web/src/components/UsersABM.tsx`

- Línea ~249-250: botón de reactivación. HTML actual: `<button class="..." title="Reactivar usuario">🔄</button>`
- **Cambiar**: `🔄` → `<RefreshCw className="w-4 h-4" />` (ya está en lucide-react, importarlo)

## 3. Bloquear login de usuarios inactivos

**Archivo**: `apps/api-nest/src/auth/auth.service.ts`

- Método `login()` alrededor de línea ~110-124. Actualmente valida credenciales y devuelve JWT sin chequear `is_active`.
- **Agregar** después de validar credenciales, antes de generar token:

```typescript
if (!user.is_active) {
  throw new UnauthorizedException('Cuenta desactivada. Contacte al administrador.');
}
```

- `FirebaseStrategy` (JWT guard) YA valida `is_active` en líneas 42 y 58 — este fix cierra el gap en el momento del login.

## 4. Hard-delete manual con cascada

### Backend

**Nuevo endpoint**: `DELETE /admin/users/:id/hard`

`apps/api-nest/src/users/users.controller.ts`:
```typescript
@Delete(':id/hard')
@Roles('admin')
@Permissions('users.hard-delete')  // NUEVO permiso granular
async hardDelete(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.hardDelete(id);
}
```

`apps/api-nest/src/users/users.service.ts` — nuevo método:
```typescript
async hardDelete(id: number) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException('Usuario no encontrado');
  if (user.is_active) throw new BadRequestException('Solo se pueden eliminar usuarios desactivados');

  // Prisma cascade delete — las FK con onDelete: Cascade se encargan del resto
  return this.prisma.user.delete({ where: { id } });
}
```

### Prisma Schema

`apps/api-nest/prisma/schema.prisma` — en el modelo `User`, verificar que las relaciones tengan `onDelete: Cascade`. Las que faltan (según exploración):

```prisma
// SimulationInstance — agregar onDelete: Cascade
simulations SimulationInstance[]        @relation(onDelete: Cascade)

// PracticeLogs — agregar onDelete: Cascade  
practice_logs PracticeLogs[]            @relation(onDelete: Cascade)
```

Generar migración: `npx prisma migrate dev --name add_cascade_user_relations`

### Frontend

**Archivo**: `apps/web/src/components/UsersABM.tsx`

- Agregar botón "Eliminar permanentemente" visible solo cuando `user.is_active === false`.
- Usar shadcn `AlertDialog` para confirmación con texto: "Esta acción es irreversible. Se eliminará al usuario y todos sus datos (simulaciones, prácticas, cursos)."
- Llamar a `DELETE /admin/users/${id}/hard` al confirmar.
- El tipo `UserRow` usa `(u as any).is_active` — agregar tipado explícito.

### Permiso RBAC

- Crear permiso `users.hard-delete` (NO reusar `users.delete` — son operaciones distintas).
- Agregar al seed de permisos y al rol admin.

### Testing

- **Unit**: `AuthService.login()` rechaza usuario con `is_active === false`.
- **Unit**: `UsersService.hardDelete()` rechaza usuario activo (400), borra inactivo.
- **E2E**: `POST /auth/login` con usuario desactivado → 401.
- **E2E**: `DELETE /admin/users/:id/hard` sin permiso → 403. Con permiso y usuario inactivo → 200 + borrado en cascada.
- **Componente**: botón hard-delete visible solo si `is_active === false`. Confirmación requerida.

### Gotchas

- `users.service.create()` lo comparten admin y auth — **no tocar backend de creación**
- `FirebaseStrategy` YA chequea `is_active`, solo falta en `login()`
- `SimulationInstance` y `PracticeLogs` no tienen cascade en Prisma — agregar ANTES de probar hard-delete o va a fallar con FK violation
- `UserRow` usa `(u as any).is_active` — tipar correctamente para evitar regresiones

---

# Cambio 2 — Entidades: rename + upload de imágenes (`entity-polish`)

## Parte A: Renombrar `ministry_aval` → `description`

### Estado actual

- **Modelo**: `FoundationConfig` en `prisma/schema.prisma` líneas ~864-882
- **Campo**: `ministry_aval String? @db.Text` — ya es opcional
- **Valor seed**: `'Disposición Nº 123/2024 — Ministerio de Educación de Santa Fe'`
- **Backend**: `apps/api-nest/src/catalog/missing-controllers.ts` líneas 5-70. Usa `(this.prisma as any).foundationConfig`. Sin DTOs formales.
- **Frontend**: `apps/web/src/components/FoundationABM.tsx` — label "Aval ministerial", campo en formulario create/edit

### Migración

```sql
ALTER TABLE foundation_config RENAME COLUMN ministry_aval TO description;
```

Prisma schema:
```prisma
model FoundationConfig {
  // ... resto de campos
  description  String?  @db.Text  // era ministry_aval
}
```

### Backend

`apps/api-nest/src/catalog/missing-controllers.ts` líneas ~15-52:
- `create()`: cambiar `ministry_aval: body.ministry_aval` → `description: body.description`
- `update()`: ídem
- `findAll()` / `findOne()`: ya devuelve el objeto completo, Prisma maneja el rename

### Frontend

`apps/web/src/components/FoundationABM.tsx`:
- Interface/estado: `ministry_aval` → `description`
- Label: "Aval ministerial" → "Descripción"
- Placeholder: actualizar
- Quitar validación de required si existiera

### Seed

`apps/api-nest/src/prisma/seed-demo.ts` línea ~23-42:
```typescript
// Antes: ministry_aval: 'Disposición Nº 123/2024...'
// Después:
description: 'Disposición Nº 123/2024 — Ministerio de Educación de Santa Fe',
```

---

## Parte B: Upload de imágenes de logo

### Estado actual

Las 3 entidades usan `logo_url` como string:

| Modelo | Tabla DB | Tipo Prisma | Required |
|---|---|---|---|
| `FoundationConfig` | `foundation_config` | `String? @db.VarChar(500)` | No |
| `Endorser` | `endorsers` | `String? @db.VarChar(500)` | No |
| `SimulatedCompany` | `simulated_companies` | `String? @db.Text` | No |

**Infraestructura existente**:
- `apps/api-nest/src/files/files.controller.ts`: `POST /api/files/upload` con `FileInterceptor('file')`, `memoryStorage()`, 5MB limit
- `apps/api-nest/src/files/files.service.ts`: guarda en `process.cwd()/uploads/` con `fs.writeFileSync`
- `apps/web/src/lib/api.ts`: ya soporta `FormData` (omite Content-Type para que el browser ponga el boundary)
- Los logos en frontend se renderizan con `<img src={logoUrl}>` con fallback de iniciales

**Problema**: `uploads/` vive DENTRO del container, no tiene volumen Docker → se pierde al recrear.

### Estrategia

**NO crear nueva columna**. Reutilizar `logo_url`:
- Si el usuario sube un archivo → guardar path relativo (ej: `/logos/uuid.png`) en `logo_url`
- Si el usuario pone una URL → guardar la URL en `logo_url`
- Si ambos → el archivo gana (se guarda el path del archivo)
- Registros legacy con URLs externas (`https://...`) se siguen mostrando sin cambios

### Docker

`docker-compose.yml` — agregar volumen:

```yaml
services:
  api-nest:
    volumes:
      - logos-data:/app/apps/api-nest/uploads/logos

volumes:
  logos-data:
```

### Backend — Serving estático público

`apps/api-nest/src/main.ts` — **ANTES** del `app.setGlobalPrefix()`:

```typescript
import * as express from 'express';
import { join } from 'path';

// Servir logos públicamente (sin JWT) — necesario para certificados y landing pages
app.use('/logos', express.static(join(__dirname, '..', 'uploads', 'logos')));
```

Esto va ANTES de `app.setGlobalPrefix('api')` para que `/logos/` no quede bajo `/api/`.

### Backend — Upload en controladores

Los 3 controladores deben aceptar `multipart/form-data` con campo `logo_file`.

**Ejemplo para SimulatedCompaniesController** (`apps/api-nest/src/catalog/simulated-companies.controller.ts`):

```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

// En create/update:
@UseInterceptors(FileInterceptor('logo_file', {
  storage: diskStorage({
    destination: join(__dirname, '..', '..', 'uploads', 'logos'),
    filename: (req, file, cb) => {
      cb(null, `${uuid()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('Solo JPG, PNG o WebP'), false);
    }
    cb(null, true);
  },
}))
async create(@Body() dto: CreateCompanyDto, @UploadedFile() logo_file?: Express.Multer.File) {
  // Si hay archivo, construir path. Si no, usar dto.logo_url
  const logoPath = logo_file ? `/logos/${logo_file.filename}` : dto.logo_url;
  // ... guardar en DB con logo_url: logoPath
}
```

**Para FoundationConfig y Endorsers** (`missing-controllers.ts`): mismo patrón. Estos controladores NO usan DTOs — destructuring manual del body. Agregar `@UseInterceptors(FileInterceptor(...))` y `@UploadedFile()`.

**Limpieza de archivo viejo**: si el usuario reemplaza el logo, borrar el archivo anterior del disco:

```typescript
if (logo_file && existingRecord.logo_url?.startsWith('/logos/')) {
  const oldPath = join(__dirname, '..', '..', 'uploads', existingRecord.logo_url);
  if (existsSync(oldPath)) unlinkSync(oldPath);
}
```

**DTOs multipart**: `SimulatedCompany` tiene campos booleanos (`is_active`). Al usar `FormData`, los booleanos llegan como string `"true"`/`"false"`. Agregar `@Transform()`:

```typescript
import { Transform } from 'class-transformer';

@Transform(({ value }) => value === 'true' || value === true)
is_active?: boolean;
```

### Frontend — Toggle URL/Upload

En los 3 ABM components:
- `apps/web/src/components/FoundationABM.tsx`
- `apps/web/src/components/CompaniesABM.tsx`
- `apps/web/src/components/EndorsersABM.tsx`

Cada formulario de create/edit gana un toggle entre dos modos:

```
[URL] [Subir archivo]   ← radio buttons o tabs

Modo URL:    input text para pegar URL
Modo Upload: input file para seleccionar archivo
```

Comportamiento:
- Al cambiar de modo, limpiar el campo del otro modo
- Vista previa con `<img>` (URL: directo; archivo: `URL.createObjectURL()` antes de submit)
- Al guardar, enviar `FormData` con `logo_file` (si upload) o `logo_url` (si URL)
- Si `logo_file_path` tiene valor → mostrar archivo. Si no → mostrar `logo_url`. Si ambos → archivo gana.

El helper `api.ts` ya soporta `FormData` — usarlo directamente.

### Testing

- **Unit**: `FileInterceptor` rechaza archivos >5MB (413), MIME inválido (400)
- **Unit**: limpieza de archivo viejo al reemplazar
- **Integración**: `POST /foundations` con `logo_file` → guarda en disco + DB
- **Integración**: `GET /logos/filename.png` → 200 sin auth
- **E2E**: toggle URL/upload en frontend, precedencia archivo > URL, limpieza al cambiar modo
- **E2E**: persistencia entre deploys (verificar volumen Docker)

### Gotchas

- **DB es PostgreSQL 15**, no MySQL (el prompt original decía MySQL) — la sintaxis de migrate es PostgreSQL
- `SimulatedCompany` usa `class-validator` DTOs — al cambiar a multipart, los booleanos necesitan `@Transform()`
- Las imágenes DEBEN ser públicas en `/logos/` (decisión confirmada: certificados y landing pages las consumen sin auth)
- `express.static` va ANTES de `setGlobalPrefix('api')` en main.ts
- El volumen Docker (`logos-data`) debe agregarse ANTES del primer deploy con uploads, o se pierden archivos
- `FoundationConfigController` y `EndorsersController` están en `missing-controllers.ts` con `(this.prisma as any)` — no tienen DTOs ni `class-validator`
- Los seeds actuales usan paths relativos tipo `'/logos/fepei.png'` — actualizar si es necesario
- `FoundationConfigABM` se llama `FoundationABM.tsx` en el código (sin "Config")

---

# Cambio 3 — Asociaciones N a N en Cursos (`course-multi-associations`)

## Estado actual detallado

### 1. Course ↔ Endorser (Avalador)

- **Schema**: `prisma/schema.prisma` líneas 853-862. Tabla `CourseEndorser`.
- **BUG**: tiene DOS columnas que referencian lo mismo:
  - `endorser_id Int` (línea 856) — usada por `@@unique([course_id, endorser_id])`
  - `endorserId Int?` (línea 858) — usada por `@relation(fields: [endorserId])`
  - Prisma genera AMBAS columnas → datos pueden estar en cualquiera
- **Backend**: `missing-controllers.ts` líneas 135-181. `CourseEndorsersController` con `(this.prisma as any).courseEndorser`
- **Frontend**: `EndorsersABM.tsx` líneas 303-352. Sección "Vincular avaladores a un curso" con dropdown de curso y toggle grid
- **Course NO tiene back-reference**: `Course` model no declara `course_endorsers CourseEndorser[]` (a diferencia de `Endorser` que sí lo tiene)

### 2. Course ↔ SimulatedCompany (Empresa Simulada)

- **Schema**: `Course` tiene `simulated_company_id Int?` (línea 218) — FK directa, NO relación formal de Prisma. Es 1-a-N (un curso pertenece a UNA empresa).
- **Backend**: `CreateCourseDto.simulated_company_id` (Int, opcional) y `UpdateCourseDto.simulated_company_id`
- **Frontend**: `AdminPanel.tsx` líneas ~678-699. Un `<Select>` dropdown para elegir UNA empresa
- **SimulatedCompany NO tiene back-reference** a Course

### 3. Course ↔ FoundationConfig (Fundación)

- **No existe relación**. `FoundationConfig` (schema líneas 864-882) es standalone.
- Backend: solo CRUD en `missing-controllers.ts` líneas 5-70
- Frontend: solo CRUD en `FoundationABM.tsx`

### 4. Course ↔ Sponsor

- **No existe**. No hay modelo, controlador, ni componente. Zero referencias en el código.

### 5. Sección a remover

- `EndorsersABM.tsx` líneas 303-352: "Vincular avaladores a un curso"
- `CompaniesABM.tsx`: verificar si tiene sección similar (exploración no encontró — posiblemente no)
- Backend: endpoints correspondientes en `missing-controllers.ts`

---

## Esquema de junction tables

Seguir el patrón de `CourseTeacher` (schema líneas 246-258):

```prisma
model CourseTeacher {
  course_id  Int
  teacher_id Int
  course     Course  @relation(fields: [course_id], references: [id], onDelete: Cascade)
  teacher    Teacher @relation(fields: [teacher_id], references: [id], onDelete: Cascade)

  @@id([course_id, teacher_id])
}
```

### Fix CourseEndorser existente

```prisma
model CourseEndorser {
  course_id   Int
  endorser_id Int
  course      Course   @relation(fields: [course_id], references: [id], onDelete: Cascade)
  endorser    Endorser @relation(fields: [endorser_id], references: [id], onDelete: Cascade)

  @@id([course_id, endorser_id])
}
```

**Antes de la migración**, consolidar datos duplicados:

```sql
-- Si hay datos en endorserId (columna fantasma de Prisma), mergearlos a endorser_id
UPDATE "CourseEndorser"
SET endorser_id = COALESCE("endorserId", endorser_id)
WHERE "endorserId" IS NOT NULL AND endorser_id IS NULL;

-- Dropear columna sobrante
ALTER TABLE "CourseEndorser" DROP COLUMN "endorserId";
```

### Nuevas junction tables

```prisma
// Reemplaza simulated_company_id en Course
model CourseSimulatedCompany {
  course_id             Int
  simulated_company_id  Int
  course                Course            @relation(fields: [course_id], references: [id], onDelete: Cascade)
  simulated_company     SimulatedCompany  @relation(fields: [simulated_company_id], references: [id], onDelete: Cascade)

  @@id([course_id, simulated_company_id])
}

model CourseFoundationConfig {
  course_id              Int
  foundation_config_id   Int
  course                 Course             @relation(fields: [course_id], references: [id], onDelete: Cascade)
  foundation_config      FoundationConfig   @relation(fields: [foundation_config_id], references: [id], onDelete: Cascade)

  @@id([course_id, foundation_config_id])
}

model CourseSponsor {
  course_id   Int
  sponsor_id  Int
  course      Course   @relation(fields: [course_id], references: [id], onDelete: Cascade)
  sponsor     Sponsor  @relation(fields: [sponsor_id], references: [id], onDelete: Cascade)

  @@id([course_id, sponsor_id])
}
```

### Modelo Sponsor (nuevo)

```prisma
model Sponsor {
  id        Int       @id @default(autoincrement())
  name      String    @db.VarChar(100)
  logo_url  String?   @db.VarChar(500)
  website   String?   @db.VarChar(500)
  is_active Boolean   @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  course_sponsors CourseSponsor[]

  @@map("sponsors")
}
```

### Modelo Course — actualizar

```prisma
model Course {
  // ... campos existentes ...

  // ELIMINAR: simulated_company_id Int?

  // NUEVAS relaciones:
  course_endorsers             CourseEndorser[]
  course_simulated_companies   CourseSimulatedCompany[]
  course_foundation_configs    CourseFoundationConfig[]
  course_sponsors              CourseSponsor[]
}
```

---

## Migración de datos

**Migrar `simulated_company_id` antes de dropear la FK**:

```sql
-- Copiar datos existentes a la junction table
INSERT INTO "CourseSimulatedCompany" (course_id, simulated_company_id)
SELECT id, simulated_company_id
FROM "Course"
WHERE simulated_company_id IS NOT NULL;

-- Dropear la FK y columna vieja
ALTER TABLE "Course" DROP COLUMN "simulated_company_id";
```

---

## Backend — Curso DTOs

`apps/api-nest/src/courses/dto/create-course.dto.ts`:
```typescript
import { IsArray, IsInt, IsOptional } from 'class-validator';

export class CreateCourseDto {
  // ... campos existentes ...
  // ELIMINAR: simulated_company_id

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  endorser_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  company_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  foundation_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  sponsor_ids?: number[];
}
```

`UpdateCourseDto` — misma estructura.

---

## Backend — Curso Service (sync strategy)

`apps/api-nest/src/courses/courses.service.ts`:

```typescript
async create(dto: CreateCourseDto) {
  const { endorser_ids, company_ids, foundation_ids, sponsor_ids, ...courseData } = dto;

  return this.prisma.$transaction(async (tx) => {
    const course = await tx.course.create({ data: courseData });

    if (endorser_ids?.length) {
      await tx.courseEndorser.createMany({
        data: endorser_ids.map(endorser_id => ({ course_id: course.id, endorser_id })),
      });
    }
    if (company_ids?.length) {
      await tx.courseSimulatedCompany.createMany({
        data: company_ids.map(simulated_company_id => ({ course_id: course.id, simulated_company_id })),
      });
    }
    // Ídem para foundation_ids y sponsor_ids...

    return course;
  });
}

async update(id: number, dto: UpdateCourseDto) {
  const { endorser_ids, company_ids, foundation_ids, sponsor_ids, ...courseData } = dto;

  return this.prisma.$transaction(async (tx) => {
    const course = await tx.course.update({ where: { id }, data: courseData });

    // deleteAll + createMany para cada tipo de asociación
    if (endorser_ids !== undefined) {
      await tx.courseEndorser.deleteMany({ where: { course_id: id } });
      if (endorser_ids.length) {
        await tx.courseEndorser.createMany({
          data: endorser_ids.map(endorser_id => ({ course_id: id, endorser_id })),
        });
      }
    }
    // Ídem para company_ids, foundation_ids, sponsor_ids...

    return course;
  });
}
```

**GET** — incluir asociaciones pobladas:
```typescript
async findOne(id: number) {
  return this.prisma.course.findUnique({
    where: { id },
    include: {
      course_endorsers: { include: { endorser: true } },
      course_simulated_companies: { include: { simulated_company: true } },
      course_foundation_configs: { include: { foundation_config: true } },
      course_sponsors: { include: { sponsor: true } },
      // ... otras relaciones existentes ...
    },
  });
}
```

---

## Backend — Quitar asociación desde Endorsers/Companies

**Eliminar** estos endpoints (si existen):
- `CourseEndorsersController` en `missing-controllers.ts` líneas 135-181 — endpoints de link/unlink desde el lado del endorser
- Cualquier endpoint similar en `CompaniesController` que asocie empresas a cursos

Si los endpoints se usan también para leer asociaciones (GET), mover esa lógica al `CoursesController` o dejarla como read-only.

---

## Backend — Sponsor CRUD

Crear `apps/api-nest/src/sponsors/`:

```
sponsors/
├── sponsors.module.ts
├── sponsors.controller.ts
├── sponsors.service.ts
└── dto/
    ├── create-sponsor.dto.ts
    └── update-sponsor.dto.ts
```

**Controller endpoints**:
- `GET /admin/sponsors` — listar todos
- `GET /admin/sponsors/:id` — uno solo
- `POST /admin/sponsors` — crear
- `PUT /admin/sponsors/:id` — actualizar
- `DELETE /admin/sponsors/:id` — soft-delete (`is_active = false`)

**DTO**:
```typescript
export class CreateSponsorDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  logo_url?: string;

  @IsOptional() @IsString()
  website?: string;
}
```

Registrar `SponsorsModule` en `apps/api-nest/src/app.module.ts` y en `catalog.module.ts`.

---

## Frontend — Multi-select component

**Nuevo archivo**: `apps/web/src/components/ui/multi-select.tsx`

Basado en shadcn `Command`:

```tsx
interface MultiSelectProps {
  items: { id: number; name: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}
```

Comportamiento:
- `CommandInput` para búsqueda/filtro
- `CommandList` con `CommandItem` para cada opción
- Checkmark en items seleccionados
- Badges/chips mostrando selección actual fuera del dropdown
- Click en badge lo remueve

### Frontend — Curso Form

`apps/web/src/views/AdminPanel.tsx` — formulario create/edit de curso:
- **Eliminar** el `<Select>` de `simulated_company_id` (líneas ~678-699)
- **Agregar** 4 `<MultiSelect>`:
  - Avaladores (datos de `GET /admin/endorsers`)
  - Empresas Simuladas (datos de `GET /admin/companies`)
  - Fundaciones (datos de `GET /admin/foundations`)
  - Sponsors (datos de `GET /admin/sponsors`)
- Al guardar, enviar arrays de IDs en el body

### Frontend — Remover linking UI

`apps/web/src/components/EndorsersABM.tsx`:
- **Eliminar** líneas 303-352: sección "Vincular avaladores a un curso"

`apps/web/src/components/CompaniesABM.tsx`:
- Verificar si tiene sección similar. Si existe, eliminar.

### Frontend — Sponsor ABM

**Nuevo archivo**: `apps/web/src/components/SponsorsABM.tsx`

Copiar estructura de `EndorsersABM.tsx` como template:
- Card grid con logo + nombre
- Diálogo create/edit con campos: nombre (required), sitio web (opcional), logo_url (opcional)
- Soft-delete (toggle `is_active`)
- Quitar sección de vinculación a curso (no existe en Sponsor)

Agregar ruta en admin sidebar y breadcrumbs.

### Seed

`apps/api-nest/src/prisma/seed-demo.ts`:
- Agregar 2-3 sponsors de ejemplo
- Actualizar seed de cursos para usar junction tables en vez de `simulated_company_id`
- Actualizar `CourseEndorser` seeds (arreglar nombres de columna)

---

## Testing

- **Unit**: `CoursesService.create/update` con arrays de IDs — verificar insert/delete en junction tables
- **Unit**: `CoursesService` — transacción atómica (si falla un insert, todo rollback)
- **Unit**: `SponsorsService` CRUD
- **Integración**: `PUT /courses/:id` con `endorser_ids` — verificar sync (deleteAll + createMany)
- **Integración**: endpoint de asociación removido devuelve 404
- **E2E**: formulario de curso con multi-selects — seleccionar/deseleccionar entidades, guardar, verificar en GET
- **E2E**: `EndorsersABM` ya no muestra sección de vinculación
- **E2E**: `SponsorsABM` — crear, editar, soft-delete sponsor
- **Migración**: verificar que datos de `simulated_company_id` y `CourseEndorser` se migraron correctamente

---

## Gotchas — Cambio 3

1. **CourseEndorser bug**: DOS columnas (`endorserId` + `endorser_id`). La migración DEBE hacer `COALESCE` para no perder datos. Verificar con query antes y después de migrar:
   ```sql
   SELECT COUNT(*) FROM "CourseEndorser" WHERE endorser_id IS NOT NULL;
   SELECT COUNT(*) FROM "CourseEndorser" WHERE "endorserId" IS NOT NULL;
   ```

2. **Sponsor NO existe**: crear modelo, migración, CRUD backend, ABM frontend, seed desde cero. Es ~200 líneas por sí solo.

3. **FoundationConfig** no tiene relación con Course — junction table es nueva, sin migración de datos.

4. **`simulated_company_id`** tiene datos reales que DEBEN migrarse al junction table ANTES de dropear la columna. Orden: copiar datos → verificar counts → dropear FK → dropear columna.

5. **`missing-controllers.ts`** usa `(this.prisma as any)` — sin type safety. Los nuevos controladores deberían usar Prisma tipado.

6. **Course model** no tiene back-references a `CourseEndorser` — agregarlas. Verificar que otras relaciones del modelo no se rompan.

7. **`AdminPanel.tsx`** es un componente grande — el formulario de curso está embebido. Extraer a componente separado si el archivo se vuelve inmanejable (>800 líneas ya).

8. **Sin tests** en esta área — validación manual post-migración es crítica.

9. **Seed de cursos** usa `simulated_company_id` — actualizar a junction table. Mismo para `CourseEndorser` seeds.

10. **`CourseTeacher`** es el patrón de referencia para junction tables. Copiar estructura exacta.

---

## Stack y convenciones

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 App Router, React 19, shadcn/ui, Tailwind CSS 3, TanStack Query, Zod, lucide-react |
| Backend | NestJS 10, Prisma ORM, PostgreSQL 15, `class-validator`, `class-transformer` |
| Auth | JWT (FirebaseStrategy) + RBAC (`PermissionsGuard`, `@Permissions()`, `@Roles()`) |
| HTTP | `apps/web/src/lib/api.ts` — wrapper de fetch con tipado, soporta `FormData` |
| Docker | `docker-compose.yml`: postgres:15-alpine, proxy, api-express, api-nest, web |
| Soft-delete | Flag `is_active` booleano (NO timestamp `deleted_at`) |
| Junction tables | Patrón `CourseTeacher` — explícitas con `@@id` compuesto y `onDelete: Cascade` |
| FilesModule | `apps/api-nest/src/files/` — multer con `memoryStorage`, 5MB default |
| Commits | Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`, `chore:` |
| ABM controllers | Algunos en `missing-controllers.ts` con `(this.prisma as any)` — sin DTOs ni class-validator |
| Frontend ABMs | Card grid + diálogo create/edit. `LogoDisplay` con `<img>` + fallback de iniciales |

## Puntos de entrada clave

| Qué | Dónde |
|---|---|
| Tabla de usuarios admin | `apps/web/src/components/UsersABM.tsx` |
| Auth service (login) | `apps/api-nest/src/auth/auth.service.ts` ~L110 |
| JWT guard (ya chequea is_active) | `apps/api-nest/src/auth/strategies/firebase.strategy.ts` L42, L58 |
| Users controller + service | `apps/api-nest/src/users/` |
| Foundation ABM frontend | `apps/web/src/components/FoundationABM.tsx` |
| Foundation + Endorser controllers | `apps/api-nest/src/catalog/missing-controllers.ts` |
| Companies controller | `apps/api-nest/src/catalog/simulated-companies.controller.ts` |
| Curso form (AdminPanel) | `apps/web/src/views/AdminPanel.tsx` ~L678 |
| Endorsers ABM (linking) | `apps/web/src/components/EndorsersABM.tsx` ~L303 |
| Course service | `apps/api-nest/src/courses/courses.service.ts` |
| Prisma schema | `apps/api-nest/prisma/schema.prisma` |
| Files module (multer) | `apps/api-nest/src/files/` |
| API client (frontend) | `apps/web/src/lib/api.ts` |
| Seed demo | `apps/api-nest/src/prisma/seed-demo.ts` |
| Seed companies | `apps/api-nest/src/prisma/seed-companies.ts` |
| Docker compose | `docker-compose.yml` (raíz) |
| NestJS bootstrap | `apps/api-nest/src/main.ts` |

---

## Requerimientos originales (prompt4.md)

1. Eliminar "Nuevo Usuario" de `/admin/users` — solo registro por email/Google
2. Sacar emoji 🔄 de reactivación, usar ícono Lucide React
3. Usuario desactivado (soft-delete) no puede acceder. Hard-delete manual con cascada
4. Fundación: renombrar "Aval Ministral" → "Descripción" (opcional). Impacta nuevos + existentes
5. Fundaciones, Empresas, Avaladores: upload de imágenes en vez de URL. Persistir entre deploys
6. Cursos: N a N con avaladores, empresas, fundaciones, sponsors
7. Avaladores: eliminar opción de asociar a curso desde ahí. Todo desde curso

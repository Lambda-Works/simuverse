# SimuVerse — Motor de Simulación Modular

Plataforma de simulaciones educativas con evaluaciones dinámicas impulsadas por IA. Diseñada para escalar a 40+ cursos de educación profesionalizante.

Diseñado para funcionar con el [Lambda Hub](https://github.com/anomalyco/lambda-hub) autodeploy system out of the box.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 15 (standalone output), React 19, Tailwind CSS, shadcn/ui |
| **Backend** | NestJS + Prisma + TypeScript |
| **Proxy** | Express + http-proxy-middleware (enrutamiento interno) |
| **Base de datos** | PostgreSQL 15 |
| **Package manager** | npm (workspaces) |

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

- Web: `http://localhost:8080`
- API (vía proxy): `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

Los puertos son configurables via `PUERTO_FRONTEND`, `PUERTO_PROXY`, `PUERTO_BACKEND_NEST`, `PUERTO_POSTGRES` en `.env`.

## First-time setup

Pasos para levantar el proyecto por primera vez:

### 1. Clonar y configurar variables de entorno

```bash
git clone <repo-url>
cd simuverse-engine
cp .env.example .env
```

Editá el `.env` con los valores reales. Las variables que **sí o sí** hay que cambiar:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Password de PostgreSQL | `MiPasswordSeguro123` |
| `JWT_SECRET` | Secreto para firmar JWTs | `random-string-seguro` |
| `ASSESSMENT_HMAC_SECRET` | Secreto para firmar evaluaciones | `random-string-seguro` |

El `.env.example` tiene placeholders seguros para desarrollo. Copialo y editá lo necesario.

### 2. Levantar los servicios

```bash
docker compose up -d --build
```

Esto levanta: PostgreSQL, API NestJS, proxy y frontend Next.js.

> **Nota:** Las migraciones de Prisma y las seeds se aplican automáticamente cuando el contenedor de la API arranca (ver `apps/api-nest/docker-entrypoint.dev.sh`). No hace falta correrlas manualmente.

### 3. Verificar

```bash
curl http://localhost:5000/api/health
```

Deberías ver una respuesta JSON indicando que la API está funcionando.

### 4. Acceder

- **Web**: `http://localhost:8080`
- **Login estudiante**: `juan.perez@student.edu` / `Admin123!`
- **Login admin**: `admin@simuverse.edu` / `Admin123!`
- **Login profesor**: `garcia@simuverse.edu` / `Admin123!`
- **Login ministerio**: `control@ministerio.gob` / `Admin123!`

## Puertos

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PUERTO_FRONTEND` | `8080` | Puerto del frontend Next.js |
| `PUERTO_PROXY` | `5000` | Puerto del proxy (entrada unificada) |
| `PUERTO_BACKEND_NEST` | `5002` | Puerto del API NestJS |
| `PUERTO_POSTGRES` | `5433` | Puerto de PostgreSQL (host) |

El Hub asigna estos puertos automáticamente. Solo hay que asegurarse de que estén definidos como `PUERTO_*` en el `.env`.

## Project structure

```
├── docker-compose.prod.yml      # Producción (Lambda Hub lee este)
├── docker-compose.yml           # Desarrollo (hot reload)
├── .env.example
├── package.json                 # npm workspaces
├── proxy/                       # Proxy de entrada unificada
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── index.ts                 # Express + http-proxy-middleware
│   └── routes.json              # Configuración de rutas
├── apps/
│   ├── web/                     # Next.js
│   │   ├── Dockerfile.prod
│   │   ├── Dockerfile.dev
│   │   ├── next.config.ts       # output: "standalone"
│   │   └── app/
│   └── api-nest/                # NestJS
│       ├── Dockerfile.prod
│       ├── Dockerfile.dev
│       └── src/
```

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/me` | JWT | Current user info |
| `POST` | `/api/auth/login` | No | Login |
| `POST` | `/api/auth/register` | No | Register |

Todos los requests pasan por el proxy (`proxy/index.ts`), que enruta al backend correspondiente.

## Seeds

El proyecto incluye 5 seeds que se ejecutan automáticamente al levantar con `docker compose up`. Son idempotentes: se pueden correr varias veces sin duplicar datos.

| # | Archivo | Qué crea |
|---|---------|----------|
| 1 | `seed.ts` | 7 usuarios (admin, 2 profes, 3 alumnos, 1 ministerio) + empresa "Las Tradiciones" + curso "Ofimática Básica" + 1 escenario + 2 documentos + asignación y simulación para Juan Pérez |
| 2 | `seed-companies.ts` | 3 empresas (TextilNorte, Conservas Litoral, MetalRos) con 1 curso, 1 escenario, documentos y asignaciones cada una |
| 3 | `seed-demo.ts` | Fundación FEPEI, 3 avaladores, 8 categorías, 4 flow templates, 6 prompts IA, 3 fichas técnicas, 6 notificaciones, 3 grupos prof-alumno, 2 solicitudes de acceso, 2 requisitos ministeriales, 6 KPIs, 4 tareas, 6 módulos |
| 4 | `seed-demo-2.ts` | Asignaciones y simulaciones para María López (2 cursos) y Carlos Soto (2 cursos), 4 archivos subidos, 6 KPIs extra, 4 tareas extra, 4 notificaciones extra, 4 categorías extra |
| 5 | `seed-demo-3.ts` | 2 requisitos ministeriales extra (completa los 4 cursos), 4 KPIs, 4 tareas, grupos Prof. Martínez, 4 archivos extra, flow template emprendimiento, prompt Inversor Ángel, 1 solicitud extra, 3 notificaciones |

### Ejecutar seeds manualmente

```bash
docker compose exec api-nest npx ts-node src/prisma/seed.ts
docker compose exec api-nest npx ts-node src/prisma/seed-companies.ts
docker compose exec api-nest npx ts-node src/prisma/seed-demo.ts
docker compose exec api-nest npx ts-node src/prisma/seed-demo-2.ts
docker compose exec api-nest npx ts-node src/prisma/seed-demo-3.ts
```

### Credenciales de prueba

Todos los usuarios usan contraseña `Admin123!`.

| Rol | Email |
|-----|-------|
| Admin | `admin@simuverse.edu` |
| Profesor | `garcia@simuverse.edu` |
| Profesor | `martinez@simuverse.edu` |
| Alumno | `juan.perez@student.edu` (4 cursos) |
| Alumno | `maria.lopez@student.edu` (2 cursos) |
| Alumno | `carlos.soto@student.edu` (2 cursos) |
| Ministerio | `control@ministerio.gob` |

## Auth

Autenticación via JWT. El frontend almacena el token y lo envía como `Authorization: Bearer <token>`.

## Lambda Hub autodeploy

El proyecto incluye un workflow de GitHub Actions para autodeploy al [Lambda Hub](https://github.com/anomalyco/lambda-hub).

El Hub lee `docker-compose.prod.yml` y ejecuta:

```bash
docker compose -p {project}-{env} -f docker-compose.prod.yml build
docker compose -p {project}-{env} -f docker-compose.prod.yml up -d
```

Los puertos usan variables de entorno (`PUERTO_BACKEND_NEST`, `PUERTO_FRONTEND`, `PUERTO_POSTGRES`, etc.) para que el Hub pueda asignarlos automáticamente.

### Setup para un fork

1. Registrar el proyecto en el dashboard del Lambda Hub para obtener un **project UUID**.
2. Agregar estos secrets en **Settings > Secrets and variables > Actions**:

   | Secret | Description |
   |---|---|
   | `HUB_URL` | Base URL del Hub (ej. `https://hub.example.com`) |
   | `HUB_PROJECT_ID` | UUID del proyecto en el Hub |
   | `DEPLOY_WEBHOOK_SECRET` | Mismo secreto configurado en el `.env` del Hub |

3. Pushear — el workflow se dispara automáticamente.

### Branch behavior

| Branch | Environment | Version bump |
|--------|-------------|--------------|
| `main` | `production` | Bumps tag via Conventional Commits (default: patch) |
| `develop` | `development` | Usa short commit SHA (sin tag) |

### Versioning (Conventional Commits)

El workflow usa [github-tag-action](https://github.com/mathieudutour/github-tag-action) para bump versiones automáticamente basado en mensajes de commit:

```bash
fix: corrige validación de email vacío    # → patch
feat: agrega endpoint de evaluaciones     # → minor
feat!: cambia API de autenticación        # → major
```

Commits sin prefijo convencional default a **patch**. La versión del tag se envía al Hub y se guarda como `version.txt` dentro del release en el VPS.

### Rollback

Si el deploy falla, el Hub hace rollback automático al release anterior.

## Comandos

```bash
# Desarrollo (hot reload)
docker compose up -d --build

# Producción
docker compose -f docker-compose.prod.yml up -d --build

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Ver puertos activos
docker compose ps
```

### Frontend

```bash
npm run dev          # Dev server standalone
npm run build        # Build producción
npm run test         # Tests unitarios (Vitest)
npm run cypress:e2e  # Tests E2E
```

### Backend NestJS

```bash
npm run dev:nest      # Dev server (hot reload)
npm run build:nest    # Compilar TypeScript
npm run start:nest    # Producción
npm run test:nest     # Tests (Jest)
```

## Variables de entorno

Ver `.env.example` para la lista completa. Las esenciales:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Usuario de PostgreSQL | `simuverse` |
| `POSTGRES_PASSWORD` | Password de PostgreSQL | — |
| `POSTGRES_DB` | Nombre de base de datos | `simuverse` |
| `DATABASE_URL` | Connection string de Prisma | — |
| `JWT_SECRET` | Secreto para firmar JWT | — |
| `NEXT_PUBLIC_API_URL` | URL del API (vía proxy) | `http://localhost:5000/api` |
| `DEEPSEEK_API_KEY` | API key de DeepSeek | — |
| `ASSESSMENT_HMAC_SECRET` | Secreto para firmar evaluaciones | — |

## Licencia

MIT

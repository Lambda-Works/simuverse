# SimuVerse — Motor de Simulación Modular

Plataforma de simulaciones educativas con evaluaciones dinámicas impulsadas por IA. Diseñada para escalar a 40+ cursos de educación profesionalizante.

Diseñado para funcionar con el [Lambda Hub](https://github.com/anomalyco/lambda-hub) autodeploy system out of the box.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 16 (standalone output), React 19, Tailwind CSS, shadcn/ui |
| **Backend Express** | Node.js + Express + TypeORM + TypeScript |
| **Backend NestJS** | NestJS (módulo complementario) |
| **Proxy** | Express + http-proxy-middleware (enrutamiento interno) |
| **Base de datos** | MySQL 8.0 |
| **Package manager** | npm (workspaces) |

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

- Web: `http://localhost:8080`
- API (vía proxy): `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

Los puertos son configurables via `PUERTO_FRONTEND`, `PUERTO_PROXY`, `PUERTO_BACKEND`, `PUERTO_BACKEND_NEST`, `PUERTO_MYSQL` en `.env`.

## Puertos

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PUERTO_FRONTEND` | `8080` | Puerto del frontend Next.js |
| `PUERTO_PROXY` | `5000` | Puerto del proxy (entrada unificada) |
| `PUERTO_BACKEND` | `5001` | Puerto del API Express |
| `PUERTO_BACKEND_NEST` | `5002` | Puerto del API NestJS |
| `PUERTO_MYSQL` | `3309` | Puerto del MySQL (host) |

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
│   ├── api-express/             # Express + TypeORM
│   │   ├── Dockerfile.prod
│   │   ├── Dockerfile.dev
│   │   ├── src/
│   │   └── migrations/
│   └── api-nest/                # NestJS (módulo complementario)
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

## Auth

Autenticación via JWT. El frontend almacena el token y lo envía como `Authorization: Bearer <token>`.

## Lambda Hub autodeploy

El proyecto incluye un workflow de GitHub Actions para autodeploy al [Lambda Hub](https://github.com/anomalyco/lambda-hub).

El Hub lee `docker-compose.prod.yml` y ejecuta:

```bash
docker compose -p {project}-{env} -f docker-compose.prod.yml build
docker compose -p {project}-{env} -f docker-compose.prod.yml up -d
```

Los puertos usan variables de entorno (`PUERTO_BACKEND`, `PUERTO_FRONTEND`, `PUERTO_MYSQL`, etc.) para que el Hub pueda asignarlos automáticamente.

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

### Backend Express

```bash
npm run dev:api      # Dev server
npm run build:api    # Compilar TypeScript
npm run start:api    # Producción
```

## Variables de entorno

Ver `.env.example` para la lista completa. Las esenciales:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | Password root de MySQL | — |
| `MYSQL_DATABASE` | Nombre de base de datos | `simuverse` |
| `MYSQL_USER` | Usuario de MySQL | `simuverse` |
| `MYSQL_PASSWORD` | Password del usuario MySQL | — |
| `JWT_SECRET` | Secreto para firmar JWT | — |
| `NEXT_PUBLIC_API_URL` | URL del API (vía proxy) | `http://localhost:5000/api` |
| `GEMINI_API_KEY` | API key de Gemini | — |

## Licencia

MIT

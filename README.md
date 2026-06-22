# SimuVerse — Motor de Simulación Modular

Plataforma de simulaciones educativas con evaluaciones dinámicas impulsadas por IA. Diseñada para escalar a 40+ cursos de educación profesionalizante.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js + Express, TypeORM, TypeScript |
| **Base de datos** | MySQL 8.0 (vía Docker) |
| **Testing** | Vitest (unit), Cypress (E2E) |

## Requisitos

- Node.js 18+
- Docker + Docker Compose
- npm

## Setup rápido

```bash
# 1. Clonar e instalar dependencias
git clone git@github.com:N1C0-P4Z/simuverse.git
cd simuverse
npm install
cd server && npm install && cd ..

# 2. Copiar config de entorno
cp .env.example .env.local
cp server/.env.example server/.env
# Editar server/.env con tus credenciales de DB y APIs

# 3. Levantar MySQL
docker compose up -d

# 4. Backend (terminal 1)
cd server && npm run dev

# 5. Frontend (terminal 2)
npm run dev
```

Accedé a **http://localhost:8080**

## Comandos principales

### Frontend (raíz del proyecto)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server en puerto 8080 |
| `npm run build` | Build de producción |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run cypress:e2e` | Tests E2E |

### Backend (`server/`)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server con hot reload (puerto 5000) |
| `npm run build` | Compilar TypeScript |
| `npm start` | Producción |
| `npm run seed` | Seed database |

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/auth` | Login / Registro |
| `/dashboard` | Panel principal del estudiante |
| `/admin` | Panel de administración |
| `/simulation/[courseId]` | Simulación por curso |
| `/evaluations` | Evaluaciones |
| `/certificate/[instanceId]` | Certificados |
| `/legajos` | Legajos de alumnos |

## Variables de entorno

### Frontend (`.env.local`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend API | `http://localhost:5000/api` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | API key de Gemini | — |
| `NEXT_PUBLIC_ENV` | Entorno | `development` |

### Backend (`server/.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del backend | `5000` |
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL (host) | `3309` |
| `DB_USER` | Usuario DB | `simuverse` |
| `DB_PASSWORD` | Password DB | — |
| `DB_NAME` | Nombre DB | `simuverse` |
| `JWT_SECRET` | Secreto JWT | — |
| `GEMINI_API_KEY` | API key de Gemini | — |

## Rama activa

```bash
desarrollo  # Rama principal de trabajo
```

## Licencia

MIT

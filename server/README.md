# MSM Backend - README

## Estructura del Servidor

```
server/
├── src/
│   ├── config/          # Configuración (DB, env)
│   ├── models/          # Esquemas Mongoose
│   ├── services/        # Lógica de negocio
│   ├── routes/          # Endpoints API
│   ├── middleware/      # Seguridad, logging
│   ├── scripts/         # Scripts de utilidad
│   ├── server.ts        # Punto de entrada
├── data/                # Archivos JSON de configuración de cursos
├── package.json
├── .env.example
└── tsconfig.json
```

## Instalación y Setup

### 1. Instalar dependencias

```bash
cd server
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
- `MONGODB_URI`: URL de MongoDB local o Atlas
- `JWT_SECRET`: Clave secreta para JWT
- `GEMINI_API_KEY`: API key de Google Gemini (opcional para testing)
- `OPENAI_API_KEY`: API key de OpenAI (opcional)

### 3. Asegurar MongoDB está ejecutándose

```bash
# En local con Docker (recomendado)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# O instalar localmente: https://docs.mongodb.com/manual/installation/
```

### 4. Ejecutar seeding de cursos

```bash
npm run seed
```

Esto cargará automáticamente los 4 cursos base desde `/server/data/`.

### 5. Iniciar el servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:5000`

## API Endpoints

### Cursos

- `GET /api/courses` - Obtener todos los cursos
- `GET /api/courses/:courseId` - Obtener un curso específico
- `GET /api/courses/family/:family` - Obtener cursos por familia
- `POST /api/courses` - Crear un nuevo curso
- `PUT /api/courses/:courseId` - Actualizar un curso
- `DELETE /api/courses/:courseId` - Desactivar un curso

### Simulaciones

- `POST /api/simulations/start` - Iniciar una simulación
- `GET /api/simulations/:simulationId` - Obtener detalles
- `POST /api/simulations/:simulationId/message` - Enviar mensaje a IA
- `POST /api/simulations/:simulationId/action` - Registrar una acción
- `POST /api/simulations/:simulationId/pause` - Pausar
- `POST /api/simulations/:simulationId/resume` - Reanudar
- `POST /api/simulations/:simulationId/complete` - Completar
- `GET /api/simulations/:simulationId/logs` - Ver todos los logs

## Ejemplo de Uso

### Crear una simulación

```bash
curl -X POST http://localhost:5000/api/simulations/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "courseId": "ADM3534",
    "scenarioId": "scenario_1"
  }'
```

Response:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "course_id": "ADM3534",
  "status": "in-progress",
  "started_at": "2026-03-05T...",
  ...
}
```

### Enviar mensaje a la IA

```bash
curl -X POST http://localhost:5000/api/simulations/507f1f77bcf86cd799439011/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "courseId": "ADM3534",
    "message": "¿Cuál es la prima anual para una póliza de 500.000 con factor de riesgo 1.2?",
    "conversationHistory": []
  }'
```

Response:
```json
{
  "simulation_id": "507f1f77bcf86cd799439011",
  "user_message": "...",
  "ai_response": "Como auditor técnico de aseguradoras, te digo que...",
  "response_time_ms": 1250
}
```

## Características Principales

### 1. System Prompt Factory
La IA construye dinámicamente prompts según:
- Base role (Auditor, Tech Lead, Cliente, etc.)
- Course context (Contexto específico del curso)
- Knowledge base (Documentos de referencia)
- Student history (Errores previos del alumno)

### 2. Rules Engine
Valida acciones según el tipo de curso:
- **Administración**: Cálculos de sueldos, primas
- **RRHH**: Análisis de comunicación y empatía
- **Informática**: Validación de código Python
- **Emprendimiento**: Lógica de procesos de venta

### 3. Telemetry System
Registra cada acción con:
- Timestamp exacto
- Tipo de acción (click, input, message, cálculo)
- Tiempo de respuesta
- Hash de integridad (SHA-256)

### 4. Crisis Trigger System
Dispara eventos en tiempos específicos:
- Eventos críticos que aumentan la presión
- Obliga al alumno a resolver problemas bajo stress
- Simula situaciones reales de trabajo

## Seguridad

### Protecciones implementadas

1. **Prompt Injection Filter**: Bloquea intentos de "jailbreak" de la IA
2. **Rate Limiting**: Máximo 30 mensajes por minuto por usuario
3. **Audit Logging**: Todas las acciones se registran en logs
4. **Integrity Checker**: Hash SHA-256 para verificar integridad de logs
5. **CORS**: Configurado para permitir solo frontend autorizado

## Monitoreo y Auditoría

### Ver logs en tiempo real

```bash
# Filtar por usuario y curso
curl "http://localhost:5000/api/logs?userId=user123&courseId=ADM3534"
```

### Analizar desempeño del alumno

Los logs se almacenan con:
- Precisión de acciones
- Tiempo de respuesta
- Errores cometidos
- Historial completo de interacciones

Para auditoría del Ministerio, se puede exportar un reporte PDF con firma digital.

## Próximos pasos

- [ ] Integración con base de datos de autenticación (Supabase)
- [ ] Panel de administrador con dashboard de monitoreo
- [ ] Exportación de reportes PDF con firma digital
- [ ] WebSockets para logging en tiempo real
- [ ] Integration con más APIs de IA (OpenAI, Claude)
- [ ] Módulo de evaluación automática avanzada

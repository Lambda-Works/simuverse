# 🚀 PRÓXIMOS PASOS - Integración y Testing

**Estado**: Backend ✅ Completado | Frontend ✅ Completado | Integración ⏳ Pendiente

---

## FASE 1️⃣ - INICIAR SERVICIOS (5 minutos)

### Paso 1: Preparar Variables de Entorno

```bash
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server
cp .env.example .env
```

**Editar `server/.env`** y configurar:

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/simuverse_db
# O si usas MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/simuverse_db

# API Keys
GEMINI_API_KEY=tu_key_aqui  # Obtener de: https://aistudio.google.com/app/apikeys
OPENAI_API_KEY=opcional

# Servidor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Seguridad
RATE_LIMIT_MAX=30
RATE_LIMIT_WINDOW_MS=60000
```

### Paso 2: Iniciar MongoDB

**Opción A: Docker (Recomendado)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Opción B: Sistema local**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Verificar conexión:**
```bash
# Terminal nueva
mongosh
> show databases
# Debe mostrar "simuverse_db" o estar vacía
```

### Paso 3: Cargar Datos de Prueba

```bash
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server
npm install  # Si no se hizo aún

npm run seed
# ✅ Output esperado:
# Connecting to MongoDB...
# Connected!
# Seeding database with 4 courses...
# ✓ Course ADM3534 loaded
# ✓ Course ADM5536 loaded
# ✓ Course RH3657 loaded
# ✓ Course INF28517B loaded
# Database seeded successfully!
```

### Paso 4: Iniciar Backend

```bash
npm run dev
# ✅ Output esperado:
# > simuverse-server@2.0.0 dev
# Server running on http://localhost:5000
# MongoDB connected successfully
```

**Dejarlo corriendo en esta terminal.**

### Paso 5: En Terminal NUEVA - Iniciar Frontend

```bash
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine
npm install  # Si no se hizo aún

npm run dev
# ✅ Output esperado:
# VITE v5.x.x building for production...
# ✓ 1234 modules transformed.
# Local: http://localhost:5173
# Press q to quit
```

---

## FASE 2️⃣ - VERIFICAR CONEXIONES (5 minutos)

### Test 1: Health Check Backend

```bash
# Terminal nueva
curl http://localhost:5000/health
```

**Esperado**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T17:30:45.123Z"
}
```

### Test 2: Ver Cursos Cargados

```bash
curl http://localhost:5000/api/courses
```

**Esperado**: Array con 4 cursos (ADM3534, ADM5536, RH3657, INF28517B)

### Test 3: Acceder a Frontend

Abre navegador: **http://localhost:5173**

Deberías ver:
- ✅ Página de login (Si está integrada)
- ✅ O dashboard vacío (Si no hay Auth aún)

---

## FASE 3️⃣ - PROBAR PRIMER CASO (10 minutos)

### Escenario: Curso de Seguros (ADM3534)

#### 3.1: Iniciar Simulación por API

```bash
curl -X POST http://localhost:5000/api/simulations/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "alumno_test_001",
    "courseId": "ADM3534"
  }'
```

**Esperado**: Respuesta JSON con:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user_id": "alumno_test_001",
  "course_id": "ADM3534",
  "status": "in-progress",
  "progress": 0,
  "started_at": "2026-03-05T17:30:45.123Z",
  "total_duration_minutes": 30
}
```

**Copiar el `_id` para pasos siguientes.**

#### 3.2: Obtener Detalles de Simulación

```bash
SIMULATION_ID="507f1f77bcf86cd799439011"  # Reemplazar con tu ID

curl http://localhost:5000/api/simulations/$SIMULATION_ID
```

**Esperado**: JSON completo con courseData, elapsedMinutes, crisis_events.

#### 3.3: Enviar Mensaje a IA

```bash
SIMULATION_ID="507f1f77bcf86cd799439011"

curl -X POST http://localhost:5000/api/simulations/$SIMULATION_ID/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, necesito cotizar un seguro para 50 personas"
  }'
```

**Esperado**: Respuesta de IA como Auditor Técnico:
```json
{
  "response": "Buenos días. Bienvenido al simulador. Necesitaré información de:",
  "usage": {
    "prompt_tokens": 245,
    "completion_tokens": 87,
    "total_tokens": 332
  }
}
```

#### 3.4: Ejecutar Acción (Cálculo)

```bash
curl -X POST http://localhost:5000/api/simulations/$SIMULATION_ID/action \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "calculation",
    "action_name": "calculate_premium",
    "data": {
      "num_people": 50,
      "sum_insured": 500000
    }
  }'
```

**Esperado**: Validación y cálculo:
```json
{
  "success": true,
  "result": {
    "premium_calculated": 4250,
    "currency": "ARS",
    "validation": "valid_calculation"
  }
}
```

#### 3.5: Ver Logs de Auditoría

```bash
curl "http://localhost:5000/api/simulations/$SIMULATION_ID/logs?limit=10"
```

**Esperado**: Array de logs con:
- `action`: Descripción legible
- `timestamp`: Hora exacta
- `metadata`: Datos de la acción
- `integrity_hash`: Validación criptográfica

---

## FASE 4️⃣ - CASOS AVANZADOS (15 minutos)

### Crisis Trigger: Siniestro Total (Minuto 10)

**Automático**: En la simulación ADM3534, después de 10 minutos verás:
- 🚨 Alerta roja en frontend
- 📢 Evento crítico en los logs
- 💬 IA cambia de rol (pasa a "resolver siniestro")

**Simular manualmente**:
```bash
curl -X POST http://localhost:5000/api/simulations/$SIMULATION_ID/action \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "trigger_crisis",
    "data": {
      "crisis_event": "total_claim",
      "amount": 500000
    }
  }'
```

---

## FASE 5️⃣ - INTEGRACIÓN FRONTEND-BACKEND (PENDIENTE)

**Estos archivos aún no están integrados:**

### TODO 1: Crear API Client Service

**Archivo**: `src/services/api.ts`

```typescript
// src/services/api.ts
const API_BASE = 'http://localhost:5000/api';

export const apiClient = {
  async startSimulation(userId: string, courseId: string) {
    const res = await fetch(`${API_BASE}/simulations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    });
    return res.json();
  },

  async getSimulation(simulationId: string) {
    const res = await fetch(`${API_BASE}/simulations/${simulationId}`);
    return res.json();
  },

  async sendMessage(simulationId: string, message: string) {
    const res = await fetch(
      `${API_BASE}/simulations/${simulationId}/message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      }
    );
    return res.json();
  },

  async executeAction(simulationId: string, action: any) {
    const res = await fetch(
      `${API_BASE}/simulations/${simulationId}/action`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      }
    );
    return res.json();
  },

  async getLogs(simulationId: string, limit = 50) {
    const res = await fetch(
      `${API_BASE}/simulations/${simulationId}/logs?limit=${limit}`
    );
    return res.json();
  },

  async getCourses() {
    const res = await fetch(`${API_BASE}/courses`);
    return res.json();
  },
};
```

### TODO 2: Conectar DynamicInterface al Backend

**Archivo**: `src/components/DynamicInterface.tsx`

En el hook `useEffect`:
```typescript
useEffect(() => {
  // 1. Si no hay simulación, iniciar
  if (!simulation && userId && courseId) {
    apiClient.startSimulation(userId, courseId)
      .then(sim => setSimulation(sim))
      .catch(err => console.error('Error:', err));
  }

  // 2. Actualizar timer cada segundo
  const interval = setInterval(() => {
    setElapsedMinutes(prev => prev + 1/60);
  }, 1000);

  return () => clearInterval(interval);
}, [userId, courseId, simulation]);
```

### TODO 3: Conectar CommunicationModule a /message

```typescript
// En CommunicationModule.tsx
const handleSendMessage = async (text: string) => {
  setIsLoading(true);
  try {
    const response = await apiClient.sendMessage(simulationId, text);
    // Agregar mensaje de usuario y respuesta de IA
    setMessages([
      ...messages,
      { role: 'user', content: text },
      { role: 'assistant', content: response.response }
    ]);
  } finally {
    setIsLoading(false);
  }
};
```

### TODO 4: Conectar ToolsModule a /action

```typescript
// En ToolsModule.tsx - Calculator
const handleCalculate = async () => {
  const response = await apiClient.executeAction(simulationId, {
    action_type: 'calculation',
    action_name: 'calculate_premium',
    data: { num_people, sum_insured }
  });
  setResult(response.result);
};
```

---

## 📋 CHECKLIST DE TESTING

### ✅ Tests Básicos (30 min)

- [ ] Backend inicia en puerto 5000
- [ ] MongoDB conecta exitosamente
- [ ] Datos se cargan (4 cursos en DB)
- [ ] Frontend inicia en puerto 5173
- [ ] GET /health retorna OK
- [ ] GET /api/courses retorna array
- [ ] Puedo iniciar simulación (POST /simulations/start)
- [ ] Puedo obtener simulación (GET /simulations/:id)
- [ ] Puedo enviar mensaje (POST /simulations/:id/message)

### ✅ Tests de Comportamiento (60 min)

- [ ] **ADM3534**: Calcular prima de seguros
- [ ] **ADM3534**: Crisis trigger a minuto 10
- [ ] **ADM5536**: Liquidar sueldo con cálculos
- [ ] **ADM5536**: Crisis AFIP a minuto 15
- [ ] **RH3657**: Conversación de pitch
- [ ] **INF28517B**: Validar código Python

### ✅ Tests de Seguridad (30 min)

- [ ] Rate limit bloquea >30 mensajes/min
- [ ] Prompt injection filter bloquea "ignora instrucciones"
- [ ] Hash de integridad se calcula en cada log
- [ ] CORS rechaza origen no autorizado
- [ ] Response time se registra en telemetría

### ✅ Tests de Responsiveness (20 min)

- [ ] Mobile (320px): Interfaz visible, tabs scrolleables
- [ ] Tablet (768px): 2-column layout correcto
- [ ] Desktop (1024px): 3-column dashboard visible

---

## 🆘 TROUBLESHOOTING

### "Port 5000 already in use"
```bash
# Encontrar proceso
lsof -i :5000

# Matar proceso
kill -9 <PID>
```

### "MongoDB connection failed"
```bash
# Verificar si MongoDB está activo
mongosh --eval "db.adminCommand('ping')"

# Si falla, iniciar:
docker run -d -p 27017:27017 mongo:latest
```

### "Cursos no cargados"
```bash
# Ejecutar seed manualmente
cd server
npx ts-node src/scripts/seedDatabase.ts
```

### "CORS error en frontend"
Asegúrate que `FRONTEND_URL` en `.env` coincida con URL del frontend.

### "500 Error en /message"
```bash
# Verificar logs
tail -f server/logs/*.log

# Si no tiene GEMINI_API_KEY, responderá con fallback
# Agregar key a .env y reiniciar servidor
```

---

## 📞 DOCUMENTACIÓN DE REFERENCIA

| Documento | Propósito |
|-----------|-----------|
| [LEER.md](./LEER.md) | Especificaciones originales |
| [README.md](./README.md) | Guía principal del proyecto |
| [server/README.md](./server/README.md) | API endpoints y ejemplos |
| [TEST_CASES.md](./TEST_CASES.md) | Casos de prueba detallados |
| [RESUMEN_IMPLEMENTACION.md](./RESUMEN_IMPLEMENTACION.md) | Resumen técnico completo |
| [PROXIMOS_PASOS.md](./PROXIMOS_PASOS.md) | Este archivo (roadmap) |

---

## 🎯 ORDEN RECOMENDADO

1. **YA**: Lee RESUMEN_IMPLEMENTACION.md (5 min)
2. **AHORA**: Sigue FASE 1-2 de este documento (10 min)
3. **LUEGO**: Sigue FASE 3-4 (20 min)
4. **DESPUÉS**: Implementa TODO 1-4 de FASE 5 (2-3 horas)
5. **FINALMENTE**: Ejecuta todos los tests del Checklist (120 min)

---

## 🚀 RESULTADO ESPERADO

**Después de completar todo:**

✅ Sistema completo funcionando end-to-end  
✅ 4 cursos base probados y validados  
✅ Logs de auditoría registrados en MongoDB  
✅ Crisis triggers funcionando  
✅ IA respondiendo según rol del curso  
✅ UI responsive en todos los dispositivos  

**Estimas de tiempo:**
- Setup: 15 minutos
- Testing básico: 30 minutos
- Testing avanzado: 60 minutos
- Integración frontend: 120 minutos
- **Total: 4-5 horas para sistema 100% operacional**

---

**Creado**: 5 de Marzo de 2026  
**Versión**: 2.0.0  
**Estado**: ✅ Lista para implementar

*¡Adelante con los próximos pasos!* 🚀

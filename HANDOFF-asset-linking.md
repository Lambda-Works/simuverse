# Handoff — Asset Linking: Emails, Crisis y Spreadsheet vinculados a Prácticas

**Date**: Jul 21, 2026
**Branch**: `feature/agent-fix-and-ui-polish`
**Stack**: Next.js 15 + NestJS 10 + Prisma + PostgreSQL 15 + shadcn/ui

---

## Objetivo

Hacer que los emails simulados, escenarios de crisis y planillas generados por el pipeline (pasos 8-10) se **disparen durante la simulación** en el momento correcto, vinculados a prácticas específicas del curso, con control total desde la UI de Ficha Técnica.

---

## Estado actual (lo que YA funciona)

| Capa | Estado |
|------|--------|
| Pipeline genera steps 8-10 | ✅ `analysis-pipeline.service.ts` lines 92-99, 249-351 |
| Se guardan en `TechSheet.pipeline_output` | ✅ JSONB con `step_8_emails`, `step_9_spreadsheet`, `step_10_crisis` |
| Frontend los muestra en StepOutput | ✅ `StepOutput.tsx` con `JSON.stringify` |
| Frontend los muestra en ConfigureTechSheetModal | ✅ `ConfigureTechSheetModal.tsx` Assets tab con mapSpreadsheet/mapCrisis |
| Bridge pipeline → simulación | ❌ **NO EXISTE** |

### Por qué no funciona en simulación

El pipeline guarda los assets en `TechSheet.pipeline_output`. La simulación lee de **otras fuentes**:

| Asset | Pipeline (origen) | Simulación (destino) | ¿Conectado? |
|-------|-------------------|---------------------|-------------|
| Emails | `TechSheet.pipeline_output.step_8_emails` | `Scenario.content.emails` → `EmailTrigger` → `GET /simulations/:id/emails` | ❌ |
| Crisis | `TechSheet.pipeline_output.step_10_crisis` | `CrisisEngine.getOrCreateCrisis()` con bancos hardcodeados | ❌ |
| Spreadsheet | `TechSheet.pipeline_output.step_9_spreadsheet` | `Scenario.content.spreadsheet` → `GET /simulations/:id/spreadsheet` | ❌ |

**La práctica actual se crea vía `syncPracticesToCourse()`** (analysis-pipeline.service.ts:829-918) que convierte `TechSheetTask` → `Scenario`. Cada Scenario tiene `content.tech_sheet_task_id` que es el puente natural para vincular assets.

---

## Diseño

### Decisión 1: Cardinalidad → Muchos por práctica
Una práctica puede disparar varios emails/crisis en distintos momentos (ej: email de bienvenida a los 2 min + email de seguimiento a los 30 min).

### Decisión 2: Asignación → Manual post-generación
El pipeline genera assets sueltos. El admin los vincula manualmente desde la UI. La UI muestra badges rojos "Sin vincular" hasta que se asigna.

### Decisión 3: Trigger → Por asset individual
Cada email/crisis define su propio `trigger_mode` ("time" o "messages") y `trigger_value`. Control granular.

### Decisión 4: Bridge → Leer de pipeline_output en runtime
En lugar de re-syncronizar Scenarios cada vez que el admin edita links, la simulación lee `TechSheet.pipeline_output` al iniciar cada práctica y filtra por `practice_id`.

---

## Cambios necesarios

### 1. Nuevos campos en pipeline_output assets

Cada email y crisis en `TechSheet.pipeline_output` gana 4 campos nuevos:

```json
// Email (step_8_emails[n])
{
  "subject": "Urgente del jefe",
  "body": "Necesito el reporte YA...",
  "trigger_condition": "after_start",
  "timing_minutes": 30,
  
  // NUEVOS — agregados por el admin desde la UI:
  "practice_id": "uuid-del-tech-sheet-task",    // vinculación a práctica
  "practice_title": "Reporte semanal",           // denormalizado para mostrar
  "trigger_mode": "time",                        // "time" | "messages"
  "trigger_value": 30                            // minutos o cantidad de msjs
}

// Crisis (step_10_crisis[n])
{
  "detonante": "Servidor caído",
  "descripcion": "El servidor principal...",
  "opciones_resolucion": ["Reiniciar", "Escalar"],
  
  // NUEVOS:
  "practice_id": "uuid-del-tech-sheet-task",
  "practice_title": "Guardia de sistemas",
  "trigger_mode": "messages",
  "trigger_value": 5
}
```

El spreadsheet (`step_9_spreadsheet`) **no necesita trigger** — es material de referencia, se vincula pero no se "dispara".

### 2. Frontend — ConfigureTechSheetModal.tsx

#### 2a. Agregar dropdown de práctica + trigger config a cada email card

En el bloque de emails (líneas ~730-821), cada card gana:

```tsx
{/* Badge de estado de vinculación */}
{!email.practice_id && (
  <Badge variant="destructive" className="mb-2">⚠ Sin vincular</Badge>
)}

{/* Selector de práctica */}
<div className="mb-2">
  <label className="text-xs text-gray-500">Práctica:</label>
  <Select
    value={email.practice_id || ''}
    onValueChange={(val) => {
      const task = config.tasks.find(t => t.id === val);
      const newEmails = [...config.assets.emails];
      newEmails[idx] = {
        ...email,
        practice_id: val,
        practice_title: task?.title || '',
      };
      setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
    }}
  >
    <SelectTrigger><SelectValue placeholder="Seleccionar práctica" /></SelectTrigger>
    <SelectContent>
      {config.tasks.map((task) => (
        <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{/* Trigger mode */}
<div className="grid grid-cols-2 gap-2 mb-2">
  <div>
    <label className="text-xs text-gray-500">Modo de disparo:</label>
    <div className="flex gap-2 mt-1">
      <label className="flex items-center gap-1 text-xs">
        <input type="radio" name={`trigger-${idx}`} checked={email.trigger_mode === 'time'}
          onChange={() => {
            const newEmails = [...config.assets.emails];
            newEmails[idx] = { ...email, trigger_mode: 'time' };
            setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
          }} />
        Tiempo
      </label>
      <label className="flex items-center gap-1 text-xs">
        <input type="radio" name={`trigger-${idx}`} checked={email.trigger_mode === 'messages'}
          onChange={() => {
            const newEmails = [...config.assets.emails];
            newEmails[idx] = { ...email, trigger_mode: 'messages' };
            setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
          }} />
        Mensajes
      </label>
    </div>
  </div>
  <div>
    <label className="text-xs text-gray-500">
      {email.trigger_mode === 'messages' ? 'Cant. mensajes' : 'Minutos'}:
    </label>
    <Input type="number" value={email.trigger_value || 0}
      onChange={(e) => {
        const newEmails = [...config.assets.emails];
        newEmails[idx] = { ...email, trigger_value: parseInt(e.target.value) || 0 };
        setConfig({ ...config, assets: { ...config.assets, emails: newEmails } });
      }} />
  </div>
</div>
```

#### 2b. Mismos cambios para crisis scenarios

En el bloque de crisis (líneas ~893-1047), agregar idénticos controles de vinculación + trigger.

#### 2c. Spreadsheet: solo vinculación, sin trigger

Agregar dropdown de práctica al spreadsheet (líneas ~823-891), sin trigger mode.

#### 2d. Actualizar `unmapAssets()`

Asegurar que los nuevos campos (`practice_id`, `practice_title`, `trigger_mode`, `trigger_value`) se incluyan en el mapeo de vuelta a `pipeline_output`.

#### 2e. Actualizar `EmailConfig` interface

Agregar los 4 campos nuevos:
```ts
interface EmailConfig {
  subject: string;
  body: string;
  trigger_condition: string;
  timing_minutes: number;
  practice_id?: string;
  practice_title?: string;
  trigger_mode?: 'time' | 'messages';
  trigger_value?: number;
}
```

Mismo para `CrisisScenario` y `SpreadsheetConfig`.

#### 2f. Importar componentes nuevos de shadcn

Agregar `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` y `Badge` (si no están ya).

### 3. Backend — Bridge: Pipeline output → Simulación

#### 3a. Nuevo servicio: `AssetDispatcherService`

Crear `apps/api-nest/src/simulations/assets/asset-dispatcher.service.ts`:

```ts
@Injectable()
export class AssetDispatcherService {
  // Mapa simulationId → { practiceId, timers, counters }
  private sessions = new Map<string, {
    practiceId: string;
    timers: NodeJS.Timeout[];
    messageCount: number;
    firedAssets: Set<string>; // asset index keys "email-0", "crisis-1"
  }>();

  /**
   * Called when a simulation instance starts or switches practice.
   * Loads linked assets from the tech sheet's pipeline_output,
   * filters by practice_id, and schedules dispatches.
   */
  async startPractice(instanceId: string, scenarioId: string): Promise<void> {
    // 1. Get scenario → get tech_sheet_id and tech_sheet_task_id
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: scenarioId },
    });
    const taskId = (scenario?.content as any)?.tech_sheet_task_id;
    const sheetId = (scenario?.content as any)?.tech_sheet_id;
    if (!taskId || !sheetId) return;

    // 2. Get tech sheet pipeline_output
    const sheet = await this.prisma.techSheet.findUnique({
      where: { id: sheetId },
    });
    const po = (sheet?.pipeline_output || {}) as Record<string, any>;

    // 3. Filter emails linked to this practice
    const practiceEmails = (po.step_8_emails || [])
      .filter((e: any) => e.practice_id === taskId);
    
    // 4. Filter crisis linked to this practice
    const practiceCrisis = (po.step_10_crisis || [])
      .filter((c: any) => c.practice_id === taskId);

    // 5. Set up dispatch tracking
    const timers: NodeJS.Timeout[] = [];
    const firedAssets = new Set<string>();

    // 6. Schedule time-based assets
    practiceEmails.forEach((email: any, i: number) => {
      if (email.trigger_mode === 'time' && email.trigger_value > 0) {
        const timer = setTimeout(() => {
          this.dispatchEmail(instanceId, email, i);
        }, email.trigger_value * 60 * 1000);
        timers.push(timer);
      }
    });

    practiceCrisis.forEach((crisis: any, i: number) => {
      if (crisis.trigger_mode === 'time' && crisis.trigger_value > 0) {
        const timer = setTimeout(() => {
          this.dispatchCrisis(instanceId, crisis, i);
        }, crisis.trigger_value * 60 * 1000);
        timers.push(timer);
      }
    });

    // 7. Store session state
    this.sessions.set(instanceId, {
      practiceId: taskId,
      timers,
      messageCount: 0,
      firedAssets,
    });
  }

  /**
   * Called on every user message. Checks message-count-based triggers.
   */
  onMessage(instanceId: string): { type: 'email' | 'crisis'; data: any }[] {
    const session = this.sessions.get(instanceId);
    if (!session) return [];

    session.messageCount++;
    const results: { type: 'email' | 'crisis'; data: any }[] = [];

    // Check message-count triggers
    // (needs to reload pipeline_output or keep it cached)
    // ... check practiceEmails and practiceCrisis with trigger_mode='messages'

    return results;
  }

  /**
   * Clean up timers when practice ends.
   */
  endPractice(instanceId: string): void {
    const session = this.sessions.get(instanceId);
    if (session) {
      session.timers.forEach(clearTimeout);
      this.sessions.delete(instanceId);
    }
  }
}
```

#### 3b. Integrar en el flujo de simulación

En `simulations.controller.ts`, método `sendMessage` (línea ~190):

1. Al iniciar práctica (`startNextPractice` en practices.service.ts o practices.controller.ts), llamar `assetDispatcher.startPractice(instanceId, scenarioId)`
2. En cada `sendMessage`, llamar `assetDispatcher.onMessage(instanceId)` para chequeo de triggers por mensajes
3. Inyectar los assets disparados como mensajes proactivos (similar a como `triggerResults` se inyectan en línea 266)

#### 3c. Adaptar EmailTrigger

`EmailTrigger.shouldFire()` actualmente lee de `ctx.scenario.content.emails`. Necesita también leer del `AssetDispatcherService` para ver si hay emails dispatchados (por timer o contador de mensajes) que aún no se mostraron.

Alternativa más simple: no modificar EmailTrigger. En su lugar, hacer que `AssetDispatcherService` inyecte directamente en `SessionMemory` o en un buffer que `sendMessage` lea antes de responder.

#### 3d. Adaptar CrisisEngine

`CrisisEngine.getOrCreateCrisis()` acepta `customEvents` (línea 129) pero **nadie lo llama con datos**. Hay que hacer que `AssetDispatcherService` llame `crisisEngine.getOrCreateCrisis(id, family, pipelineCrisisData)` cuando se dispara una crisis, pasando los datos del pipeline como `customEvents`.

El `customToEvent()` del CrisisEngine (línea 102-124) espera objetos con `{ title, description, severity, options }`. Los datos del pipeline (`step_10_crisis`) tienen `{ detonante, descripcion, opciones_resolucion }`. Necesitamos un mapper:

```ts
function mapPipelineCrisis(raw: any) {
  return [{
    title: raw.detonante || 'Crisis',
    description: raw.descripcion || '',
    severity: 'high',
    options: (raw.opciones_resolucion || []).map((opt: string) => ({
      text: opt,
      score: 100,
      feedback: '',
      tags: [],
    })),
  }];
}
```

### 4. Cambios en syncPracticesToCourse (opcional)

Cuando `syncPracticesToCourse()` crea Scenarios (línea 898), podría pre-embebe los assets ya vinculados en `Scenario.content.emails` y `Scenario.content.crisis`. Esto daría un fallback si el AssetDispatcher falla. Pero **no es necesario** si el dispatcher funciona correctamente.

---

## Orden de implementación

```
1. Frontend: agregar dropdowns de práctica + trigger config
   → ConfigureTechSheetModal.tsx
   → Actualizar interfaces EmailConfig, CrisisScenario, SpreadsheetConfig

2. Frontend: badge rojo "Sin vincular"
   → Mismo archivo, condicional en cada card

3. Frontend: actualizar unmapAssets() 
   → Incluir nuevos campos

4. Backend: crear AssetDispatcherService
   → Nuevo archivo + tests

5. Backend: integrar AssetDispatcher en simulation flow
   → simulations.controller.ts, practices.controller.ts

6. Backend: mapper pipeline crisis → CrisisEngine customEvents
   → Nueva función helper

7. Backend: DTO update para aceptar nuevos campos
   → update-tech-sheet-config.dto.ts (ya tiene pipeline_output)
```

---

## Archivos a modificar

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `apps/web/src/components/ConfigureTechSheetModal.tsx` | Frontend | Dropdowns práctica, trigger config, badges |
| `apps/api-nest/src/simulations/assets/asset-dispatcher.service.ts` | **NUEVO** | Backend | Scheduler de assets |
| `apps/api-nest/src/simulations/assets/asset-dispatcher.service.spec.ts` | **NUEVO** | Test | Unit tests del scheduler |
| `apps/api-nest/src/simulations/simulations.module.ts` | Backend | Registrar AssetDispatcherService |
| `apps/api-nest/src/simulations/simulations.controller.ts` | Backend | Integrar dispatcher en sendMessage |
| `apps/api-nest/src/simulations/practices.controller.ts` | Backend | Llamar startPractice al iniciar |
| `apps/api-nest/src/simulations/engines/crisis-engine.service.ts` | Backend | Helper mapPipelineCrisis |
| `apps/api-nest/src/catalog/dto/update-tech-sheet-config.dto.ts` | Backend | Asegurar que pipeline_output acepta nuevos campos |

---

## Constraints

- **NO cambiar** la estructura del pipeline (steps 8-10 generation)
- **NO cambiar** `syncPracticesToCourse()` a menos que sea estrictamente necesario
- **NO romper** la funcionalidad existente del ConfigureTechSheetModal (edición de emails/crisis/spreadsheet)
- **NO cambiar** los helpers `mapSpreadsheet`, `mapCrisis`, `unmapAssets` — solo extenderlos
- Los nuevos campos en `pipeline_output` deben ser **backward-compatible**: assets sin vincular deben seguir funcionando (simplemente no se disparan)

---

## Testing

### Backend
```bash
docker compose exec api-nest npx jest --testPathPattern="asset-dispatcher" --no-coverage
docker compose exec api-nest npx jest --testPathPattern="crisis-engine" --no-coverage
```

### Frontend
```bash
docker compose exec web npx vitest run src/components/__tests__/ConfigureTechSheetModal.assets.test.tsx
```

### Manual
1. Abrir Ficha Técnica → Ejecutar análisis (pipeline)
2. Abrir Configurar → Contenido tab
3. Verificar badges rojos "Sin vincular" en emails/crisis
4. Vincular un email a una práctica, seleccionar trigger_mode="messages", trigger_value=2
5. Guardar
6. Ir al curso → Iniciar simulación en esa práctica
7. Enviar 2 mensajes → verificar que el email se dispara
8. Repetir con trigger_mode="time" y trigger_value=1 → esperar 1 minuto

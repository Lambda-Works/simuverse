# 📘 GUÍA COMPLETA DE USO DE SIMUVERSE

## 1. INTRODUCCIÓN AL SISTEMA

**SIMUVERSE** es una plataforma de simulación educativa que permite a los estudiantes aprender mediante práctica inmersiva. El sistema tiene **dos niveles principales**:

### Nivel 1: SIMULACIONES DE PRÁCTICA (Learning)
- **Propósito:** Aprender experimentando
- **Características:** Hints disponibles, múltiples intentos, retroalimentación de IA detallada
- **Evaluación:** Formativa (para aprender, no califica)
- **Historial:** Se guarda TODO para análisis posterior

### Nivel 2: SIMULACIÓN DE EVALUACIÓN FINAL (Assessment)
- **Propósito:** Demostrar competencias adquiridas
- **Características:** Sin hints, máximo 1 intento, evaluación rigurosa
- **Evaluación:** Sumativa (califica definitivamente)
- **Criterios:** Objetivos y basados en 5 competencias clave

---

## 2. ESTRUCTURA DE USUARIOS

### 👑 Superadmin
**Email:** `admin@simuverse.edu` | **Password:** `Admin123!`

**Responsabilidades:**
- Gestionar todos los cursos
- Crear y configurar usuarios
- Asignar roles a profesores y ministerio
- Ver reportes globales

---

### 🏫 Profesor (Dr. José García)
**Email:** `profesor@simuverse.edu` | **Password:** `Prof123!`

**Responsabilidades:**
- Crear y editar cursos
- Cargar requisitos ministeriales
- Generar KPIs y tareas
- Monitorear progreso de estudiantes
- Proporcionar feedback manual cuando sea necesario
- Ver historial completo de decisiones de cada alumno

**Acciones clave:**
1. Ve al curso "Simulación de Gestión Empresarial"
2. Verás el historial del alumno Carlos Mendez con:
   - ✅ 2 simulaciones completadas (prácticas)
   - ▶️ 1 simulación en progreso (evaluación final)
3. Haz click en cada simulación para ver:
   - Decisiones tomadas
   - Evaluación de IA
   - Impacto en la empresa
   - Área de mejora

---

### 🏛️ Ministerio
**Email:** `ministerio@simuverse.edu` | **Password:** `Min123!`

**Responsabilidades:**
- Definir requisitos y competencias nacionales
- Cargar archivos con estándares (PDF, DOCX, XLS)
- Sistema extrae automáticamente:
  - Competencias requeridas
  - Indicadores de éxito
  - Estándares de evaluación

**Proceso:**
1. Sube archivo de "Requisitos Ministeriales 2026"
2. Sistema extrae 5 competencias clave:
   - Análisis Financiero
   - Toma de Decisiones
   - Gestión de RRHH
   - Comunicación
   - Resolución de Conflictos
3. Auto-genera KPIs y tareas para cada competencia

---

### 👨‍🎓 Estudiante (Carlos Mendez)
**Email:** `alumno@simuverse.edu` | **Password:** `Est123!`

**Flujo de aprendizaje:**
```
INICIO
  ↓
1. VER CURSO Y COMPETENCIAS REQUERIDAS
  ↓
2. REALIZAR 2 SIMULACIONES DE PRÁCTICA (con hints)
  ├─ Crisis Financiera (COMPLETADA: 78%)
  └─ Expansión Internacional (COMPLETADA: 82%)
  ↓
3. ANALIZAR FEEDBACK Y APRENDIZAJES
  ├─ IA explica cada decisión
  ├─ Identifica fortalezas y debilidades
  └─ Sugiere áreas de mejora
  ↓
4. SIMULACIÓN DE EVALUACIÓN FINAL (sin hints, 1 intento)
  ├─ Examen de Gestión Integral
  └─ Calificación definitoria
  ↓
5. HISTORIAL PERMANENTE
  └─ Todos los intentos guardados para portfolios
```

---

## 3. ESTRUCTURA DE COMPETENCIAS (KPIs)

Cada competencia tiene:

### KPI 1: Análisis Financiero (25%)
- **Objetivo:** Interpretar y analizar estados financieros
- **Tarea 1 (Práctica):** Crisis Financiera - analizar flujo de caja
- **Tarea 2 (Práctica):** Expansión - evaluar viabilidad financiera
- **Tarea 3 (Evaluación):** Examen con múltiples variables financieras

**Evaluación:**
- Insuficiente: < 60
- Aceptable: 60-70
- Bueno: 70-80
- Excelente: 80-90+

---

### KPI 2: Toma de Decisiones Estratégicas (30%)
- **Objetivo:** Decidir bajo presión con información incompleta
- **Práctica:** Experiencias con bajo riesgo (hints disponibles)
- **Evaluación:** Situación ambigua (sin ayuda)

---

### KPI 3: Gestión de Recursos Humanos (20%)
- **Objetivo:** Motivar y retener talento
- **Práctica:** Decisiones sobre personal con feedback
- **Evaluación:** Crisis con múltiples stakeholders

---

### KPI 4: Comunicación Empresarial (15%)
- **Objetivo:** Comunicar estrategia claramente
- **Practica:** Presentar decisiones con justificación
- **Evaluación:** Persuadir a inversores/accionistas

---

### KPI 5: Resolución de Conflictos (10%)
- **Objetivo:** Identificar y resolver tensiones organizacionales
- **Práctica:** Negociar con diferentes perspectivas
- **Evaluación:** Conflicto multi-dimensional

---

## 4. ESCENARIOS DE SIMULACIÓN

### 🎬 ESCENARIO 1: Crisis Financiera (PRÁCTICA)

**Contexto:**
```
Empresa: TechCorp Ltd
Situación: Crisis financiera inminente
Gastos mensuales: $180,000
Ingresos: $150,000
Efectivo disponible: $250,000
Deuda: $500,000
Empleados: 45
```

**Decisiones que enfrentará el alumno:**
1. ¿Reducir gastos? ¿Cuánto?
2. ¿Despedir empleados? ¿Cuántos?
3. ¿Buscar inversor? ¿Cuánta dilución aceptas?
4. ¿Renegociar deuda? ¿Con quién primero?

**Prompt de IA CORRECTO para esta tarea:**

```
ERES UN ASESOR FINANCIERO EXPERTO

Contexto: TechCorp enfrenta crisis
- Déficit mensual: $30,000
- Efectivo durará 8 meses
- Opciones: Cortes, inversor, refinanciamiento

Para CADA decisión del alumno:
1. Calcula impacto numérico específico
2. Proyecta 12 meses adelante
3. Evalúa impacto en empleados
4. Compara con alternativas
5. Proporciona puntuación 0-100

RÚBRICA:
- 80-100: Decisión óptima, justificación excelente
- 60-80: Decisión buena, pero hay mejores opciones
- 40-60: Decisión mediocre, requiere análisis más profundo
- 0-40: Decisión inadecuada, explica por qué

Ejemplo de feedback:
"Tu decisión de reducir 15% es buena (+15 puntos).
Pero dejaste dinero en la mesa: podrías haber negociado
mejor con proveedores (+10 puntos extras).
El despido fue proporcional, bien hecho.
Pero: ¿consideraste crear fondo de retención para talento clave?"
```

---

### 🎬 ESCENARIO 2: Expansión Internacional (PRÁCTICA)

**Contexto:**
```
Empresa: Global Commerce Inc
Mercados actuales: 3
Ingresos anuales: $5M
Budget de expansión: $800K
Empleados: 120

Oportunidades:
1. Brasil: $2M potencial, riesgo medio, inversión $500K
2. India: $3M potencial, riesgo alto, inversión $700K
3. México: $1.5M potencial, riesgo bajo, inversión $400K
```

**Decisiones:**
1. ¿Qué mercado(s) elegir?
2. ¿Con qué estrategia de entrada?
3. ¿Cómo estructurar los equipos?
4. ¿Cómo gestionar riesgos?

**Prompt de IA CORRECTO:**

```
ERES CONSULTOR DE ESTRATEGIA INTERNACIONAL

Tu rol: Evaluar decisiones de expansión

ANÁLISIS REQUERIDO para cada propuesta:
1. Análisis de ROI (retorno 3/5 años)
2. Riesgos geopolíticos/culturales
3. Capacidad operativa de la empresa
4. Probabilidad de éxito

DECISIONES MÁS COMUNES Y EVALUACIÓN:

SI ELIGE BRASIL + MÉXICO:
✅ Buen balance riesgo-retorno
✅ Presupuesto es suficiente ($900K con $100K buffer)
✅ Mercado de México conocido, menos riesgo
⚠️ Brazil requiere más inversión en infraestructura
Puntuación: 80-85

SI ELIGE SOLO INDIA:
❌ Demasiado riesgo para presupuesto
❌ Requiere mayor inversión en recursos humanos
❌ Vulnerabilidad si hay cambio político
Puntuación: 45-55

SI ELIGE LOS 3:
❌ Sobrepasas presupuesto ($1.6M vs $800K disponible)
❌ Dispersas recursos demasiado
❌ Imposible ejecutar bien en 3 mercados nuevos
Puntuación: 30-40

Proporciona:
- Matriz de evaluación
- Proyecciones por escenario
- Recomendación personalizada
- Justificación rigurosa
```

---

### 🎯 ESCENARIO 3: Examen Final - Gestión Integral (EVALUACIÓN)

**Contexto:**
```
Empresa: Industrial Solutions Corp
Situación: CRÍTICA - 5 desafíos simultáneos

1. Competencia agresiva de startup
2. Baja moral de empleados
3. Tecnología obsoleta
4. Presión de deuda bancaria
5. Cambios regulatorios inminentes

Recursos:
- Cash: $1.2M
- Ingresos mensuales: $450K
- Gastos mensuales: $380K
- Empleados: 180
- Deuda: $2M
- Market share: 25%
```

**Evaluación RIGUROSA en 5 áreas:**

```
RÚBRICA DE EXAMEN FINAL (Máximo 100 puntos)

1. ANÁLISIS FINANCIERO (25 puntos)
   - ¿Identifica el verdadero problema? (5 pts)
   - ¿Proyecta con realismo? (5 pts)
   - ¿Encuentra palancas de mejora? (5 pts)
   - ¿Evita trampas financieras? (5 pts)
   - ¿Decisiones tiene base numérica? (5 pts)

2. DECISIONES ESTRATÉGICAS (30 puntos)
   - ¿Decisiones alinean con supervivencia? (10 pts)
   - ¿Visión a largo plazo? (10 pts)
   - ¿Balance entre corto/largo plazo? (10 pts)

3. GESTIÓN DE RECURSOS HUMANOS (20 puntos)
   - ¿Cuida talento clave? (7 pts)
   - ¿Comunicación es efectiva? (7 pts)
   - ¿Motiva en crisis? (6 pts)

4. COMUNICACIÓN Y JUSTIFICACIÓN (15 puntos)
   - ¿Articula visión claramente? (8 pts)
   - ¿Justificaciones son persuasivas? (7 pts)

5. RESOLUCIÓN DE CONFLICTOS (10 puntos)
   - ¿Identifica conflictos? (3 pts)
   - ¿Busca soluciones ganar-ganar? (4 pts)
   - ¿Gestiona stakeholders? (3 pts)

NOTA FINAL = suma de 5 áreas

APROBADO: >= 60 puntos
BUENO: 70-79
MUY BUENO: 80-89
EXCELENTE: 90-100
```

---

## 5. EVALUACIÓN CON INTELIGENCIA ARTIFICIAL

### 🤖 Cómo funciona el feedback de IA

**FASE 1: DURANTE LA PRÁCTICA**

```
Alumno toma decisión → IA analiza en TIEMPO REAL

Ejemplo de feedback:
┌─────────────────────────────────────────┐
│ DECISIÓN: Reducir gastos 15%            │
├─────────────────────────────────────────┤
│ ✅ FORTALEZAS:                          │
│  • Actúas rápido (positivo en crisis)   │
│  • Cálculo matemático correcto          │
│  • Consideras impacto en empleados      │
│                                         │
│ ⚠️  ÁREAS DE MEJORA:                     │
│  • Podrías haber llegado a 20%          │
│  • ¿Consultaste con equipos afectadas? │
│  • ¿Hay alternativas menos drásticas?  │
│                                         │
│ 💡 ALTERNATIVAS:                       │
│  A) 20% reducción + buscar inversor    │
│  B) Outsourcing de funciones           │
│  C) Renegociar con proveedores         │
│                                         │
│ 📊 PUNTUACIÓN: 76/100                  │
│ Retroalimentación: Buena decisión,     │
│ pero hay espacio para mejora            │
└─────────────────────────────────────────┘
```

---

**FASE 2: DESPUÉS DE COMPLETAR (HISTORIAL)**

```
El profesor ve un resumen como:

Carlos Mendez - Simulación: Crisis Financiera

DECISIÓN 1: Reducir gastos 15%
├─ Score: 76/100
├─ Impacto: Ahorros de $27K/mes
├─ Feedback de IA: ✅ Buena ejecución
└─ Tu evaluación: [El profesor puede agregar feedback manual]

DECISIÓN 2: Despedir 8 empleados
├─ Score: 72/100
├─ Impacto: Ahorros de $96K/mes
├─ Feedback de IA: ⚠️ Necesario pero duro
└─ Mejora sugerida: Programa de outplacement

DECISIÓN 3: Buscar inversor $500K
├─ Score: 88/100
├─ Impacto: Capital injection + visibilidad
├─ Feedback de IA: ✅ Pensamiento estratégico
└─ Lección: Plan B efectivo

PROMEDIO GENERAL: 78/100 - BUENO
```

---

**FASE 3: EVALUACIÓN FINAL (SIN HINTS)**

```
En la simulación de evaluación, el IA:

1. NO proporciona hints
2. NO sugiere alternativas
3. SÍ proporciona datos crudos
4. Evaluación es OBJETIVA y RIGUROSA

Rúbrica automática:
- Decisión correcta (90+)
- Decisión aceptable (70-89)
- Decisión problemática (50-69)
- Decisión inadecuada (<50)

Ejemplo de evaluación final:
"Tu análisis financiero es sólido (85/100).
Pero tu estrategia de RRHH fue débil (55/100).
No consideraste impacto emocional en crisis.
Nota final: 72/100 - APROBADO"
```

---

## 6. HISTORIAL Y APRENDIZAJE

### 📊 Qué ve el estudiante

**Mi Historial de Aprendizaje:**

```
Competencia: Análisis Financiero
├─ Tarea 1 (Práctica): Crisis Financiera
│  ├─ Fecha: 4 de marzo
│  ├─ Decisiones tomadas: 3
│  ├─ Score promedio: 78/100
│  ├─ Tiempo: 35 minutos
│  ├─ Feedback clave:
│  │  "Tu capacidad de proyectar flujos es excelente.
│  │   Mejora: ser más agresivo en negociación"
│  └─ Lecciones aprendidas:
│     "Entendí la importancia del cash management"
│
├─ Tarea 2 (Práctica): Expansión Internacional
│  ├─ Fecha: 5 de marzo
│  ├─ Decisiones tomadas: 2
│  ├─ Score promedio: 82/100
│  ├─ Evolución: +4 puntos respecto a tarea 1 ✅
│  └─ Lecciones:
│     "Mejor análisis de viabilidad financiera"
│
└─ Tarea 3 (Evaluación): Examen Final
   ├─ Fecha: 6 de marzo (EN PROGRESO)
   ├─ Score estimado: 78/100
   ├─ Estado: Fase 2 de 3
   └─ Evaluación: EN CURSO...
```

---

### 👨‍🏫 Qué ve el profesor

**Reporte de Estudiante: Carlos Mendez**

```
COMPETENCIA: Análisis Financiero

Evolución:
  Práctica 1: 78% → Práctica 2: 82% → Evaluación: 78% (en progreso)
  
Análisis:
  ✅ Mejora entre práctica 1 y 2
  ⚠️  Score en evaluación retrocede
  💡 Posible: Presión, falta de hints
  
Fortalezas:
  • Cálculos precisos
  • Proyecciones realistas
  • Considera múltiples variables
  
Áreas de mejora:
  • Negociación (no presiona lo suficiente)
  • Creatividad (busca soluciones convencionales)
  
Recomendación del profesor:
  "Carlos necesita retroalimentación sobre negociación.
   Sugiero 1:1 antes del examen final para practicar 
   conversaciones con acreedores."
```

---

## 7. FLUJO COMPLETO DE USO

### Para el Alumno:

```
PASO 1: ENTRA AL SISTEMA
  ↓
  → Email: alumno@simuverse.edu
  → Password: Est123!

PASO 2: VE EL CURSO Y COMPETENCIAS
  ↓
  Verá: "Simulación de Gestión Empresarial"
  Con 5 competencias requeridas:
  ✓ Análisis Financiero
  ✓ Toma de Decisiones
  ✓ Gestión RRHH
  ✓ Comunicación
  ✓ Resolución de Conflictos

PASO 3: ACCEDE A SIMULACIONES DE PRÁCTICA
  ↓
  A) Crisis Financiera (COMPLETADA)
     - Haz clic para VER HISTORIAL
     - Lee decisiones + feedback
     - Analiza qué aprendiste
  
  B) Expansión Internacional (COMPLETADA)
     - Compara tu desempeño
     - Mejoraste en 4 puntos ✅
     - Entiende por qué

PASO 4: CONTINÚA EXAMEN FINAL
  ↓
  - 65% completado
  - Fase 2 de 3
  - Continúa desde donde dejaste
  - Sin hints disponibles
  - Evaluación rigurosa

PASO 5: FINALIZA Y OBTÉN CALIFICACIÓN
  ↓
  - Nota final en 5 competencias
  - Aprobado/Desaprobado
  - Certificado si es > 70%
```

---

### Para el Profesor:

```
PASO 1: ENTRA AL SISTEMA
  ↓
  → Email: profesor@simuverse.edu
  → Password: Prof123!

PASO 2: VE EL CURSO Y ESTUDIANTES
  ↓
  Curso: "Simulación de Gestión Empresarial"
  Estudiantes: 1 (Carlos Mendez en demo)

PASO 3: ANALIZA PROGRESO DE CARLOS
  ↓
  - 2 prácticas completadas (HISTORIAL)
  - 1 evaluación en progreso
  - Desempeño general: 79% promedio

PASO 4: REVISA CADA SIMULACIÓN
  ↓
  Para cada una, verás:
  • Todas las decisiones tomadas
  • Evaluación de IA
  • Tiempo dedicado
  • Errores cometidos
  • Impacto en empresa virtual
  
PASO 5: PROPORCIONA FEEDBACK
  ↓
  Haz clic en "Agregar comentario"
  Ejemplo:
  "Carlos, excelente análisis en Crisis.
   Para expandirte, necesitas ser más agresivo
   en negociación. Tenemos 1:1 mañana para practicar."

PASO 6: MONITOREA EXAMEN EN VIVO
  ↓
  - Score en tiempo real: 78/100
  - Decisiones que toma (actualización en vivo)
  - Puedes intervenir si es necesario
```

---

### Para Ministerio:

```
PASO 1: ENTRA AL SISTEMA
  ↓
  → Email: ministerio@simuverse.edu
  → Password: Min123!

PASO 2: CARGA REQUISITOS
  ↓
  - Upload de archivo: "Requisitos 2026.pdf"
  - Sistema EXTRAE automáticamente:
    ✓ 5 competencias clave
    ✓ Descripción de cada una
    ✓ Niveles de profundidad

PASO 3: REVISA KPIs GENERADOS
  ↓
  Sistema auto-genera:
  • 5 KPIs (uno por competencia)
  • 15 tareas (3 por KPI: 2 práctica, 1 evaluación)
  • Rúbricas de evaluación

PASO 4: AJUSTA SI ES NECESARIO
  ↓
  "Me gusta, pero ajusta pesos:
   - Análisis Financiero: 25% → 30%
   - Comunicación: 15% → 10%"

PASO 5: APRUEBA Y ACTIVA
  ↓
  - Requisitos pasan a estado: "ACTIVO"
  - Profesores pueden usarlos
  - Estudiantes ven competencias requeridas
```

---

## 8. PROMPTS CORRECTOS PARA DISTINTOS ESCENARIOS

### 📝 PROMPT PARA PRÁCTICA (CON HINTS)

```
Eres un entrenador empresarial experto en {COMPETENCIA}.

CONTEXTO:
{SITUACIÓN_ACTUAL}

DECISIÓN DEL ALUMNO:
{DECISION}

Tu evaluación debe incluir:
1. ¿Fue correcta la decisión? (Sí/No/Parcial)
2. Puntuación de 0-100
3. 2-3 fortalezas de la decisión
4. 2-3 áreas de mejora
5. 2-3 alternativas mejores (SIN DECIR LA RESPUESTA)
6. Impacto numérico (si aplica)
7. Pregunta reflexiva para que piense más

TONE: Empático pero riguroso. El objetivo es ENSEÑAR, no castigar.

Máximo 300 palabras en respuesta.
```

---

### 🎯 PROMPT PARA EVALUACIÓN (SIN HINTS)

```
Eres un evaluador profesional de competencias empresariales.

CONTEXTO:
{SITUACIÓN_CRÍTICA}

DECISIÓN DEL ALUMNO:
{DECISION}

Tu evaluación debe ser OBJETIVA:
1. Puntuación 0-100 (sin descuentos por intención)
2. ¿Merece esta nota? Justificación rigurosa
3. Impacto en la empresa (numérico)
4. Una frase de veredicto final
5. NO sugerencias de mejora (es evaluación final)

CRITERIOS:
- Exactitud: ¿Es matemáticamente correcto?
- Estrategia: ¿Alinea con objetivos?
- Realismo: ¿Es viable en práctica?
- Integridad: ¿Considera valores empresariales?

TONE: Profesional y neutral. Como evaluador de examen.

Máximo 200 palabras.
```

---

## 9. CÓMO CARGAR EL SCRIPT DE DATOS

### Para cargar todos los datos de ejemplo:

```bash
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server
npm run seed-example
```

Esto cargará:
✅ 4 usuarios (admin, profesor, ministerio, alumno)
✅ 1 curso completo
✅ 5 KPIs con sus tareas
✅ 3 escenarios (2 práctica, 1 evaluación)
✅ 2 simulaciones completadas del alumno
✅ 1 simulación en progreso
✅ Historial de decisiones con evaluaciones

---

## 10. API ENDPOINTS PARA INTEGRACIÓN

### Traer simulaciones del estudiante:
```bash
GET /api/ministry/tasks/next?student_id={id}&course_id={id}
Response: Próxima tarea que debe hacer
```

### Ver historial completo:
```bash
GET /api/ministry/tasks/course/{course_id}?student_id={id}
Response: Todas las simulaciones completadas + feedback
```

### Obtener KPIs de un curso:
```bash
GET /api/ministry/kpis/course/{course_id}
Response: 5 competencias requeridas con sus criterios
```

---

## 11. CONCLUSIÓN

Este sistema implementa un ciclo completo de aprendizaje:

```
CONOCIMIENTO
     ↓
PRÁCTICA (feedback frecuente)
     ↓
ANÁLISIS (historia de decisiones)
     ↓
EVALUACIÓN (sin ayuda, objetiva)
     ↓
CERTIFICACIÓN (si aprobó)
```

Cada alumno tiene un **historial permanente** de:
- Decisiones tomadas
- Evaluaciones de IA
- Feedback de profesor
- Puntuaciones en 5 competencias
- Evidencia de aprendizaje

Perfecto para portfolios, auditoría ministerial, y evaluación de impacto de capacitación.

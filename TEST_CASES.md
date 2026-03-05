# 🧪 Guía de Casos de Prueba - MSM FEPEI 360

## Cómo Ver y Probar los Cursos

### 1. Iniciar el Sistema

```bash
# Terminal 1: Backend (Puerto 5000)
cd server
npm run seed     # Carga los 4 cursos
npm run dev

# Terminal 2: Frontend (Puerto 5173)
npm run dev
```

Accede a: `http://localhost:5173`

### 2. Verificar que los Cursos están Cargados

```bash
# En otra terminal, verifica que MongoDB tiene los cursos:
curl http://localhost:5000/api/courses

# Respuesta esperada:
[
  {
    "_id": "...",
    "course_id": "ADM3534",
    "title": "Asistente Certificado en Seguros de Vida e Intermediación",
    "family": "administracion",
    "modules": ["email_simulado", "documentos", "hoja_calculo", "chat_ia"],
    ...
  },
  ...
]
```

## 📋 CASO 1: ADM3534 - Seguros

### Escenario
Un cliente solicita una póliza de vida para 50 empleados con capital de $500.000 c/u.

### Pasos de Prueba

1. **Iniciar simulación**
```bash
curl -X POST http://localhost:5000/api/simulations/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_seguros",
    "courseId": "ADM3534",
    "scenarioId": "scenario_cotizacion"
  }'
```

Respuesta: Obtendrás `simulation_id`: `507f...`

2. **El alumno revisa el primer email (Inbox)**
   - Email de cliente: "Solicitud de póliza"
   - El frontend mostrará un inbox con el mensaje

3. **Abrir la Calculadora de Primas**
   - La calculadora debe calcular: `Prima = Capital * Tasa / 1000`
   - Para $500.000 con tasa 8.5 = $4.250 mensual

4. **Enviar respuesta a cliente**
```bash
curl -X POST http://localhost:5000/api/simulations/507f.../message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_seguros",
    "courseId": "ADM3534",
    "message": "La prima mensual para 50 pólizas de $500.000 es de $212.500. Tasa aplicada: 8.5 por mil",
    "conversationHistory": []
  }'
```

**Respuesta esperada de IA**:
> "Como auditor técnico, debo validar tu cálculo. ¿Consideraste los ajustes de riesgo según el perfil profesional de los empleados?"

5. **Crisis Trigger (a los 10 minutos)**
   - Evento: "Llega siniestro total - Póliza ASE-2024-001"
   - Alert rojo aparecerá en pantalla
   - Alumno debe procesar el reclamo

### Criterios de Éxito
- ✅ Cálculo exacto de prima
- ✅ Documentación completa (póliza, acta de defunción si aplica)
- ✅ Respuesta en menos de 15 minutos al siniestro
- ✅ Lenguaje formal y profesional

---

## 📋 CASO 2: ADM5536 - Liquidación de Sueldos

### Escenario
Liquidar el sueldo de Juan Pérez, chofer de camión:
- Salario base: $85.000
- Días trabajados: 22
- Horas extras: 8
- Feriado: 1 día

### Pasos de Prueba

1. **Iniciar simulación**
```bash
curl -X POST http://localhost:5000/api/simulations/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_sueldos",
    "courseId": "ADM5536",
    "scenarioId": "scenario_juan_perez"
  }'
```

2. **Abrir la Calculadora y Completar Datos**
   - Salario Base: 85000
   - Días Trabajados: 22
   - Horas Extras: 8

3. **Hacer Clic en "Calcular"**
   
   **Cálculos esperados**:
   - Salario diario: 85000 / 30 = $2.833,33
   - Básico: 2.833,33 * 22 = $62.333
   - Horas Extra: 8 * (2.833,33 / 8) * 1.5 = $4.250
   - Aportes (16%): (62.333 + 4.250) * 0.16 = $10.653,28
   - **Neto a pagar: $55.929,72**

4. **Enviar respuesta a IA**
```bash
curl -X POST http://localhost:5000/api/simulations/.../message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_sueldos",
    "courseId": "ADM5536",
    "message": "Liquidación completa. Neto: $55.929,72. Aportes descuentados según CCT 130/75 vigente",
    "conversationHistory": []
  }'
```

**Respuesta de IA**:
> "¿Incluiste el recargo del feriado según el artículo 226 de la LCT? Verifica si 1 feriado corresponde recargo del 100%..."

5. **Crisis Trigger (a los 15 minutos)**
   - "Cambio en escala AFIP: modificar 5 liquidaciones"

### Criterios de Éxito
- ✅ Cálculos exactos
- ✅ Aplicación correcta de descuentos
- ✅ Cumplimiento CCT
- ✅ Presentación del recibo

---

## 📋 CASO 3: RH3657 - Oratoria y Storytelling

### Escenario
El alumno debe presentar un pitch de inversión en 5 minutos ante un "inversor crítico"

### Pasos de Prueba

1. **Iniciar simulación**
```bash
curl -X POST http://localhost:5000/api/simulations/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_oratoria",
    "courseId": "RH3657",
    "scenarioId": "scenario_pitch"
  }'
```

2. **El frontend muestra instrucciones**
   - "Tienes 5 minutos para convencer al inversor"
   - Chat abierto con el "inversor"

3. **Alumno envía su pitch**
```bash
curl -X POST http://localhost:5000/api/simulations/.../message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_oratoria",
    "courseId": "RH3657",
    "message": "Buenos días. Mi propuesta es revolucionar el e-commerce local. Hemos identificado un mercado de $50M sin soluciones integradas. Nuestro diferenciador: IA predictiva + interface intuitiva. Esperamos capturar 5% en año 1, valorizando en $25M.",
    "conversationHistory": []
  }'
```

**Respuesta de IA (Inversor)**:
> "Interesante. Pero ¿cómo compites contra Amazon? ¿Cuál es tu estrategia de retención de clientes? Dame números concretos."

4. **Crisis Trigger (a los 3 minutos)**
   - Inversor interrumpe con pregunta difícil
   - Presión psicológica: "¿Seguro de eso?"

### Criterios de Éxito
- ✅ Estructura clara (Problema → Solución → Valor → Números)
- ✅ Uso de datos y evidencia
- ✅ Responde objeciones con seguridad
- ✅ Tono profesional y entusiasta
- ✅ Cierre strong

---

## 📋 CASO 4: INF28517B - Automatización con IA

### Escenario
Escribir un script Python que valide un número de serie industrial con formato: `XXX-####-YY`

### Pasos de Prueba

1. **Iniciar simulación**
```bash
curl -X POST http://localhost:5000/api/simulations/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_ia",
    "courseId": "INF28517B",
    "scenarioId": "scenario_serial_validator"
  }'
```

2. **Abrir pestaña "Código"**
   - Instructions: "Escribe un validador de números de serie"

3. **Alumno escribe código**
```bash
curl -X POST http://localhost:5000/api/simulations/.../action \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_ia",
    "courseId": "INF28517B",
    "actionType": "code_submission",
    "actionData": {
      "code": "import re\n\ndef validate_serial(serial):\n    pattern = r'^[A-Z]{3}-\\d{4}-[A-Z]{2}$'\n    if re.match(pattern, serial):\n        return True, 'Válido'\n    return False, 'Formato inválido'\n\n# Test\nprint(validate_serial('ABC-1234-XY'))  # True\nprint(validate_serial('AB-1234-XY'))    # False"
    }
  }'
```

**Respuesta esperada**:
```json
{
  "validation": {
    "valid": true,
    "score": 85,
    "message": "Código válido. Buena estructura, pero falta try-except para robustez."
  },
  "response_time_ms": 325
}
```

4. **Crisis Trigger (a los 5 minutos)**
   - Sensor fallando → Parse 10.000 líneas de logs
   - Tiempo límite: 10 minutos

### Criterios de Éxito
- ✅ Regex exacta
- ✅ Manejo de excepciones
- ✅ Código documentado
- ✅ Performance (< 100ms para 1M validaciones)

---

## 🔍 Verificar Logs de Auditoría

### Ver todos los logs de una simulación

```bash
SIMULATION_ID="507f1f77bcf86cd799439011"

curl http://localhost:5000/api/simulations/$SIMULATION_ID/logs
```

**Respuesta esperada**:
```json
[
  {
    "_id": "...",
    "simulation_id": "507f...",
    "user_id": "test_user_seguros",
    "course_id": "ADM3534",
    "action": "Simulación iniciada",
    "action_type": "navigation",
    "timestamp": "2026-03-05T17:30:45Z",
    "response_time_ms": 120,
    "integrity_hash": "a1b2c3d4e5f6...",
    "metadata": { "scenario_id": "scenario_cotizacion" }
  },
  {
    "action": "Calculó prima de seguros",
    "action_type": "calculation",
    "metadata": { "sum_insured": 500000, "result": 4250 }
  },
  ...
]
```

**Este es el JSON que se presenta al Ministerio como prueba de práctica profesionalizante.**

---

## 📊 Dashboard de Monitoreo (Próximo)

En desarrollo:
- Vista en tiempo real de alumnos en simulación
- Gráficos de desempeño por curso
- Exportación de reportes PDF con firma digital

---

## ✅ Checklist de Validación

Para validar que todo funciona correctamente:

- [ ] Backend inicia sin errores (http://localhost:5000/health → `{"status":"ok"}`)
- [ ] 4 cursos cargados en MongoDB (`GET /api/courses` retorna 4 documentos)
- [ ] Se puede iniciar una simulación sin errores
- [ ] Mensajes se envían a IA y regresan respuestas
- [ ] Los logs se registran en MongoDB con hash de integridad
- [ ] Los crisis triggers disparan en los tiempos correctos
- [ ] El frontend es responsive (mobile/tablet/desktop)
- [ ] No hay errores de CORS

---

## 🐛 Troubleshooting

**Error: MongoDB connection refused**
```bash
# Asegúrate que MongoDB está running:
docker ps | grep mongodb
# Si no aparece, inicia MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Error: Port 5000 already in use**
```bash
# Cambiar puerto en server/.env
PORT=5001
```

**Error: API key de Gemini no configurada**
```bash
# Editar server/.env
GEMINI_API_KEY=your_key_here
# O el backend retornará respuestas simuladas (para testing)
```

---

## 📞 Preguntas?

Contacto: equipo@fepei.org.ar  
Documentación: ./server/README.md

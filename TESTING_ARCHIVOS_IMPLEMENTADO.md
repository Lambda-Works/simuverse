# 🧪 GUÍA DE TESTING - SISTEMA DE ARCHIVOS MEJORADO

## ✅ FIX 1.6: Sistema de Almacenamiento de Archivos

**Problema Resuelto:**
- ❌ ANTES: Error "Data too long for column 'file_url'" al adjuntar archivos
- ✅ DESPUÉS: Archivos se guardan en disco (/server/uploads/tech-sheets/), BD solo almacena ruta

---

## 📋 Cambios Implementados

### Backend
1. **FileStorageService.ts** (NUEVO)
   - Valida tipos: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, TXT
   - Límite: 50 MB por archivo
   - Almacena en: `/server/uploads/tech-sheets/`
   - BD almacena: ruta relativa (`tech-sheets/uuid.pdf`)

2. **catalog.ts** - Actualizaciones
   - `POST /tech-sheets`: Ahora usa multer para multipart/form-data
   - `GET /tech-sheets/files/download/:filePath`: Nuevo endpoint para descargar

3. **TechSheetsABM.tsx** - Cambios Frontend
   - `handleFileChange()`: Valida tipo y tamaño en cliente
   - `handleSubmit()`: Usa FormData en lugar de JSON

---

## 🧪 PASO A PASO DE TESTING

### Prerequisitos
```bash
# Backend ejecutándose
cd /server
npm start   # Puerto 5000

# Frontend ejecutándose
npm run dev  # Puerto 5173

# Acceso a BD
mysql -u simuverse -p"CHANGE_ME_PASSWORD" simuverse
```

---

### TEST 1: Crear Ficha Técnica CON ARCHIVO

**Objetivo:** Verificar que se puede adjuntar archivo sin error de tamaño

**Pasos:**
1. Ir a http://localhost:8080/admin → Fichas Técnicas
2. Click "Agregar Nueva Ficha"
3. Completa form:
   - Nombre: "Ficha Test PDF"
   - Curso: Selecciona "TIENDAS-ONLINE-2026-01"
   - Descripción: "Test de PDF"
   - Adjunta archivo: **pequeño PDF** (< 5 MB)
4. Click "Guardar"

**Resultado Esperado:**
```
✅ POST http://localhost:5000/api/tech-sheets
   Status: 201 Created
   Response: { 
     id: 1, 
     name: "Ficha Test PDF",
     file_url: "tech-sheets/uuid.pdf",  ← Ruta relativa, NO base64
     file_info: {
       id: "uuid-value",
       original_name: "documento.pdf",
       size_bytes: 245631,
       mime_type: "application/pdf",
       stored_at: "2026-03-13T..."
     }
   }
```

**Verificación en BD:**
```sql
mysql> SELECT id, name, file_url, LENGTH(file_url) as url_length FROM tech_sheets;
+----+------------------+-----------------------+-----------+
| id | name             | file_url              | url_length |
+----+------------------+-----------------------+-----------+
| XX | Ficha Test PDF   | tech-sheets/uuid.pdf  | 28        | ← Corto, NO base64
+----+------------------+-----------------------+-----------+
```

**Verificación en Disco:**
```bash
ls -lah /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server/uploads/tech-sheets/
# Debe verse el archivo UUID.pdf guardado
```

---

### TEST 2: Intentar Adjuntar Archivo No Permitido

**Objetivo:** Verificar que se rechaza tipo de archivo inválido

**Pasos:**
1. Intenta adjuntar archivo .exe, .zip, o .doc_personalizado
2. Debe mostrar error **ANTES** de enviar al servidor

**Resultado Esperado:**
```
❌ "Tipo de archivo no permitido: application/x-msdownload
Soportados: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, TXT"
```

---

### TEST 3: Intentar Adjuntar Archivo > 50 MB

**Objetivo:** Verificar validación de tamaño

**Pasos:**
1. Crea archivo ficticio de 60 MB
2. Intenta adjuntarlo

**Resultado Esperado:**
```
❌ "Archivo demasiado grande: 60.00 MB
Máximo: 50 MB"
```

---

### TEST 4: Descargar Archivo Adjunto

**Objetivo:** Verificar que se puede descargar el archivo guardado

**Pasos:**
1. En lista de fichas, busca la que has creado con archivo
2. Debe haber botón de descarga o icono
3. Click para descargar

**Resultado Esperado:**
```
✅ GET /api/tech-sheets/files/download/tech-sheets/uuid.pdf
   Status: 200 OK
   Content-Type: application/pdf
   File descargado con mismo contenido original
```

---

### TEST 5: Analizar Ficha CON ARCHIVO

**Objetivo:** Verificar que POST /analyze funciona con archivo

**Pasos:**
1. Crea ficha con archivo PDF
2. Click botón "Analizar"

**Resultado Esperado:**
```
✅ POST /api/tech-sheets/32/analyze
   Status: 200 OK
   Response: {
     message: "Ficha técnica analizada con éxito",
     summary: {
       competencies_count: > 0,
       kpis_count: > 0,
       tasks_count: > 0
     }
   }
```

**Verificación en BD:**
```sql
mysql> SELECT COUNT(*) FROM kpis WHERE course_id = 'uuid-curso';
+----------+
| COUNT(*) |
+----------+
| 3+       | ← Debe haber KPIs nuevos
+----------+

mysql> SELECT COUNT(*) FROM tasks WHERE course_id = 'uuid-curso';
+----------+
| COUNT(*) |
+----------+
| 9+       | ← 3 tasks por KPI (2 práctica + 1 eval)
+----------+
```

---

## 🚨 CASOS PROBLEMÁTICOS

### Problema 1: "Content-Type: application/octet-stream"
**Síntoma:** Archivo se descarga pero pierde extensión  
**Causa:** MIME type no detectado  
**Solución:** Verificar que ext coincide con registro en FileStorageService

### Problema 2: "Path traversal attack"
**Síntoma:** Intenta descargar `/../../etc/passwd`  
**Protección:** Código valida `path.normalize()` y verifica que esté en uploadDir  
**Status:** ✅ SEGURO

### Problema 3: "multer error: Request entity too large"
**Síntoma:** Cuando archivo > 50MB  
**Validación:** Doble validación (cliente + servidor)  
**Status:** ✅ OK, error claramente comunicado

---

## 📊 VERIFICACIÓN FINAL

**Checklist de Success:**

- [ ] Crear ficha con PDF pequeño → éxito
- [ ] Crear ficha con DOC pequeño → éxito
- [ ] Crear ficha con DOCX pequeño → éxito
- [ ] Crear ficha con PNG → éxito
- [ ] Crear ficha con CSV → éxito
- [ ] Intentar .exe → rechazado cliente
- [ ] Intentar > 50MB → rechazado cliente
- [ ] Descargar archivo → funciona
- [ ] Analizar ficha → crea KPIs y Tasks
- [ ] BD no contiene base64 → solo rutas
- [ ] `/server/uploads/tech-sheets/` contiene archivos UUID

---

## 🎯 MÉTRICAS DE ÉXITO

| Métrica | Antes | Después |
|---------|-------|---------|
| Almacenamiento en BD | 50+ MB base64 | 28 bytes ruta |
| Tipos soportados | Solo URL | PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, TXT |
| Límite de tamaño | Unlimited (BD limit) | 50 MB explícito |
| Validación | Solo servidor | Cliente + Servidor |
| Error "Data too long" | ❌ SÍ | ✅ NO |

---

## 🔍 LOGS ESPERADOS

**Backend (cuando se adjunta archivo):**
```
[18:45:32] ✅ Archivo guardado: tech-sheets/a1b2c3d4-e5f6-4789-a1b2.pdf (2345.67 KB)
[18:45:33] ✅ Ficha técnica creada: id=34
```

**Frontend (consola browser):**
```
✅ Archivo seleccionado: documento.pdf (2345.67 KB)
✅ Ficha técnica creada: {id: 34, name: "...", file_info: {...}}
```

---

## 📝 NOTAS IMPORTANTES

1. **No usar `file_url` como base64 más:**
   - Antiguo sistema: `file_url = "data:application/pdf;base64,JVBERi0xLjQKJeLj..."`
   - Nuevo sistema: `file_url = "tech-sheets/uuid.pdf"`

2. **Endpoint de análisis recibe archivo desde disco:**
   - `analyzeAndSave()` ahora puede leer PDF real
   - No decodificar base64 corrupto
   - Mejor extracción de contenido

3. **Seguridad:**
   - Directorio uploads NO es servido por web server
   - Solo acceso a través de endpoint `/tech-sheets/files/download/`
   - Validación de path traversal implementada

---

**Contacto:** Si encuentras problemas, revisa consola browser (F12) y logs backend

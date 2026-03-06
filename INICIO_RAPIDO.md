# ⚡ INICIO RÁPIDO - 5 Minutos

**Última actualización**: 5 de Marzo de 2026  
**Tiempo estimado**: 5 minutos para estar operativo

---

## 🚀 El camino más corto

### 1️⃣ COPIAR VARIABLES (1 min)

```bash
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server
cp .env.example .env
```

📝 **Editar `server/.env`** y cambiar solo estas líneas:

```env
MONGODB_URI=mongodb://localhost:27017/simuverse_db
GEMINI_API_KEY=tu-key-aqui-opcional
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 2️⃣ INICIAR MONGODB (1 min)

**Con Docker** (Recomendado):
```bash
docker run -d -p 27017:27017 mongo:latest
```

**O con sistema local:**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 3️⃣ INSTALAR DEPENDENCIAS (1 min)

```bash
# Terminal 1 - Backend
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server
npm install
npm run seed

# Terminal 2 - Frontend (NUEVA TERMINAL)
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine
npm install
```

### 4️⃣ EJECUTAR SERVICIOS (2 min)

**Terminal 1 - Backend**:
```bash
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server
npm run dev
# ✅ Debe mostrar: "Server running on http://localhost:5000"
```

**Terminal 2 - Frontend**:
```bash
cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine
npm run dev
# ✅ Debe mostrar: "Local: http://localhost:5173"
```

### 5️⃣ ACCEDER (0 min)

Abre: **http://localhost:5173**

✅ **¡Listo! Sistema en funcionamiento**

---

## 🧪 Prueba en 30 segundos

### Terminal 3 (Nueva)

```bash
# Verificar backend
curl http://localhost:5000/health
# Debe retornar: {"status":"ok"...}

# Ver cursos
curl http://localhost:5000/api/courses
# Debe retornar array con 4 cursos

# Listo!
```

---

## 📚 ¿Ahora qué?

| Si quieres... | Lee... | Tiempo |
|---------------|--------|--------|
| Entender qué es | [README.md](./README.md) | 10 min |
| Probar casos | [TEST_CASES.md](./TEST_CASES.md) | 20 min |
| Entender todo | [ARQUITECTURA.md](./ARQUITECTURA.md) | 30 min |
| Conocer archivos | [INDICE.md](./INDICE.md) | 5 min |
| Validar completitud | [VALIDACION_FINAL.md](./VALIDACION_FINAL.md) | 10 min |

---

## 🆘 ¿Algo no funciona?

### Error: "Port 5000 already in use"
```bash
# Encontrar qué usa el puerto
lsof -i :5000
# Matar el proceso
kill -9 <PID>
```

### Error: "MongoDB connection failed"
```bash
# Verificar MongoDB está corriendo
mongosh --eval "db.adminCommand('ping')"

# Si falla:
docker run -d -p 27017:27017 mongo:latest
```

### "Cursos no se cargan"
```bash
cd server
npx ts-node src/scripts/seedDatabase.ts
```

### "Frontend en blanco"
```bash
# Limpiar caché
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## ✅ Validación Rápida

```bash
# Ejecutar estos comandos en orden:

# 1. Backend activo
curl -s http://localhost:5000/health | grep "ok"

# 2. Cursos cargados
curl -s http://localhost:5000/api/courses | grep "ADM3534"

# 3. Iniciar simulación
curl -s -X POST http://localhost:5000/api/simulations/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","courseId":"ADM3534"}' | grep "_id"

# 4. Frontend accesible
curl -s http://localhost:5173 | head -1
```

Si todos retornan datos → ✅ **Todo funciona**

---

## 🎯 Próximo paso después de startup

1. Lee [PROXIMOS_PASOS.md](./PROXIMOS_PASOS.md#fase-3️⃣---probar-primer-caso-10-minutos)
2. Prueba [TEST_CASES.md](./TEST_CASES.md)
3. Integra con tu sistema

---

**¡Listo en 5 minutos!** ⚡

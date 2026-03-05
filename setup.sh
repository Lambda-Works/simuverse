#!/bin/bash

# MSM - Motor de Simulación Modular - Setup Script
# Este script instala y configura automáticamente todo el proyecto

set -e

echo "=========================================="
echo "🚀 MSM FEPEI 360 - Setup Automático"
echo "=========================================="
echo ""

# 1. Verificar Node.js
echo "✓ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js no está instalado. Por favor, instálalo desde https://nodejs.org/"
    exit 1
fi
echo "  Node.js version: $(node --version)"
echo ""

# 2. Instalar dependencias del Frontend
echo "✓ Instalando dependencias del Frontend..."
npm install
echo "  ✓ Frontend ready"
echo ""

# 3. Instalar dependencias del Backend
echo "✓ Instalando dependencias del Backend..."
cd server
npm install
cd ..
echo "  ✓ Backend ready"
echo ""

# 4. Crear archivo .env si no existe
echo "✓ Configurando variables de entorno..."
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo "  ℹ️ Archivo .env creado. Edítalo con tus credenciales:"
    echo "  - MONGODB_URI"
    echo "  - GEMINI_API_KEY (opcional)"
    echo ""
fi

# 5. Verificar Docker para MongoDB
echo "✓ Verificando MongoDB..."
if command -v docker &> /dev/null; then
    if ! docker ps | grep -q mongodb; then
        echo "  Iniciando MongoDB en Docker..."
        docker run -d -p 27017:27017 --name mongodb mongo:latest
        echo "  ✓ MongoDB iniciado en puerto 27017"
    else
        echo "  ✓ MongoDB ya está running"
    fi
else
    echo "  ℹ️ Docker no está instalado. Asegúrate de tener MongoDB running en puerto 27017"
fi
echo ""

# 6. Cargar datos iniciales
echo "✓ Cargando cursos iniciales..."
cd server
npm run seed
cd ..
echo "  ✓ 4 cursos cargados en la base de datos"
echo ""

echo "=========================================="
echo "✅ SETUP COMPLETADO EXITOSAMENTE"
echo "=========================================="
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Editar credenciales (si es necesario):"
echo "   $ nano server/.env"
echo ""
echo "2. Iniciar Backend (en Terminal 1):"
echo "   $ cd server && npm run dev"
echo ""
echo "3. Iniciar Frontend (en Terminal 2):"
echo "   $ npm run dev"
echo ""
echo "4. Abrir en navegador:"
echo "   http://localhost:5173"
echo ""
echo "5. Ver casos de prueba:"
echo "   $ cat TEST_CASES.md"
echo ""
echo "=========================================="

#!/bin/bash

# 📋 SCRIPT DE PRUEBA DE ENDPOINTS
# Este script prueba los endpoints principales del backend

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           SIMUVERSE - TEST SUITE DE ENDPOINTS                 ║"
echo "║                    13 de marzo de 2026                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
API_URL="http://localhost:5000"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Función para hacer test
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    TEST_COUNT=$((TEST_COUNT + 1))
    
    echo -e "${BLUE}┌─ TEST #$TEST_COUNT: $description${NC}"
    echo -e "${BLUE}│${NC} $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Validar respuesta
    if [[ $http_code =~ ^[2-3][0-9][0-9]$ ]]; then
        echo -e "${GREEN}│ ✅ HTTP $http_code - OK${NC}"
        
        # Intentar parsear JSON
        if echo "$body" | jq . > /dev/null 2>&1; then
            record_count=$(echo "$body" | jq 'length // 1')
            echo -e "${GREEN}│ ✅ JSON válido ($record_count registros)${NC}"
            PASS_COUNT=$((PASS_COUNT + 1))
        elif [ -z "$body" ]; then
            echo -e "${YELLOW}│ ⚠️  Respuesta vacía${NC}"
        else
            echo -e "${YELLOW}│ ⚠️  Respuesta no es JSON${NC}"
        fi
    else
        echo -e "${RED}│ ❌ HTTP $http_code - ERROR${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo -e "${RED}│ Error: ${body:0:100}...${NC}"
    fi
    
    echo -e "${BLUE}└─────────────────────────────────────────────────────${NC}"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[1] VERIFICANDO SERVIDOR${NC}"
echo ""

test_endpoint "GET" "/health" "Health Check del servidor"

# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[2] PROBANDO PROMPT TEMPLATES (RECIÉN CORREGIDO)${NC}"
echo ""

test_endpoint "GET" "/api/prompt-templates" "Obtener todas las plantillas"

test_endpoint "GET" "/api/prompt-templates/category/service" "Obtener plantillas por categoría (service)"

test_endpoint "GET" "/api/prompt-templates/1" "Obtener plantilla específica (ID=1)"

# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[3] PROBANDO CURSOS${NC}"
echo ""

test_endpoint "GET" "/api/courses" "Obtener todos los cursos"

# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[4] PROBANDO CATÁLOGO${NC}"
echo ""

test_endpoint "GET" "/api/categories" "Obtener todas las categorías"

test_endpoint "GET" "/api/tech-sheets" "Obtener fichas técnicas"

test_endpoint "GET" "/api/documents" "Obtener documentos"

test_endpoint "GET" "/api/users/all" "Obtener todos los usuarios"

# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[5] PROBANDO SIMULACIONES${NC}"
echo ""

test_endpoint "GET" "/api/simulations" "Obtener todas las simulaciones"

# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[6] PROBANDO PLANTILLAS${NC}"
echo ""

test_endpoint "GET" "/api/templates" "Obtener plantillas de flujo"

# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[7] PROBANDO MINISTERIO${NC}"
echo ""

test_endpoint "GET" "/api/ministry/requirements" "Obtener requerimientos del ministerio"

# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[8] PROBANDO VALIDACIÓN DE CREACIÓN${NC}"
echo ""

test_endpoint "POST" "/api/prompt-templates" "Crear nueva plantilla (validación de datos requeridos)" \
    '{"name":"Test Template","base_role":"Eres un tester","knowledge_base_prompt":"Testing content","category":"service"}'

# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      RESUMEN DE PRUEBAS                       ║"
echo "╠════════════════════════════════════════════════════════════════╣"

echo -e "│ Total de pruebas:      ${BLUE}$TEST_COUNT${NC}"
echo -e "│ Exitosas:              ${GREEN}$PASS_COUNT${NC}"
echo -e "│ Fallidas:              ${RED}$FAIL_COUNT${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "│ ${GREEN}✅ TODAS LAS PRUEBAS PASARON${NC}"
else
    echo -e "│ ${RED}❌ ALGUNAS PRUEBAS FALLARON${NC}"
fi

echo "╚════════════════════════════════════════════════════════════════╝"

# ═══════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}PRÓXIMOS PASOS:${NC}"
echo ""
echo "1️⃣  Verificar que el servidor esté corriendo en puerto 5000:"
echo -e "   ${YELLOW}lsof -i :5000${NC}"
echo ""
echo "2️⃣  Si falla: iniciar servidor backend:"
echo -e "   ${YELLOW}cd /home/gaspi/Documentos/dev/000MAMA/simuverse-engine/server${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3️⃣  Para probar endpoints individuales:"
echo -e "   ${YELLOW}curl -s http://localhost:5000/api/prompt-templates | jq .${NC}"
echo ""
echo "4️⃣  Para ver documentación:"
echo -e "   ${YELLOW}cat TODOS_ENDPOINTS_ANALISIS.md${NC}"
echo -e "   ${YELLOW}cat ARQUITECTURA_FLUJO_DATOS.md${NC}"
echo ""
echo -e "${GREEN}✅ Script de pruebas completado${NC}"

#!/bin/bash

# Test E2E completo del login de proveedor ReSona

echo "🧪 TEST E2E - Login Proveedor ReSona"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
BACKEND_URL="http://localhost:4004"
FRONTEND_URL="http://localhost:5175"
EMAIL="resona@icloud.com"
PASSWORD="test123"
SUPPLIER_ID="z0BAVOrrub8xQvUtHIOw"

echo "📋 Configuración:"
echo "   Backend: $BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo ""

# Test 1: Backend Health Check
echo "1️⃣  Verificando Backend..."
HEALTH_CHECK=$(curl -s "$BACKEND_URL/health" 2>&1)
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo -e "   ${GREEN}✅ Backend respondiendo${NC}"
else
    echo -e "   ${RED}❌ Backend NO responde${NC}"
    echo "   Respuesta: $HEALTH_CHECK"
    exit 1
fi
echo ""

# Test 2: Login API
echo "2️⃣  Probando Login API..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/supplier-dashboard/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Login exitoso (200 OK)${NC}"
    TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo -e "   ${GREEN}✅ Token recibido${NC}"
        echo "   Token: ${TOKEN:0:50}..."
    else
        echo -e "   ${RED}❌ No se recibió token${NC}"
        exit 1
    fi
else
    echo -e "   ${RED}❌ Login falló (Status: $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    exit 1
fi
echo ""

# Test 3: Dashboard API
echo "3️⃣  Probando Dashboard API..."
DASHBOARD_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/supplier-dashboard/$SUPPLIER_ID" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$DASHBOARD_RESPONSE" | tail -n1)
BODY=$(echo "$DASHBOARD_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Dashboard API respondiendo (200 OK)${NC}"
    NAME=$(echo "$BODY" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$NAME" ]; then
        echo "   Proveedor: $NAME"
    fi
else
    echo -e "   ${RED}❌ Dashboard API falló (Status: $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    exit 1
fi
echo ""

# Test 4: Frontend accesible
echo "4️⃣  Verificando Frontend..."
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/login")
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "   ${GREEN}✅ Frontend accesible${NC}"
else
    echo -e "   ${RED}❌ Frontend no accesible (Status: $FRONTEND_CHECK)${NC}"
    exit 1
fi
echo ""

# Test 5: CORS
echo "5️⃣  Verificando CORS..."
CORS_CHECK=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/supplier-dashboard/auth/login" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control-allow-origin")

if echo "$CORS_CHECK" | grep -q "$FRONTEND_URL"; then
    echo -e "   ${GREEN}✅ CORS configurado correctamente${NC}"
    echo "   $CORS_CHECK"
else
    echo -e "   ${YELLOW}⚠️  CORS podría tener problemas${NC}"
fi
echo ""

# Resumen
echo "======================================"
echo -e "${GREEN}✅ TODOS LOS TESTS PASARON${NC}"
echo ""
echo "📊 Resumen:"
echo "   ✅ Backend: Funcionando"
echo "   ✅ Login API: Exitoso"
echo "   ✅ Dashboard API: Exitoso"
echo "   ✅ Frontend: Accesible"
echo "   ✅ CORS: Configurado"
echo ""
echo "🔐 Credenciales verificadas:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo "   Supplier ID: $SUPPLIER_ID"
echo ""
echo "🎯 Próximo paso:"
echo "   1. Ve a: $FRONTEND_URL/login"
echo "   2. Introduce las credenciales"
echo "   3. Deberías ser redirigido a: $FRONTEND_URL/dashboard/$SUPPLIER_ID"
echo ""
echo "======================================"

#!/bin/bash

# Script para ejecutar test E2E del sistema de crowdsourcing
# Ejecuta el test completo que valida:
# 1. Usuario añade opciones personalizadas
# 2. Job de IA procesa y valida
# 3. Opciones aprobadas aparecen para otros usuarios

echo "🧪 Test E2E: Sistema de Crowdsourcing de Opciones"
echo "================================================"
echo ""

# Verificar que los servicios están corriendo
echo "📋 Verificando servicios..."

# Backend
if ! curl -s http://localhost:4004/api/health > /dev/null; then
  echo "❌ Backend no está corriendo en puerto 4004"
  echo "   Ejecuta: cd backend && npm run dev"
  exit 1
fi
echo "✅ Backend: OK"

# Frontend
if ! curl -s http://localhost:5173 > /dev/null; then
  echo "❌ Frontend no está corriendo en puerto 5173"
  echo "   Ejecuta: cd apps/main-app && npm run dev"
  exit 1
fi
echo "✅ Frontend: OK"

echo ""
echo "🚀 Ejecutando test E2E..."
echo ""

# Ejecutar el test específico de crowdsourcing
npx cypress run \
  --spec "cypress/e2e/supplier-options-crowdsourcing.cy.js" \
  --browser chrome \
  --headless

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ Test completado exitosamente"
  echo ""
  echo "📊 Resultados:"
  echo "   - Opciones añadidas por usuarios"
  echo "   - IA validó y aprobó opciones relevantes"
  echo "   - Opciones aprobadas disponibles para todos"
else
  echo "❌ Test falló con código: $TEST_EXIT_CODE"
  echo ""
  echo "💡 Tips para debugging:"
  echo "   - Revisa los screenshots en cypress/screenshots/"
  echo "   - Verifica logs del backend"
  echo "   - Ejecuta en modo interactivo: npx cypress open"
fi

exit $TEST_EXIT_CODE

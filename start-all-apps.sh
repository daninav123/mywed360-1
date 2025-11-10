#!/bin/bash

echo "🚀 Iniciando todas las apps de MaLove..."

# Matar procesos anteriores
pkill -f vite

echo "📦 Iniciando main-app en puerto 5173..."
cd apps/main-app && npm run dev &

echo "🏢 Iniciando suppliers-app en puerto 5175..."
cd apps/suppliers-app && npm run dev &

echo "📋 Iniciando planners-app en puerto 5174..."
cd apps/planners-app && npm run dev &

echo "🔧 Iniciando admin-app en puerto 5176..."
cd apps/admin-app && npm run dev &

echo "✅ Todas las apps iniciadas!"
echo ""
echo "Puedes acceder a:"
echo "- main-app:      http://localhost:5173"
echo "- planners-app:  http://localhost:5174"
echo "- suppliers-app: http://localhost:5175"
echo "- admin-app:     http://localhost:5176"
echo ""
echo "Presiona Ctrl+C para detener todas las apps"

# Mantener el script corriendo
wait

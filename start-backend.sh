#!/bin/bash
# Script para iniciar el backend con Node 20.0.0

echo "🔄 Iniciando backend con Node 20.0.0..."

# Cargar nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usar Node 20.5.0
nvm use 20.5.0

# Verificar versión
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Cambiar al directorio del backend
cd "$(dirname "$0")/backend" || exit 1

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
  echo "📥 Instalando dependencias del backend..."
  npm install
fi

# Iniciar backend
echo "🚀 Iniciando backend en puerto 3000..."
node index.js

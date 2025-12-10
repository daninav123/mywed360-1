#!/bin/bash

echo "🚀 Desplegando reglas de Storage con Firebase CLI..."

# Exportar credenciales
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/backend/serviceAccount.json"

# Desplegar solo Storage
firebase deploy --only storage --project lovenda-98c77 --force

echo "✅ Desplegado"

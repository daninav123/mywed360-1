#!/bin/bash

# Script para limpiar logs grandes automáticamente
# Uso: ./scripts/clean-logs.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🧹 Limpiando logs grandes..."

# Limpiar logs mayores a 100MB
find . -name "*.log" -type f -size +100M -exec sh -c '
  size=$(ls -lh "$1" | awk "{print \$5}")
  echo "  ✓ Limpiando: $1 ($size)"
  : > "$1"
' _ {} \;

# Limpiar archivos de log vacíos o muy antiguos
find . -name "*.log" -type f -size 0 -mtime +7 -delete 2>/dev/null || true

# Limpiar archivos de resultado de tests grandes
for file in cypress-results.json lint-report.json; do
  if [ -f "$file" ]; then
    size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
    if [ -n "$size" ]; then
      echo "  ✓ Eliminando: $file ($size)"
      rm -f "$file"
    fi
  fi
done

# Limpiar cache de Cypress
if [ -d "cypress/screenshots" ]; then
  echo "  ✓ Limpiando capturas de Cypress"
  rm -rf cypress/screenshots/*
fi

if [ -d "cypress/videos" ]; then
  echo "  ✓ Limpiando videos de Cypress"
  rm -rf cypress/videos/*
fi

echo "✅ Limpieza completada"
echo ""
echo "💡 Tip: Para ejecutar esto automáticamente, añade a tu .git/hooks/pre-commit:"
echo "   ./scripts/clean-logs.sh"

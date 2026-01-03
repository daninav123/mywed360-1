#!/bin/bash

# Script para eliminar TODAS las referencias a Unsplash de forma agresiva

echo "🔍 Buscando y reemplazando todas las URLs de Unsplash..."

# Buscar en JS/JSX y reemplazar con imagen por defecto
find apps -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec grep -l "unsplash\.com" {} \; | while read -r file; do
  echo "  📝 Procesando: $file"
  
  # Reemplazar todas las URLs de Unsplash con imagen por defecto
  sed -i 's|https://images\.unsplash\.com/[^"'\''[:space:]]*|/assets/services/default.webp|g' "$file"
  sed -i 's|images\.unsplash\.com/[^"'\''[:space:]]*|/assets/services/default.webp|g' "$file"
done

echo ""
echo "✅ Todas las referencias reemplazadas"
echo ""
echo "🔍 Verificando que no queden referencias..."

remaining=$(grep -r "unsplash\.com" apps --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

if [ "$remaining" -eq 0 ]; then
  echo "✅ Cero referencias a Unsplash restantes!"
else
  echo "⚠️  Aún quedan $remaining referencias"
  echo ""
  echo "Archivos con referencias:"
  grep -r "unsplash\.com" apps --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" -l
fi

echo ""

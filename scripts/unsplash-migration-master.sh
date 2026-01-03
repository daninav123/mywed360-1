#!/bin/bash

# Script maestro para migración completa de Unsplash a imágenes IA
# Coordina todos los pasos del proceso de migración

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🎨 MIGRACIÓN UNSPLASH → IMÁGENES GENERADAS POR IA       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Función para preguntar sí/no
ask_yes_no() {
    while true; do
        read -p "$1 (s/n): " yn
        case $yn in
            [Ss]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Por favor responde s o n.";;
        esac
    done
}

# Paso 1: Verificar estructura de carpetas
echo "📁 Paso 1/5: Verificando estructura de carpetas..."
if [ -d "$ROOT_DIR/public/assets" ]; then
    echo "   ✅ Estructura existente"
else
    echo "   ⚠️  Creando estructura..."
    mkdir -p "$ROOT_DIR/public/assets"/{services,florals,backgrounds,cities,landing}
    echo "   ✅ Estructura creada"
fi

# Paso 2: Crear placeholders (opcional)
echo ""
echo "📸 Paso 2/5: Placeholders temporales"
echo "   Los placeholders te permiten desarrollar mientras generas las imágenes reales."
if ask_yes_no "   ¿Crear placeholders SVG temporales?"; then
    bash "$SCRIPT_DIR/create-placeholder-images.sh"
else
    echo "   ⏭️  Saltando placeholders"
fi

# Paso 3: Verificar si hay imágenes generadas
echo ""
echo "🖼️  Paso 3/5: Verificando imágenes generadas"
SERVICES_COUNT=$(find "$ROOT_DIR/public/assets/services" -type f 2>/dev/null | wc -l)
CITIES_COUNT=$(find "$ROOT_DIR/public/assets/cities" -type f 2>/dev/null | wc -l)
TOTAL_COUNT=$((SERVICES_COUNT + CITIES_COUNT))

if [ $TOTAL_COUNT -gt 0 ]; then
    echo "   ✅ Encontradas $TOTAL_COUNT imágenes"
    echo "      - Servicios: $SERVICES_COUNT"
    echo "      - Ciudades: $CITIES_COUNT"
else
    echo "   ⚠️  No se encontraron imágenes generadas"
    echo ""
    echo "   📋 PRÓXIMO PASO: Genera las imágenes con IA"
    echo "      Consulta: docs/AI_IMAGES_CATALOG.md"
    echo ""
    if ! ask_yes_no "   ¿Continuar con la migración de código de todas formas?"; then
        echo ""
        echo "   ℹ️  Proceso pausado. Genera las imágenes y vuelve a ejecutar este script."
        exit 0
    fi
fi

# Paso 4: Migrar código JS/JSX
echo ""
echo "⚙️  Paso 4/5: Migrando código JavaScript/JSX..."
if ask_yes_no "   ¿Ejecutar migración de código ahora?"; then
    node "$SCRIPT_DIR/migrate-unsplash-to-local.js"
else
    echo "   ⏭️  Saltando migración de código"
fi

# Paso 5: Actualizar JSONs de ciudades y blog
echo ""
echo "🌍 Paso 5/5: Actualizando cities.json y blog-posts.json..."
if ask_yes_no "   ¿Ejecutar actualización de JSONs ahora?"; then
    node "$SCRIPT_DIR/update-cities-and-blog-images.js"
else
    echo "   ⏭️  Saltando actualización de JSONs"
fi

# Resumen final
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✨ PROCESO COMPLETADO                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 PRÓXIMOS PASOS:"
echo ""
echo "1. 🎨 Generar imágenes con IA (si no lo has hecho)"
echo "   → Ver: docs/AI_IMAGES_CATALOG.md"
echo ""
echo "2. 🧪 Probar en desarrollo:"
echo "   → npm run dev"
echo "   → Revisar consola por errores 404"
echo ""
echo "3. ⚡ Optimizar imágenes (opcional):"
echo "   → npm install -g sharp-cli"
echo "   → sharp -i input.webp -o output.webp --webp quality=85"
echo ""
echo "4. 📝 Commit y deploy:"
echo "   → git add public/assets apps/*/src"
echo "   → git commit -m 'Migrar de Unsplash a imágenes IA'"
echo "   → git push"
echo ""
echo "💡 Documentación completa: docs/MIGRACION_UNSPLASH_A_IA.md"
echo ""

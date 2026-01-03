#!/bin/bash

# Script para crear imágenes placeholder mientras generas las reales con IA
# Usa ImageMagick para crear imágenes SVG simples con texto

echo "🎨 Creando placeholders temporales..."

# Función para crear placeholder
create_placeholder() {
    local path=$1
    local text=$2
    local width=${3:-800}
    local height=${4:-600}
    
    mkdir -p "$(dirname "$path")"
    
    # SVG simple con texto
    cat > "$path" << EOF
<svg width="$width" height="$height" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f5f2ed"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" 
        fill="#a0a0a0" text-anchor="middle" dominant-baseline="middle">
    $text
  </text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="14" 
        fill="#c0c0c0" text-anchor="middle" dominant-baseline="middle">
    Placeholder - Generar con IA
  </text>
</svg>
EOF
    echo "  ✅ $path"
}

cd public/assets

# Servicios
echo "📸 Servicios..."
create_placeholder "services/fotografia.svg" "Fotografía"
create_placeholder "services/video.svg" "Video"
create_placeholder "services/catering.svg" "Catering"
create_placeholder "services/flores.svg" "Flores"
create_placeholder "services/decoracion.svg" "Decoración"
create_placeholder "services/planner.svg" "Wedding Planner"
create_placeholder "services/musica.svg" "Música/DJ"
create_placeholder "services/pastel.svg" "Pastel"
create_placeholder "services/maquillaje.svg" "Maquillaje"
create_placeholder "services/peluqueria.svg" "Peluquería"
create_placeholder "services/invitaciones.svg" "Invitaciones"
create_placeholder "services/iluminacion.svg" "Iluminación"
create_placeholder "services/mobiliario.svg" "Mobiliario"
create_placeholder "services/transporte.svg" "Transporte"
create_placeholder "services/viajes.svg" "Viajes"
create_placeholder "services/joyeria.svg" "Joyería"
create_placeholder "services/default.svg" "Boda Elegante"

# Fondos
echo "📄 Fondos..."
create_placeholder "backgrounds/texture-paper.svg" "Papel" 1200 1200
create_placeholder "backgrounds/texture-linen.svg" "Lino" 1200 1200
create_placeholder "backgrounds/texture-canvas.svg" "Lienzo" 1200 1200
create_placeholder "backgrounds/texture-kraft.svg" "Kraft" 1200 1200
create_placeholder "backgrounds/watercolor-blush.svg" "Acuarela Rosa" 1200 1200
create_placeholder "backgrounds/watercolor-sage.svg" "Acuarela Verde" 1200 1200
create_placeholder "backgrounds/watercolor-blue.svg" "Acuarela Azul" 1200 1200
create_placeholder "backgrounds/watercolor-neutral.svg" "Acuarela Neutral" 1200 1200

# Ciudades
echo "🏙️ Ciudades..."
create_placeholder "cities/es-madrid.svg" "Madrid"
create_placeholder "cities/es-barcelona.svg" "Barcelona"
create_placeholder "cities/es-valencia.svg" "Valencia"
create_placeholder "cities/es-sevilla.svg" "Sevilla"
create_placeholder "cities/es-coast.svg" "Costa Española"
create_placeholder "cities/es-interior.svg" "Interior España"
create_placeholder "cities/mx-cdmx.svg" "Ciudad de México"
create_placeholder "cities/mx-guadalajara.svg" "Guadalajara"
create_placeholder "cities/mx-cancun.svg" "Cancún"
create_placeholder "cities/mx-playadelcarmen.svg" "Playa del Carmen"
create_placeholder "cities/ar-buenosaires.svg" "Buenos Aires"
create_placeholder "cities/ar-mendoza.svg" "Mendoza"
create_placeholder "cities/ar-cordoba.svg" "Córdoba"
create_placeholder "cities/fr-paris.svg" "París"
create_placeholder "cities/fr-provence.svg" "Provence"
create_placeholder "cities/generic-beach.svg" "Playa"
create_placeholder "cities/generic-mountain.svg" "Montaña"
create_placeholder "cities/generic-garden.svg" "Jardín"
create_placeholder "cities/generic-historic.svg" "Histórico"
create_placeholder "cities/generic-modern.svg" "Moderno"

# Landing
echo "🎯 Landing..."
create_placeholder "landing/hero-wedding-celebration.svg" "Celebración Boda" 1200 800
create_placeholder "landing/couple-planning.svg" "Pareja Feliz" 800 600
create_placeholder "landing/demo-decoration.svg" "Decoración" 800 600
create_placeholder "landing/demo-ceremony.svg" "Ceremonia" 800 600
create_placeholder "landing/demo-flowers.svg" "Flores" 800 600

# Florales (dejamos vacíos, mejor generarlos con IA directamente)
echo "🌸 Florales (crear con IA)..."
mkdir -p florals
touch florals/.gitkeep

echo ""
echo "✨ Placeholders creados!"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Los SVG son solo temporales para desarrollo"
echo "   - Reemplázalos con imágenes reales generadas por IA"
echo "   - Consulta docs/AI_IMAGES_CATALOG.md para los prompts"
echo ""

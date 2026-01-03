#!/bin/bash

# Convertir PNG a WebP para mejor rendimiento
# Requiere: imagemagick o webp tools

echo "🔄 Convirtiendo PNG a WebP..."

converted=0
failed=0

# Función para convertir con ffmpeg (más común)
convert_with_ffmpeg() {
    local input=$1
    local output="${input%.png}.webp"
    
    if command -v ffmpeg &> /dev/null; then
        ffmpeg -i "$input" -c:v libwebp -quality 85 "$output" -y &> /dev/null
        if [ $? -eq 0 ]; then
            rm "$input"
            return 0
        fi
    fi
    return 1
}

# Función para convertir con cwebp (herramienta oficial de Google)
convert_with_cwebp() {
    local input=$1
    local output="${input%.png}.webp"
    
    if command -v cwebp &> /dev/null; then
        cwebp -q 85 "$input" -o "$output" &> /dev/null
        if [ $? -eq 0 ]; then
            rm "$input"
            return 0
        fi
    fi
    return 1
}

# Función para convertir con ImageMagick
convert_with_magick() {
    local input=$1
    local output="${input%.png}.webp"
    
    if command -v magick &> /dev/null; then
        magick "$input" -quality 85 "$output" &> /dev/null
        if [ $? -eq 0 ]; then
            rm "$input"
            return 0
        fi
    elif command -v convert &> /dev/null; then
        convert "$input" -quality 85 "$output" &> /dev/null
        if [ $? -eq 0 ]; then
            rm "$input"
            return 0
        fi
    fi
    return 1
}

# Procesar todos los PNG
while IFS= read -r file; do
    echo "  Procesando: $(basename "$file")"
    
    if convert_with_ffmpeg "$file"; then
        ((converted++))
    elif convert_with_cwebp "$file"; then
        ((converted++))
    elif convert_with_magick "$file"; then
        ((converted++))
    else
        echo "    ⚠️  No se pudo convertir (falta herramienta)"
        ((failed++))
    fi
done < <(find public/assets -name "*.png" -type f)

echo ""
echo "✅ Conversión completada"
echo "   Convertidos: $converted"
echo "   Fallidos: $failed"

if [ $failed -gt 0 ]; then
    echo ""
    echo "💡 Instalar herramienta de conversión:"
    echo "   Ubuntu/Debian: sudo apt install webp ffmpeg"
    echo "   macOS: brew install webp ffmpeg"
    echo "   Arch: sudo pacman -S libwebp ffmpeg"
fi

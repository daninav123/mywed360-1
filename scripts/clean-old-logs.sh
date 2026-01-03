#!/bin/bash

# Script de limpieza de logs antiguos
# Ejecutar periódicamente para mantener el proyecto ligero

echo "🧹 Limpiando logs antiguos..."

# Eliminar archivos de log rotados (*.log.1, *.log.2, etc.)
echo "Eliminando archivos rotados..."
find logs backend/logs -name "*.log.[0-9]*" -type f -delete 2>/dev/null

# Eliminar logs comprimidos antiguos (más de 14 días)
echo "Eliminando logs comprimidos antiguos (>14 días)..."
find logs backend/logs -name "*.gz" -type f -mtime +14 -delete 2>/dev/null

# Eliminar logs regulares antiguos (más de 7 días)
echo "Eliminando logs regulares antiguos (>7 días)..."
find logs backend/logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null

# Mostrar tamaño actual
echo "✅ Limpieza completada"
echo "Tamaño actual de logs:"
du -sh logs backend/logs 2>/dev/null || echo "Carpetas de logs vacías"

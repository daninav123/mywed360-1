#!/bin/bash

# Script para limpiar variables de entorno de OpenAI que sobrescriben .env

echo "🧹 Limpiando variables de entorno de OpenAI..."
echo ""

# Mostrar estado actual
echo "📋 Estado ANTES de limpiar:"
env | grep OPENAI || echo "  (Sin variables OPENAI en el entorno)"
echo ""

# Limpiar variables
unset OPENAI_API_KEY
unset OPENAI_PROJECT_ID
unset OPENAI_MODEL
unset VITE_OPENAI_API_KEY
unset VITE_OPENAI_PROJECT_ID

echo "✅ Variables limpiadas"
echo ""

# Verificar
echo "📋 Estado DESPUÉS de limpiar:"
env | grep OPENAI || echo "  ✅ Todas las variables limpiadas correctamente"
echo ""

echo "ℹ️  IMPORTANTE: Estas variables solo se limpiaron en la sesión actual."
echo "   Para que sea permanente, revisa y elimina 'export OPENAI_*' de:"
echo "   - ~/.zshrc"
echo "   - ~/.bashrc"
echo "   - ~/.bash_profile"
echo "   - ~/.zprofile"
echo ""
echo "💡 Para aplicar en esta sesión:"
echo "   source limpiar-openai-env.sh"
echo ""

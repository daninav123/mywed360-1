#!/bin/bash
###############################################################################
# Script para ejecutar test E2E de verificación i18n/mojibake
#
# Uso:
#   ./scripts/test-i18n.sh [modo] [navegador] [grep]
#
# Ejemplos:
#   ./scripts/test-i18n.sh                          # Headless con Chrome
#   ./scripts/test-i18n.sh headed firefox           # Con Firefox visible
#   ./scripts/test-i18n.sh open                     # Interfaz Cypress
#   ./scripts/test-i18n.sh headless chrome "Páginas" # Solo páginas principales
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parámetros
MODE=${1:-headless}
BROWSER=${2:-chrome}
GREP=${3:-}

# Banner
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 Test E2E: Verificación i18n/Mojibake     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar archivo de test
TEST_FILE="cypress/e2e/i18n-mojibake-check.cy.js"
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo de test${NC}"
    echo "   Esperado en: $TEST_FILE"
    exit 1
fi

echo -e "${GREEN}✅ Archivo de test encontrado${NC}"
echo ""

# Configurar comando
CYPRESS_CMD=""

case "$MODE" in
    open)
        echo -e "${YELLOW}🔧 Modo: Cypress Open (interfaz interactiva)${NC}"
        CYPRESS_CMD="npx cypress open"
        ;;
    headed)
        echo -e "${YELLOW}🔧 Modo: Headed (con ventana del navegador)${NC}"
        CYPRESS_CMD="npx cypress run --spec \"$TEST_FILE\" --browser $BROWSER --headed"
        ;;
    headless)
        echo -e "${YELLOW}🔧 Modo: Headless (sin interfaz)${NC}"
        CYPRESS_CMD="npx cypress run --spec \"$TEST_FILE\" --browser $BROWSER"
        ;;
    *)
        echo -e "${RED}❌ Modo inválido: $MODE${NC}"
        echo "   Modos válidos: open, headed, headless"
        exit 1
        ;;
esac

# Añadir filtro grep
if [ -n "$GREP" ]; then
    echo -e "${YELLOW}🔍 Filtro: $GREP${NC}"
    CYPRESS_CMD="$CYPRESS_CMD --grep \"$GREP\""
fi

echo ""
echo -e "${BLUE}📋 Ejecutando comando:${NC}"
echo "   $CYPRESS_CMD"
echo ""
echo -e "${YELLOW}⏳ Iniciando test...${NC}"
echo ""

# Ejecutar
START_TIME=$(date +%s)

set +e
eval $CYPRESS_CMD
EXIT_CODE=$?
set -e

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Resultado
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}║  ✅ TEST EXITOSO - Sin mojibake detectado    ║${NC}"
else
    echo -e "${RED}║  ❌ TEST FALLIDO - Errores encontrados       ║${NC}"
fi

echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⏱  Duración: ${DURATION}s${NC}"
echo ""

# Información adicional si falló
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}📋 Revisa los logs arriba para ver:${NC}"
    echo "   • Páginas con mojibake"
    echo "   • Palabras corruptas detectadas"
    echo "   • Capturas de pantalla en: cypress/screenshots/"
    echo "   • Videos en: cypress/videos/"
    echo ""
    echo -e "${YELLOW}💡 Sugerencias:${NC}"
    echo "   1. Verifica archivos i18n en: src/i18n/locales/"
    echo "   2. Ejecuta: node fixMojibakeMinimal.cjs"
    echo "   3. Revisa: docs/I18N-CORREGIDO-FINAL.md"
    echo ""
fi

exit $EXIT_CODE

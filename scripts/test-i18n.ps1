#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para ejecutar test E2E de verificación i18n/mojibake

.DESCRIPTION
    Ejecuta el test Cypress que verifica:
    - Sin caracteres mojibake (�, \uFFFD)
    - Sin palabras corruptas (Anlisis, Gestin, etc.)
    - Palabras correctas con acentos

.PARAMETER Mode
    Modo de ejecución: 'headless' (por defecto) o 'headed' (con interfaz)

.PARAMETER Browser
    Navegador: 'chrome' (por defecto), 'firefox', 'edge'

.PARAMETER Grep
    Filtro para ejecutar solo tests específicos

.EXAMPLE
    .\scripts\test-i18n.ps1
    # Ejecuta el test completo en modo headless

.EXAMPLE
    .\scripts\test-i18n.ps1 -Mode headed
    # Ejecuta con interfaz gráfica

.EXAMPLE
    .\scripts\test-i18n.ps1 -Grep "Páginas Principales"
    # Ejecuta solo las páginas principales
#>

param(
    [Parameter()]
    [ValidateSet('headless', 'headed', 'open')]
    [string]$Mode = 'headless',
    
    [Parameter()]
    [ValidateSet('chrome', 'firefox', 'edge', 'electron')]
    [string]$Browser = 'chrome',
    
    [Parameter()]
    [string]$Grep = ""
)

# Colores
$ColorReset = "`e[0m"
$ColorGreen = "`e[32m"
$ColorYellow = "`e[33m"
$ColorBlue = "`e[34m"
$ColorRed = "`e[31m"

Write-Host "${ColorBlue}╔════════════════════════════════════════════════╗${ColorReset}"
Write-Host "${ColorBlue}║  🧪 Test E2E: Verificación i18n/Mojibake     ║${ColorReset}"
Write-Host "${ColorBlue}╚════════════════════════════════════════════════╝${ColorReset}"
Write-Host ""

# Verificar que existe el archivo de test
$testFile = "cypress/e2e/i18n-mojibake-check.cy.js"
if (-not (Test-Path $testFile)) {
    Write-Host "${ColorRed}❌ Error: No se encuentra el archivo de test${ColorReset}"
    Write-Host "   Esperado en: $testFile"
    exit 1
}

Write-Host "${ColorGreen}✅ Archivo de test encontrado${ColorReset}"
Write-Host ""

# Configurar comando según modo
$cypressCmd = ""

switch ($Mode) {
    'open' {
        Write-Host "${ColorYellow}🔧 Modo: Cypress Open (interfaz interactiva)${ColorReset}"
        $cypressCmd = "npx cypress open"
    }
    'headed' {
        Write-Host "${ColorYellow}🔧 Modo: Headed (con ventana del navegador)${ColorReset}"
        $cypressCmd = "npx cypress run --spec `"$testFile`" --browser $Browser --headed"
    }
    'headless' {
        Write-Host "${ColorYellow}🔧 Modo: Headless (sin interfaz)${ColorReset}"
        $cypressCmd = "npx cypress run --spec `"$testFile`" --browser $Browser"
    }
}

# Añadir filtro grep si se especificó
if ($Grep) {
    Write-Host "${ColorYellow}🔍 Filtro: $Grep${ColorReset}"
    $cypressCmd += " --grep `"$Grep`""
}

Write-Host ""
Write-Host "${ColorBlue}📋 Ejecutando comando:${ColorReset}"
Write-Host "   $cypressCmd"
Write-Host ""
Write-Host "${ColorYellow}⏳ Iniciando test...${ColorReset}"
Write-Host ""

# Ejecutar
$startTime = Get-Date

try {
    Invoke-Expression $cypressCmd
    $exitCode = $LASTEXITCODE
} catch {
    Write-Host "${ColorRed}❌ Error al ejecutar Cypress:${ColorReset}"
    Write-Host "   $_"
    exit 1
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "${ColorBlue}╔════════════════════════════════════════════════╗${ColorReset}"

if ($exitCode -eq 0) {
    Write-Host "${ColorGreen}║  ✅ TEST EXITOSO - Sin mojibake detectado    ║${ColorReset}"
} else {
    Write-Host "${ColorRed}║  ❌ TEST FALLIDO - Errores encontrados       ║${ColorReset}"
}

Write-Host "${ColorBlue}╚════════════════════════════════════════════════╝${ColorReset}"
Write-Host ""
Write-Host "${ColorYellow}⏱  Duración: $($duration.TotalSeconds.ToString('F2')) segundos${ColorReset}"
Write-Host ""

# Mostrar información adicional si falló
if ($exitCode -ne 0) {
    Write-Host "${ColorRed}📋 Revisa los logs arriba para ver:${ColorReset}"
    Write-Host "   • Páginas con mojibake"
    Write-Host "   • Palabras corruptas detectadas"
    Write-Host "   • Capturas de pantalla en: cypress/screenshots/"
    Write-Host "   • Videos en: cypress/videos/"
    Write-Host ""
    Write-Host "${ColorYellow}💡 Sugerencias:${ColorReset}"
    Write-Host "   1. Verifica archivos i18n en: src/i18n/locales/"
    Write-Host "   2. Ejecuta: node fixMojibakeMinimal.cjs"
    Write-Host "   3. Revisa: docs/I18N-CORREGIDO-FINAL.md"
    Write-Host ""
}

# Retornar código de salida
exit $exitCode

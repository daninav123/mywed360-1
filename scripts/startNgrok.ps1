# Script para iniciar ngrok y mostrar instrucciones para Mailgun
# Uso: .\scripts\startNgrok.ps1

Write-Host ""
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🌐 INICIANDO NGROK PARA MAILGUN WEBHOOK" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar si ngrok está instalado
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokInstalled) {
    Write-Host "❌ ngrok no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 INSTALAR NGROK:" -ForegroundColor Yellow
    Write-Host "   Opción 1: Descargar desde https://ngrok.com/download"
    Write-Host "   Opción 2: choco install ngrok"
    Write-Host "   Opción 3: scoop install ngrok"
    Write-Host ""
    exit 1
}

Write-Host "✅ ngrok encontrado" -ForegroundColor Green
Write-Host ""

# Verificar si el backend está corriendo
Write-Host "🔍 Verificando backend en http://localhost:4004..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4004/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Backend corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend no responde" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Inicia el backend primero:" -ForegroundColor Yellow
    Write-Host "   cd backend"
    Write-Host "   npm run dev"
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Iniciando ngrok..." -ForegroundColor Cyan
Write-Host "   Puerto: 4004"
Write-Host "   Endpoint: /api/inbound/mailgun"
Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 CUANDO NGROK INICIE, SIGUE ESTOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copia la URL 'Forwarding' que ngrok muestra" -ForegroundColor White
Write-Host "   Ejemplo: https://abc123.ngrok-free.app" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ve a Mailgun Dashboard:" -ForegroundColor White
Write-Host "   https://app.mailgun.com/app/receiving/routes" -ForegroundColor Blue
Write-Host ""
Write-Host "3. Edita tu Route y cambia las Actions a:" -ForegroundColor White
Write-Host "   forward(`"https://TU-URL-NGROK.ngrok-free.app/api/inbound/mailgun`")" -ForegroundColor Gray
Write-Host "   store(notify=`"https://TU-URL-NGROK.ngrok-free.app/api/inbound/mailgun`")" -ForegroundColor Gray
Write-Host "   stop()" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Envía un email de prueba a: dani@malove.app" -ForegroundColor White
Write-Host ""
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Mantén esta ventana abierta mientras desarrollas" -ForegroundColor Yellow
Write-Host "   Si cierras ngrok, Mailgun no podrá enviar webhooks"
Write-Host ""
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener ngrok cuando termines" -ForegroundColor Gray
Write-Host ""

# Iniciar ngrok
Start-Process -NoNewWindow -Wait -FilePath "ngrok" -ArgumentList "http", "4004"

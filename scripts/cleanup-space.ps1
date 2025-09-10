# Limpieza de espacio: cachés y logs
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-space.ps1

param(
  [int]$DaysOldToDelete = 14,
  [int]$LargeLogMB = 30
)

$ErrorActionPreference = 'SilentlyContinue'

function Get-DiskFreeGB {
  $drives = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
  if (-not $drives) { return 0 }
  $free = ($drives | Measure-Object -Sum FreeSpace).Sum
  return [math]::Round($free / 1GB, 2)
}

Write-Output ("=== Limpieza iniciada: {0} ===" -f (Get-Date).ToString('s'))
$freeBefore = Get-DiskFreeGB
Write-Output ("Espacio libre inicial: {0} GB" -f $freeBefore)

# 1) Limpiar caché de npm
Write-Output '--- Limpiando caché de npm ---'
npm cache clean --force | Out-Host

# 2) Borrar cachés locales del proyecto (Vite, pruebas)
Write-Output '--- Borrando cachés locales del proyecto (Vite/Pruebas) ---'
$projPaths = @(
  '.\\node_modules\\.vite',
  '.\\node_modules\\.cache',
  '.\\cypress\\videos',
  '.\\cypress\\screenshots',
  '.\\coverage'
)
foreach ($p in $projPaths) {
  if (Test-Path $p) {
    Write-Output ("Eliminando: {0}" -f $p)
    Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
  } else {
    Write-Output ("No existe: {0}" -f $p)
  }
}

# 3) Purgar logs antiguos y pesados
Write-Output '--- Purgando logs antiguos y pesados ---'
if (Test-Path '.\\logs') {
  Write-Output ("Eliminando logs > {0}MB..." -f $LargeLogMB)
  Get-ChildItem '.\\logs' -File -Recurse -EA SilentlyContinue |
    Where-Object { $_.Length -gt ($LargeLogMB*1MB) } |
    Remove-Item -Force -EA SilentlyContinue

  Write-Output ("Eliminando logs con más de {0} días..." -f $DaysOldToDelete)
  Get-ChildItem '.\\logs' -File -Recurse -EA SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$DaysOldToDelete) } |
    Remove-Item -Force -EA SilentlyContinue
} else {
  Write-Output 'Carpeta .\\logs no existe'
}

# 4) Limpiar cachés globales (npm, Cypress, TEMP)
Write-Output '--- Limpiando cachés globales (npm, Cypress, TEMP) ---'
if (Test-Path "$env:APPDATA\\npm-cache") {
  Write-Output 'Limpiando %APPDATA%\\npm-cache'
  Remove-Item -Recurse -Force "$env:APPDATA\\npm-cache\\*" -EA SilentlyContinue
}
if (Test-Path "$env:LOCALAPPDATA\\npm-cache") {
  Write-Output 'Limpiando %LOCALAPPDATA%\\npm-cache'
  Remove-Item -Recurse -Force "$env:LOCALAPPDATA\\npm-cache\\*" -EA SilentlyContinue
}
if (Test-Path "$env:LOCALAPPDATA\\Cypress\\Cache") {
  Write-Output 'Limpiando caché de Cypress'
  Remove-Item -Recurse -Force "$env:LOCALAPPDATA\\Cypress\\Cache\\*" -EA SilentlyContinue
}
if (Test-Path "$env:TEMP") {
  Write-Output 'Limpiando carpeta TEMP del usuario'
  Get-ChildItem "$env:TEMP" -Force -EA SilentlyContinue | Remove-Item -Recurse -Force -EA SilentlyContinue
}

# 5) Resumen final
$freeAfter = Get-DiskFreeGB
$delta = [math]::Round(($freeAfter - $freeBefore), 2)
Write-Output ("Espacio libre final: {0} GB" -f $freeAfter)
Write-Output ("Espacio recuperado: {0} GB" -f $delta)
Write-Output '=== Limpieza completada ==='

Param(
  [string]$Root
)

$ErrorActionPreference = 'Stop'

if (-not $Root) {
  $Root = (Get-Location).Path
}

$envPath = Join-Path $Root '.env'
$envLocal = Join-Path $Root '.env.local'

function Backup($p) {
  if (Test-Path $p) {
    $ts = Get-Date -Format 'yyyyMMddHHmmss'
    Copy-Item -LiteralPath $p -Destination ($p + '.bak.' + $ts) -Force
  }
}

function Upsert($p, $k, $v) {
  if (!(Test-Path $p)) { New-Item -Path $p -ItemType File -Force | Out-Null }
  $lines = Get-Content -LiteralPath $p -ErrorAction SilentlyContinue
  if ($null -eq $lines) { $lines = @() }
  $found = $false
  $pattern = '^[\s]*' + [Regex]::Escape($k) + '[\s]*='
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $pattern) {
      $lines[$i] = "$k=$v"
      $found = $true
      break
    }
  }
  if (-not $found) { $lines += "$k=$v" }
  $content = ($lines -join "`r`n") + "`r`n"
  Set-Content -LiteralPath $p -Value $content -Encoding UTF8 -NoNewline
}

Backup $envPath
Backup $envLocal

# Backend / servidor
Upsert $envPath 'PORT' '4004'
Upsert $envPath 'ALLOWED_ORIGIN' 'http://localhost:5173'
Upsert $envPath 'BACKEND_BASE_URL' 'http://localhost:4004'
Upsert $envPath 'FRONTEND_BASE_URL' 'http://localhost:5173'
Upsert $envPath 'ALLOW_MOCK_TOKENS' 'true'
Upsert $envPath 'SPOTIFY_REDIRECT_URI' 'http://localhost:4004/api/spotify/callback'
Upsert $envPath 'PUBLIC_SITES_BASE_DOMAIN' ''

# Frontend / Vite
Upsert $envLocal 'VITE_BACKEND_BASE_URL' 'http://localhost:4004'
Upsert $envLocal 'VITE_DEFAULT_COUNTRY_CODE' '1'

Write-Host '✅ Actualización completada: .env y .env.local'

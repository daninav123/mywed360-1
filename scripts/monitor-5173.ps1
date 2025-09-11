param(
  [int]$Port = 5173,
  [string]$ProjectDir = (Resolve-Path "$(Split-Path $PSScriptRoot -Parent)"),
  [string]$StartCommand = "npm run dev",
  [int]$StartupTimeoutSec = 25,
  [switch]$KillConflicts,
  [switch]$AutoFix,
  [int]$MaxRestarts = 10
)

$ErrorActionPreference = 'Stop'

function Write-Log {
  param([string]$Message, [string]$Level = 'INFO')
  $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  $line = "[$ts][$Level] $Message"
  Write-Host $line
  Add-Content -Path $Global:MonitorLogFile -Value $line
}

function Ensure-LogDirs {
  $logsRoot = Join-Path $ProjectDir 'logs'
  $monitorDir = Join-Path $logsRoot 'monitor'
  if (-not (Test-Path $logsRoot)) { New-Item -ItemType Directory -Path $logsRoot | Out-Null }
  if (-not (Test-Path $monitorDir)) { New-Item -ItemType Directory -Path $monitorDir | Out-Null }
  $Global:MonitorDir = $monitorDir
  $Global:MonitorLogFile = Join-Path $monitorDir "monitor-$(Get-Date -Format 'yyyyMMdd').log"
}

function Get-PortProcessId {
  param([int]$Port)
  try {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
    if ($null -ne $conn) { return $conn.OwningProcess }
  } catch { }
  return $null
}

function Get-ProcessInfo {
  param([int]$TargetPid)
  try { return Get-Process -Id $TargetPid -ErrorAction Stop } catch { return $null }
}

function Kill-IfNodeVite {
  param([int]$TargetPid)
  $p = Get-ProcessInfo -TargetPid $TargetPid
  if ($null -eq $p) { return $false }
  $name = $p.ProcessName
  # Only terminate likely Node/Vite processes to be safe
  if ($name -match '^(node|npm|pnpm|yarn|bun)$' -or $name -like '*vite*') {
    try {
      Write-Log "Deteniendo proceso en puerto ${Port}: PID=$TargetPid, Nombre=$name" 'WARN'
      Stop-Process -Id $TargetPid -Force -ErrorAction Stop
      Start-Sleep -Milliseconds 600
      return $true
    } catch {
      Write-Log "No se pudo detener PID=$TargetPid ($name): $($_.Exception.Message)" 'ERROR'
    }
  }
  return $false
}

function Start-DevServer {
  param([string]$CmdLine)
  $logFile = Join-Path $Global:MonitorDir ("dev-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")
  $Global:LastDevLog = $logFile
  $exe = 'powershell.exe'
  $args = @('-NoProfile','-Command',"cd `"$ProjectDir`"; $CmdLine 2>&1 | Tee-Object -FilePath `"$logFile`"")
  Write-Log "Iniciando servidor: $CmdLine (log: $logFile)"
  $p = Start-Process -FilePath $exe -ArgumentList $args -WorkingDirectory $ProjectDir -WindowStyle Hidden -PassThru
  return $p
}

function Wait-For-Port {
  param([int]$Port, [int]$TimeoutSec = 20)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $portPid = Get-PortProcessId -Port $Port
    if ($portPid) { return $portPid }
    Start-Sleep -Milliseconds 500
  }
  return $null
}

function Tail-LastLines {
  param([string]$File, [int]$Count = 50)
  if (-not (Test-Path $File)) { return @() }
  return Get-Content -Path $File -Tail $Count -ErrorAction SilentlyContinue
}

function Test-ServerHealthy {
  param([int]$Port)
  try {
    $url = "http://127.0.0.1:$Port/"
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -Method GET -ErrorAction Stop
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
      $content = ($resp.Content | Out-String)
      if ($content -match 'vite' -or $content -match '<!DOCTYPE html>' -or $content.Length -gt 0) { return $true }
    }
  } catch { }
  return $false
}

function Auto-FixIfPossible {
  param([string[]]$RecentLogLines)
  $didFix = $false
  if (-not $AutoFix.IsPresent) { return $false }

  $text = ($RecentLogLines -join "`n")

  if ($text -match 'EADDRINUSE' -or $text -match 'address already in use') {
    $pid = Get-PortProcessId -Port $Port
    if ($pid) {
      if ($KillConflicts.IsPresent) {
        $didFix = (Kill-IfNodeVite -TargetPid $pid) -or $didFix
      } else {
        if (Test-ServerHealthy -Port $Port) {
          Write-Log "Puerto $Port ocupado pero el servidor responde. No se realiza ninguna acción." 'INFO'
        } else {
          Write-Log "Puerto $Port ocupado por otro proceso pero no responde. No se mata el proceso; se reintentará más tarde." 'WARN'
        }
      }
    }
  }

  if ($text -match 'ERR_MODULE_NOT_FOUND' -or $text -match 'Cannot find module') {
    try {
      Write-Log 'Dependencias faltantes detectadas. Ejecutando npm install…' 'WARN'
      Push-Location $ProjectDir
      npm install --silent | Out-Null
      Pop-Location
      $didFix = $true
    } catch {
      Write-Log "Fallo al ejecutar npm install: $($_.Exception.Message)" 'ERROR'
    }
  }

  if ($text -match 'EPERM' -or $text -match 'operation not permitted') {
    try {
      Write-Log 'Permisos/cachés sospechosos. Limpiando caché de Vite…' 'WARN'
      $paths = @(
        Join-Path $ProjectDir 'node_modules/.vite',
        Join-Path $ProjectDir 'node_modules/.cache/vite'
      )
      foreach ($p in $paths) { if (Test-Path $p) { Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $p } }
      $didFix = $true
    } catch {
      Write-Log "No se pudo limpiar cache: $($_.Exception.Message)" 'ERROR'
    }
  }

  return $didFix
}

Ensure-LogDirs
Write-Log "Monitor iniciado. Proyecto: $ProjectDir, Puerto: $Port, AutoFix: $($AutoFix.IsPresent), KillConflicts: $($KillConflicts.IsPresent)"

$restartCount = 0
$devProc = $null
$Global:LastFixSig = ''
$Global:LastFixTime = Get-Date '2000-01-01'

function Extract-ErrorSignature {
  param([string[]]$Lines)
  $text = ($Lines -join "`n")
  # esbuild/vite syntax error with file and message
  if ($text -match 'Unexpected \"catch\"[\s\S]*?\n\s+([^\n:]+):(\d+):(\d+)') {
    return "UnexpectedCatch:" + $Matches[1] + ":" + $Matches[2]
  }
  if ($text -match 'Cannot find module\s+\'([^\']+)\'') { return "MissingModule:" + $Matches[1] }
  if ($text -match 'ERR_MODULE_NOT_FOUND\b.*\'([^\']+)\'') { return "MissingModule:" + $Matches[1] }
  if ($text -match 'EADDRINUSE') { return 'EADDRINUSE' }
  if ($text -match 'EPERM') { return 'EPERM' }
  return ''
}

function Try-FixBySignature {
  param([string]$Sig, [string[]]$Recent)
  if (-not $AutoFix.IsPresent) { return $false }
  $did = $false
  switch -Regex ($Sig) {
    '^MissingModule:(.+)$' {
      $pkg = $Matches[1]
      # Evitar paquetes internos de rutas relativas
      if ($pkg -notmatch '^\.' -and $pkg -notmatch '^[A-Za-z]:\\') {
        try {
          Write-Log "Módulo faltante detectado: $pkg. Ejecutando npm install $pkg…" 'WARN'
          Push-Location $ProjectDir
          npm install $pkg --silent | Out-Null
          Pop-Location
          $did = $true
        } catch { Write-Log "Fallo al instalar $pkg: $($_.Exception.Message)" 'ERROR' }
      }
    }
    '^EADDRINUSE$' {
      # Ya manejado en Auto-FixIfPossible; aquí solo informamos
      Write-Log 'EADDRINUSE detectado. Sin acción destructiva por política.' 'WARN'
      $did = $false
    }
    '^EPERM$' {
      try {
        Write-Log 'EPERM detectado. Limpiando caché de Vite…' 'WARN'
        $paths = @(
          Join-Path $ProjectDir 'node_modules/.vite',
          Join-Path $ProjectDir 'node_modules/.cache/vite'
        )
        foreach ($p in $paths) { if (Test-Path $p) { Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $p } }
        $did = $true
      } catch { Write-Log "No se pudo limpiar cache: $($_.Exception.Message)" 'ERROR' }
    }
    '^UnexpectedCatch:(.+):(\d+)$' {
      $file = $Matches[1]
      $line = [int]$Matches[2]
      # Intento conservador: revisar las 20 líneas anteriores en busca de 'try {'
      try {
        $abs = if (Test-Path $file) { Resolve-Path $file } else { Resolve-Path (Join-Path $ProjectDir $file) -ErrorAction SilentlyContinue }
      } catch { $abs = $null }
      if ($abs) {
        try {
          $content = Get-Content -Path $abs -Raw
          $lines = $content -split "`n"
          $idx = [Math]::Min([Math]::Max($line-1,0), $lines.Length-1)
          $windowStart = [Math]::Max($idx-20,0)
          $surround = $lines[$windowStart..$idx] -join "`n"
          if ($surround -notmatch 'try\s*\{') {
            # Orphan catch: comentar la palabra catch temporalmente para permitir levantar el servidor
            $pattern = '(?m)^(\s*)catch(\s*\()'
            $new = [Regex]::Replace($content, $pattern, '$1/*FIXME_ORPHAN_*/catch$2')
            if ($new -ne $content) {
              Set-Content -Path $abs -Value $new -NoNewline
              Write-Log "Se detectó catch huérfano en $file:$line. Comentado de forma no destructiva (FIXME_ORPHAN_)." 'WARN'
              $did = $true
            }
          }
        } catch { Write-Log "No se pudo aplicar fix a $file:$line — $($_.Exception.Message)" 'ERROR' }
      } else {
        Write-Log "Ruta no localizada para aplicar fix: $file" 'WARN'
      }
    }
  }
  return $did
}

while ($true) {
  try {
    $listeningPid = Get-PortProcessId -Port $Port

    if (-not $listeningPid) {
      if ($null -eq $devProc -or $devProc.HasExited) {
        if ($restartCount -ge $MaxRestarts) {
          Write-Log "Número máximo de reinicios alcanzado ($MaxRestarts). Deteniendo monitor." 'ERROR'
          break
        }
        $restartCount++
        $devProc = Start-DevServer -CmdLine $StartCommand
        $pidAfter = Wait-For-Port -Port $Port -TimeoutSec $StartupTimeoutSec
        if ($pidAfter) {
          Write-Log "Servidor escuchando en $Port (PID=$pidAfter). Reinicios: $restartCount"
          $restartCount = 0
        } else {
          Write-Log "El servidor no comenzó a escuchar en $Port en ${StartupTimeoutSec}s" 'WARN'
          $recent = Tail-LastLines -File $Global:LastDevLog -Count 80
          if ($recent.Count -gt 0) { Write-Log ("Ultimas líneas de log:`n" + ($recent -join "`n")) 'DEBUG' }
          $sig = Extract-ErrorSignature -Lines $recent
          $fixed = $false
          if ($sig) {
            if ($sig -ne $Global:LastFixSig -or (Get-Date).AddSeconds(-60) -gt $Global:LastFixTime) {
              $fixed = Try-FixBySignature -Sig $sig -Recent $recent
              if ($fixed) { $Global:LastFixSig = $sig; $Global:LastFixTime = Get-Date }
            }
          }
          if ($fixed -or (Auto-FixIfPossible -RecentLogLines $recent)) {
            Write-Log 'Se aplicaron correcciones automáticas. Reintentando…' 'INFO'
          } else {
            Write-Log 'Sin corrección automática aplicable. Reintentando tras breve espera…' 'INFO'
          }
        }
      }
    } else {
      # Puerto ocupado. Si no es nuestro, decidir acción
      $pinfo = Get-ProcessInfo -TargetPid $listeningPid
      $pname = if ($pinfo) { $pinfo.ProcessName } else { 'desconocido' }
      if ($KillConflicts.IsPresent -and ($pname -match '^(node|npm|pnpm|yarn|bun)$' -or $pname -like '*vite*')) {
        if (Kill-IfNodeVite -TargetPid $listeningPid) {
          Write-Log "Proceso conflictivo en $Port detenido (${pname}:$listeningPid)." 'WARN'
          # forzar reinicio inmediato
          if ($devProc -and -not $devProc.HasExited) { try { Stop-Process -Id $devProc.Id -Force -ErrorAction SilentlyContinue } catch {} }
          $devProc = $null
        }
      }
      # Si el puerto está ocupado (servidor activo), vigilar logs y aplicar fixes no destructivos
      $candidateLog = if ($Global:LastDevLog -and (Test-Path $Global:LastDevLog)) { $Global:LastDevLog } else { (Join-Path $ProjectDir 'vite_output.txt') }
      if (Test-Path $candidateLog) {
        $recent = Tail-LastLines -File $candidateLog -Count 120
        $sig = Extract-ErrorSignature -Lines $recent
        if ($sig) {
          if ($sig -ne $Global:LastFixSig -or (Get-Date).AddSeconds(-60) -gt $Global:LastFixTime) {
            if (Try-FixBySignature -Sig $sig -Recent $recent) {
              $Global:LastFixSig = $sig; $Global:LastFixTime = Get-Date
              Write-Log "Corrección aplicada mientras el servidor estaba activo (sig=$sig)." 'INFO'
            }
          }
        }
      }
    }

  } catch {
    Write-Log "Excepción en bucle: $($_.Exception.Message)" 'ERROR'
  }

  Start-Sleep -Seconds 2
}

Write-Log 'Monitor finalizado.' 'INFO'

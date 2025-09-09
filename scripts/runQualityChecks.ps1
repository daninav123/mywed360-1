param(
  [switch]$UnitOnly
)

$ErrorActionPreference = 'Continue'
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$logsDir = "logs/outputs"
$newDir = New-Item -ItemType Directory -Force -Path $logsDir

$summaryPath = Join-Path $logsDir ("quality_summary_" + $ts + ".txt")

function Run-Step($name, $cmd){
  Write-Host "=== Running $name ==="
  $logPath = Join-Path $logsDir ($name.Replace(':','_') + "_" + $ts + ".log")
  $start = Get-Date
  cmd /c $cmd 1>> $logPath 2>&1
  $code = $LASTEXITCODE
  $dur = (Get-Date) - $start
  Add-Content -Path $summaryPath -Value ("$name ExitCode=$code Duration=" + [int]$dur.TotalSeconds + "s Log=$logPath")
  return $code
}

$overall = 0

# 1) Unit tests (focused first)
$code1 = Run-Step -name "test_unit" -cmd "npx vitest run"
if($code1 -ne 0){ $overall = 1 }

if(-not $UnitOnly){
  # 2) Lint
  $code2 = Run-Step -name "lint" -cmd "npm run lint"
  if($code2 -ne 0){ $overall = 1 }

  # 3) Validate Schemas
  $code3 = Run-Step -name "validate_schemas" -cmd "npm run validate:schemas"
  if($code3 -ne 0){ $overall = 1 }
}

Add-Content -Path $summaryPath -Value ("OVERALL=" + $overall)
Write-Host ("SUMMARY_PATH=" + $summaryPath)
exit $overall

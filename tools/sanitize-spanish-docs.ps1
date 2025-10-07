param(
  [string]$Root = 'docs/flujos-especificos',
  [string[]]$Extra = @('docs/flujos-usuario.md')
)

$ErrorActionPreference = 'Stop'

function Sanitize-Text {
  param([string]$Text)
  if ($null -eq $Text) { return $Text }

  # Keep: tab, CR, LF, ASCII printable, Latin-1 supplement (includes áéíóú ü ñ ¿ ¡ etc.)
  $builder = New-Object System.Text.StringBuilder
  foreach ($ch in $Text.ToCharArray()) {
    $code = [int][char]$ch
    if ($code -eq 0x09 -or $code -eq 0x0A -or $code -eq 0x0D) {
      [void]$builder.Append($ch)
      continue
    }
    if (($code -ge 0x20 -and $code -le 0x7E) -or ($code -ge 0x00A1 -and $code -le 0x00FF)) {
      [void]$builder.Append($ch)
      continue
    }
    # drop anything else (mojibake like ǟ, stray private-use, etc.)
  }

  $t = $builder.ToString()

  # Remove residual C2/C3/E2 lead bytes if they slipped as chars
  $t = ($t -replace '\u00C2', '')
  $t = ($t -replace '\u00C3', '')
  $t = ($t -replace '\u00E2', '')
  $t = ($t -replace '\uFFFD', '')

  # Normalize double punctuation remnants
  $t = ($t -replace "\'\'", "'")
  $t = ($t -replace '""', '"')

  return $t
}

$targets = @()
if (Test-Path -LiteralPath $Root) {
  $targets += (Get-ChildItem -Path $Root -Recurse -File -Include *.md | Select-Object -ExpandProperty FullName)
}
foreach ($x in $Extra) {
  if (Test-Path -LiteralPath $x) { $targets += (Resolve-Path -LiteralPath $x).Path }
}

$targets = $targets | Sort-Object -Unique

foreach ($p in $targets) {
  $orig = Get-Content -LiteralPath $p -Raw
  $new = Sanitize-Text -Text $orig
  if ($new -ne $orig) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $p), $new, $utf8NoBom)
    Write-Output ("Sanitized: {0}" -f $p)
  }
}

Write-Output ("Done. Files processed: {0}" -f $targets.Count)


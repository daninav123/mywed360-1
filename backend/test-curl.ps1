# Test con curl - OpenAI API

$apiKey = $env:OPENAI_API_KEY
if (-not $apiKey) {
    # Cargar desde .env
    $envContent = Get-Content .env
    foreach ($line in $envContent) {
        if ($line -match '^OPENAI_API_KEY=(.+)$') {
            $apiKey = $matches[1]
            break
        }
    }
}

Write-Host "API Key: $($apiKey.Substring(0,20))..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Probando con curl..." -ForegroundColor Yellow
Write-Host ""

$body = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Di solo 'funciona'"
        }
    )
    max_tokens = 5
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $apiKey"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "✅ FUNCIONA!" -ForegroundColor Green
    Write-Host "Respuesta: $($response.choices[0].message.content)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalles: $responseBody" -ForegroundColor Yellow
    }
}

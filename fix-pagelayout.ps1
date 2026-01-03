# Script para eliminar PageLayout y PageSection de todos los archivos
$files = Get-ChildItem -Path "apps\main-app\src\pages" -Filter "*.jsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Eliminar imports de PageLayout y PageSection
    if ($content -match "import.*\{[^}]*(PageLayout|PageSection)[^}]*\}.*from.*['\`"]\.\.\/components\/[Ll]ayouts['\`""]") {
        $content = $content -replace "import\s*\{[^}]*(PageLayout|PageSection)[^}]*\}\s*from\s*['\`""][^'\`""]*['\`""];?\s*\r?\n?", ""
        $modified = $true
    }
    
    # Eliminar tags <PageLayout> y </PageLayout>
    if ($content -match "</?PageLayout[^>]*>") {
        $content = $content -replace "<PageLayout[^>]*>", ""
        $content = $content -replace "</PageLayout>", ""
        $modified = $true
    }
    
    # Eliminar tags <PageSection> y </PageSection>
    if ($content -match "</?PageSection[^>]*>") {
        $content = $content -replace "<PageSection[^>]*>", ""
        $content = $content -replace "</PageSection>", ""
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ $($file.Name) limpiado"
    }
}

Write-Host "`n🎉 Limpieza completada - todos los PageLayout/PageSection eliminados"

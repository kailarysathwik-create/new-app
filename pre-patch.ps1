$cacheDir = "$env:USERPROFILE\.gradle\caches\8.13\transforms"
if (-not (Test-Path $cacheDir)) {
    Write-Host "Cache dir not found at $cacheDir" -ForegroundColor Red
    exit 0
}

Write-Host "Searching for problematic RN headers in $cacheDir..." -ForegroundColor Cyan

$headers = Get-ChildItem -Path $cacheDir -Filter "*.h" -Recurse | Where-Object { $_.Name -eq "graphicsConversions.h" -or $_.Name -eq "propsConversions.h" }

foreach ($header in $headers) {
    $content = Get-Content $header.FullName -Raw
    if ($content -match "std::format") {
        Write-Host "Patching: $($header.FullName)" -ForegroundColor Yellow
        $newContent = $content -replace 'std::format\("{}%", dimension.value\)', '(std::to_string(dimension.value) + "%")'
        $newContent = $newContent -replace 'std::format', '// patched std::format'
        
        # Remove read-only if present
        if ($header.IsReadOnly) {
            $header.IsReadOnly = $false
        }
        
        Set-Content -Path $header.FullName -Value $newContent -Encoding UTF8
        Write-Host "Patch applied successfully." -ForegroundColor Green
    }
}

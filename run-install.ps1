$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\DELL\Downloads\SHIFT_UP\Site SHIFT UP"

# Retry npm install (npm cache already has downloaded packages)
Write-Host "=== Tentative npm install --legacy-peer-deps ===" -ForegroundColor Cyan
$output = npm install --legacy-peer-deps 2>&1
$output | Out-File "C:\Users\DELL\Downloads\SHIFT_UP\Site SHIFT UP\npm-install.log" -Encoding UTF8
Write-Host $output
Write-Host "=== EXIT: $LASTEXITCODE ===" -ForegroundColor Green

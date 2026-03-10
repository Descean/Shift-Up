$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\DELL\Downloads\SHIFT_UP\Site SHIFT UP"
Write-Host "=== npm install --legacy-peer-deps ===" -ForegroundColor Cyan
npm install --legacy-peer-deps
Write-Host "=== EXIT CODE: $LASTEXITCODE ===" -ForegroundColor Green

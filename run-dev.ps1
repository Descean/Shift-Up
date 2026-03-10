$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\DELL\Downloads\SHIFT_UP\Site SHIFT UP"
Write-Host "=== npm run dev ===" -ForegroundColor Cyan
npm run dev

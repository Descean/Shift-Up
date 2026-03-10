$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$procs = Get-Process | Where-Object { $_.Name -in @('node', 'cmd') }
$procs | Format-Table Name, Id, CPU -AutoSize

$exists = Test-Path "C:\Users\DELL\Downloads\SHIFT_UP\Site SHIFT UP\node_modules"
Write-Host "node_modules existe: $exists"

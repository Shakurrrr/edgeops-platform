$ErrorActionPreference = "Stop"

# Ensure we are running from repo root
$root = Get-Location

# Create dist folder
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
New-Item -ItemType Directory -Path ".\dist" | Out-Null

# Go to API folder
Set-Location ".\apps\api"

# Install production deps only
npm install --omit=dev

# Create zip (PowerShell built-in)
Compress-Archive -Path * -DestinationPath "$root\dist\api.zip" -Force

# Return to root
Set-Location $root

Write-Host "Created dist/api.zip"

$ErrorActionPreference = "Stop"
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
New-Item -ItemType Directory -Path ".\dist" | Out-Null
Set-Location ".\apps\api"
$env:VERSION="v0.1.0"
$env:DEPLOYMENT="stable"
npm install --omit=dev
Compress-Archive -Path * -DestinationPath "..\..\dist\api-stable.zip" -Force
Set-Location "..\.."
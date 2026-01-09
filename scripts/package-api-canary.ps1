$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path ".\dist" | Out-Null
Set-Location ".\apps\api"
$env:VERSION="v0.2.0"
$env:DEPLOYMENT="canary"
npm install --omit=dev
Compress-Archive -Path * -DestinationPath "..\..\dist\api-canary.zip" -Force
Set-Location "..\.."
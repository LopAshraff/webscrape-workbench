$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js belum dijumpai. Sila install Node.js dahulu."
  Read-Host "Tekan Enter untuk keluar"
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..."
  npm install
}

Start-Process "http://localhost:4173"
try {
  npm run app
} catch {
  Write-Host ""
  Write-Host "Kalau browser dah terbuka, kemungkinan app memang sudah berjalan pada http://localhost:4173"
}

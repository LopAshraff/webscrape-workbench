Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$setupOutput = & (Join-Path $PSScriptRoot "setup-dev-code-signing-cert.ps1") | Out-String
Write-Host $setupOutput.Trim()

$env:WEBSCRAPE_USE_DEV_CERT = "1"
$env:WIN_CERT_SUBJECT = "CN=LopAshraff"
$env:WIN_PUBLISHER_NAME = "CN=LopAshraff"

Push-Location $repoRoot
try {
  npm run dist:win
}
finally {
  Pop-Location
}

param(
  [string]$Subject = "CN=LopAshraff",
  [string]$FriendlyName = "LopAshraff Dev Code Signing",
  [int]$ValidYears = 3
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-CodeSigningCert {
  param([string]$CertSubject)

  Get-ChildItem Cert:\CurrentUser\My |
    Where-Object {
      $_.Subject -eq $CertSubject -and
      $_.HasPrivateKey -and
      $_.NotAfter -gt (Get-Date).AddDays(7) -and
      (($_.EnhancedKeyUsageList | ForEach-Object { $_.FriendlyName }) -contains "Code Signing")
    } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1
}

function Ensure-CertTrusted {
  param(
    [System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate,
    [string]$StorePath
  )

  $store = New-Object System.Security.Cryptography.X509Certificates.X509Store($StorePath, "CurrentUser")
  $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
  try {
    $exists = $store.Certificates | Where-Object { $_.Thumbprint -eq $Certificate.Thumbprint } | Select-Object -First 1
    if (-not $exists) {
      $store.Add($Certificate)
    }
  }
  finally {
    $store.Close()
  }
}

$cert = Get-CodeSigningCert -CertSubject $Subject

if (-not $cert) {
  $cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject $Subject `
    -FriendlyName $FriendlyName `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyAlgorithm RSA `
    -KeyLength 4096 `
    -HashAlgorithm SHA256 `
    -KeyExportPolicy Exportable `
    -NotAfter (Get-Date).AddYears($ValidYears)
}

Ensure-CertTrusted -Certificate $cert -StorePath "Root"
Ensure-CertTrusted -Certificate $cert -StorePath "TrustedPublisher"

[pscustomobject]@{
  Subject = $cert.Subject
  Thumbprint = $cert.Thumbprint
  NotAfter = $cert.NotAfter
} | Format-List

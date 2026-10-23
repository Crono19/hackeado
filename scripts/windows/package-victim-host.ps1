[CmdletBinding()]
param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release',
    [string]$Runtime = 'win-x64'
)

$ErrorActionPreference = 'Stop'

if ($env:OS -ne 'Windows_NT') {
    throw 'Este script debe ejecutarse dentro de Windows.'
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'No empaquetes Victim Host como administrador.'
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '../..')
& (Join-Path $PSScriptRoot 'build-victim-host.ps1') -Configuration $Configuration -Runtime $Runtime -SelfContained $true

$publish = Join-Path $repoRoot "apps/windows-agent/Hackeado.VictimHost/bin/$Configuration/net8.0-windows10.0.19041.0/$Runtime/publish"
$releaseDirectory = Join-Path $repoRoot 'release/windows-agent'
$staging = Join-Path ([System.IO.Path]::GetTempPath()) "hackeado-agent-$([Guid]::NewGuid().ToString('N'))"
$bundle = Join-Path $staging 'HACKEADO-VictimHost'
$archive = Join-Path $releaseDirectory 'HACKEADO-VictimHost-1.0.0-rc.1-win-x64.zip'

try {
    New-Item -ItemType Directory -Path $bundle -Force | Out-Null
    New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
    Copy-Item -Path (Join-Path $publish '*') -Destination $bundle -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $repoRoot 'config/windows-agent.example.json') `
        -Destination (Join-Path $bundle 'agent-config.example.json')
    Copy-Item -LiteralPath (Join-Path $repoRoot 'apps/windows-agent/README.md') `
        -Destination (Join-Path $bundle 'README.md')

    $files = Get-ChildItem -Path $bundle -File -Recurse | Sort-Object FullName
    $hashLines = foreach ($file in $files) {
        $relative = $file.FullName.Substring($bundle.Length + 1).Replace('\', '/')
        $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        "$hash  $relative"
    }
    Set-Content -LiteralPath (Join-Path $bundle 'SHA256SUMS.txt') -Value $hashLines -Encoding UTF8
    if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }
    Compress-Archive -Path $bundle -DestinationPath $archive -CompressionLevel Optimal
    $archiveHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    Set-Content -LiteralPath "$archive.sha256" -Value "$archiveHash  $(Split-Path $archive -Leaf)" -Encoding ASCII
    Write-Host "AGENT PACKAGE // $archive" -ForegroundColor Green
    Write-Host "SHA256 // $archiveHash" -ForegroundColor Cyan
    Write-Host 'agent-config.json real no fue incluido.' -ForegroundColor Yellow
}
finally {
    if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
}

param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release',
    [string]$Runtime = 'win-x64',
    [bool]$SelfContained = $true
)

$ErrorActionPreference = 'Stop'

if ($env:OS -ne 'Windows_NT') {
    throw 'Este script debe ejecutarse dentro de Windows.'
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'No compiles ni ejecutes Victim Host como administrador.'
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '../..')
$solution = Join-Path $repoRoot 'apps/windows-agent/Hackeado.VictimHost.sln'
$project = Join-Path $repoRoot 'apps/windows-agent/Hackeado.VictimHost/Hackeado.VictimHost.csproj'

dotnet restore $solution
dotnet test $solution -c $Configuration --no-restore
dotnet restore $project -r $Runtime
dotnet publish $project -c $Configuration -r $Runtime --self-contained $SelfContained --no-restore `
    -p:PublishReadyToRun=true `
    -p:DebugType=None `
    -p:DebugSymbols=false

$publish = Join-Path $repoRoot "apps/windows-agent/Hackeado.VictimHost/bin/$Configuration/net8.0-windows10.0.19041.0/$Runtime/publish"
Write-Host "Victim Host compilado y probado: $publish" -ForegroundColor Green
Write-Host 'Copia agent-config.json junto al ejecutable antes de abrirlo.' -ForegroundColor Yellow

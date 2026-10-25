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

function Invoke-DotNet {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$DotNetArguments,
        [Parameter(Mandatory = $true)]
        [string]$Stage
    )

    & dotnet @DotNetArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo de dotnet durante '$Stage' (código $LASTEXITCODE)."
    }
}

Invoke-DotNet -Stage 'restore solution' -DotNetArguments @('restore', $solution)
Invoke-DotNet -Stage 'test solution' -DotNetArguments @('test', $solution, '-c', $Configuration, '--no-restore')
Invoke-DotNet -Stage 'restore runtime' -DotNetArguments @('restore', $project, '-r', $Runtime)
Invoke-DotNet -Stage 'publish' -DotNetArguments @(
    'publish',
    $project,
    '-c', $Configuration,
    '-r', $Runtime,
    '--self-contained', $SelfContained.ToString().ToLowerInvariant(),
    '--no-restore',
    '-p:PublishReadyToRun=true',
    '-p:DebugType=None',
    '-p:DebugSymbols=false'
)

$publish = Join-Path $repoRoot "apps/windows-agent/Hackeado.VictimHost/bin/$Configuration/net8.0-windows10.0.19041.0/$Runtime/publish"
if (-not (Test-Path -LiteralPath (Join-Path $publish 'HACKEADO.VictimHost.exe') -PathType Leaf)) {
    throw "Publicación incompleta: falta HACKEADO.VictimHost.exe en $publish"
}
Write-Host "Victim Host compilado y probado: $publish" -ForegroundColor Green
Write-Host 'Copia agent-config.json junto al ejecutable antes de abrirlo.' -ForegroundColor Yellow

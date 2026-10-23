[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$Apply,
    [string]$DemoRoot = 'C:\HACKEADO-DEMO'
)

$ErrorActionPreference = 'Stop'

if ($env:OS -ne 'Windows_NT') {
    throw 'Este script solo puede ejecutarse dentro de la VM Windows.'
}

$resolvedRoot = [System.IO.Path]::GetFullPath($DemoRoot)
if ($resolvedRoot -ne 'C:\HACKEADO-DEMO') {
    throw 'Ruta rechazada. Este script solo prepara C:\HACKEADO-DEMO.'
}

$directories = @(
    $resolvedRoot,
    (Join-Path $resolvedRoot 'Escritorio'),
    (Join-Path $resolvedRoot 'Documentos'),
    (Join-Path $resolvedRoot 'Descargas'),
    (Join-Path $resolvedRoot 'Evidencias')
)

$files = @{
    'Escritorio\Tarea_Final.txt' = "PROYECTO FICTICIO`r`nContenido preparado para HACKEADO."
    'Escritorio\Foto_Graduacion.txt' = 'Marcador ficticio. Sustituir por imagen sin personas reales.'
    'Documentos\Presupuesto_Familiar.txt' = "DATOS SIMULADOS`r`nIngreso: Q 8,000`r`nGastos: Q 6,500"
    'Documentos\Datos_Bancarios_SIMULADOS.txt' = "DEMOSTRACION`r`nCuenta: 0000-0000-0000`r`nSin valor real."
    'Documentos\Contraseñas_FALSAS.txt' = "CUENTAS FICTICIAS`r`ncorreo.demo@example.invalid`r`nClave: NUNCA-USAR-ESTA-CLAVE"
    'Descargas\SoporteTecnico.exe.txt' = 'Archivo señuelo de texto. No es ejecutable.'
    'Evidencias\Registro_Incidente.txt' = 'Registro ficticio para reto de recuperación.'
}

Write-Host 'HACKEADO VM PREP // auditando destino' -ForegroundColor Cyan
Write-Host "Usuario: $env:USERNAME"
Write-Host "Ruta: $resolvedRoot"
Write-Host "Modo: $(if ($Apply) { 'APPLY' } else { 'AUDIT ONLY' })"

if (-not $Apply) {
    foreach ($directory in $directories) {
        Write-Host "[PLAN] crear/verificar $directory"
    }
    foreach ($relativePath in $files.Keys | Sort-Object) {
        Write-Host "[PLAN] crear archivo ficticio $relativePath"
    }
    Write-Host 'Sin cambios. Ejecuta con -Apply dentro de la VM preparada.' -ForegroundColor Yellow
    exit 0
}

foreach ($directory in $directories) {
    if ($PSCmdlet.ShouldProcess($directory, 'Crear directorio de demostración')) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
}

foreach ($entry in $files.GetEnumerator()) {
    $target = Join-Path $resolvedRoot $entry.Key
    if ($PSCmdlet.ShouldProcess($target, 'Crear archivo ficticio')) {
        Set-Content -LiteralPath $target -Value $entry.Value -Encoding UTF8
    }
}

Write-Host 'Preparación completada. Ejecuta verify-demo-vm.ps1.' -ForegroundColor Green

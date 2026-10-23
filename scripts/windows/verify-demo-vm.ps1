[CmdletBinding()]
param(
    [string]$DemoRoot = 'C:\HACKEADO-DEMO',
    [string]$ExpectedUser = 'VictimaDemo'
)

$ErrorActionPreference = 'Stop'
$failures = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Test-Check {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Failure
    )
    if ($Passed) {
        Write-Host "[OK] $Name" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        $failures.Add($Failure)
    }
}

if ($env:OS -ne 'Windows_NT') {
    throw 'Este verificador solo puede ejecutarse dentro de la VM Windows.'
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$isAdministrator = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Test-Check 'Usuario de demostración' ($env:USERNAME -eq $ExpectedUser) "Usuario actual: $env:USERNAME"
Test-Check 'Sesión sin privilegios administrativos' (-not $isAdministrator) 'Usuario pertenece a Administradores.'
Test-Check 'Carpeta ficticia presente' (Test-Path -LiteralPath $DemoRoot -PathType Container) 'Falta C:\HACKEADO-DEMO.'

$requiredFiles = @(
    'Escritorio\Tarea_Final.txt',
    'Documentos\Presupuesto_Familiar.txt',
    'Documentos\Datos_Bancarios_SIMULADOS.txt',
    'Documentos\Contraseñas_FALSAS.txt',
    'Descargas\SoporteTecnico.exe.txt',
    'Evidencias\Registro_Incidente.txt'
)

foreach ($relativePath in $requiredFiles) {
    $target = Join-Path $DemoRoot $relativePath
    Test-Check "Archivo ficticio: $relativePath" (Test-Path -LiteralPath $target -PathType Leaf) "Falta $target"
}

$processNames = Get-Process | Select-Object -ExpandProperty ProcessName
foreach ($name in @('OneDrive', 'Dropbox', 'GoogleDriveFS')) {
    if ($processNames -contains $name) {
        $warnings.Add("Proceso personal potencialmente activo: $name")
    }
}

Write-Host ''
foreach ($warning in $warnings) {
    Write-Host "[WARN] $warning" -ForegroundColor Yellow
}

if ($failures.Count -gt 0) {
    Write-Host "PRECHECK FALLIDO // $($failures.Count) problema(s)" -ForegroundColor Red
    foreach ($failure in $failures) { Write-Host " - $failure" }
    exit 1
}

Write-Host 'PRECHECK APROBADO // revisión manual todavía obligatoria' -ForegroundColor Green
Write-Host 'Confirmar manualmente: carpetas compartidas, clipboard, drag-and-drop, USB y snapshot.'
exit 0

# Manual completo de Windows — HACKEADO Victim Host

## Propósito

Este manual prepara una instalación de Windows 11 como víctima autorizada de HACKEADO. Empieza desde una máquina que todavía no reconoce `dotnet` y termina con pantalla WebRTC y control consentido de mouse y teclado desde el panel Atacante de la Mac.

La aplicación es visible, temporal y limitada a la sesión gráfica del usuario de demostración. No es un servicio, no arranca automáticamente y no debe ejecutarse como administrador.

## Resultado esperado

Al terminar tendrás:

- Windows 11 con .NET 8 SDK y WebView2 Runtime;
- un usuario estándar llamado `VictimaDemo`;
- datos ficticios bajo `C:\HACKEADO-DEMO`;
- el certificado local de la Mac confiado únicamente en el laboratorio;
- `HACKEADO.VictimHost.exe` publicado y configurado;
- conectividad HTTPS/WSS con la Mac;
- captura de pantalla completa y control revocable;
- snapshot limpio para repetir la exposición.

## Límites obligatorios

- Usa exclusivamente Windows o una VM que tú controles y hayas autorizado.
- No introduzcas cuentas, correos, contraseñas o documentos reales.
- No ejecutes Victim Host como administrador.
- No abras UAC, pantalla de bloqueo, gestores de contraseñas ni perfiles personales.
- No dejes carpetas compartidas, portapapeles o drag-and-drop del hipervisor habilitados durante la exposición.
- No copies `rootCA-key.pem` a Windows. Solo se copia el certificado público `rootCA.pem`.
- No publiques `.env`, `agent-config.json`, certificados privados ni el ZIP compilado.

---

# Parte 1 — Comprobar Windows

## Paso 1. Confirmar versión y arquitectura

Presiona `Windows + R`, escribe `winver` y pulsa Enter.

La configuración recomendada es Windows 11 actualizado.

Después abre PowerShell y ejecuta:

```powershell
$env:PROCESSOR_ARCHITECTURE
```

Resultados posibles:

- `AMD64`: Windows x64; es el objetivo principal del paquete actual.
- `ARM64`: habitual en Parallels sobre una Mac Apple Silicon. Windows puede ejecutar aplicaciones x64 mediante emulación, pero debes probar todas las funciones antes de la exposición.

Comprueba también la resolución:

1. Abre **Configuración**.
2. Entra a **Sistema → Pantalla**.
3. Selecciona `1920 × 1080` si está disponible.
4. Utiliza escala `100 %` o `125 %`.

## Paso 2. Confirmar que falta .NET

Ejecuta:

```powershell
dotnet --version
```

Si aparece:

```text
El término 'dotnet' no se reconoce...
```

continúa con la Parte 2. No es un error del proyecto: todavía falta instalar el SDK.

---

# Parte 2 — Instalar .NET 8 SDK

El proyecto compila una aplicación WPF dirigida a `.NET 8`. Necesitas el **SDK**, no solamente el runtime. Microsoft indica que el SDK incluye los runtimes necesarios para aplicaciones de escritorio. Consulta la [guía oficial de instalación de .NET en Windows](https://learn.microsoft.com/es-es/dotnet/core/install/windows).

## Paso 3. Abrir PowerShell como administrador

La instalación del SDK es una tarea de preparación del sistema y se realiza una sola vez:

1. Abre Inicio.
2. Escribe `PowerShell`.
3. Haz clic derecho sobre **Windows PowerShell**.
4. Selecciona **Ejecutar como administrador**.
5. Acepta UAC.

No uses esta consola administrativa para ejecutar Victim Host.

## Paso 4. Comprobar WinGet

```powershell
winget --version
```

### Si WinGet funciona

Instala exactamente el SDK 8:

```powershell
winget install --id Microsoft.DotNet.SDK.8 --exact --source winget --accept-source-agreements --accept-package-agreements
```

Espera hasta que indique que la instalación fue correcta.

### Si WinGet tampoco se reconoce

Primero intenta registrar App Installer:

```powershell
Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe
```

Cierra PowerShell, ábrelo otra vez como administrador y ejecuta:

```powershell
winget --version
```

Microsoft documenta este procedimiento en la [guía oficial de WinGet](https://learn.microsoft.com/es-es/windows/package-manager/winget/).

Si continúa sin funcionar, usa el instalador gráfico:

1. Abre la [página oficial de instalación de .NET para Windows](https://learn.microsoft.com/es-es/dotnet/core/install/windows).
2. Entra a la descarga de **.NET 8**.
3. Selecciona **SDK**, no `Runtime`.
4. Descarga el instalador de Windows para tu arquitectura.
5. Para la configuración principal del proyecto selecciona `x64`.
6. Ejecuta el instalador.
7. Pulsa **Install**.
8. Reinicia Windows si el instalador lo solicita.

## Paso 5. Cerrar y volver a abrir PowerShell

El `PATH` de una consola ya abierta puede quedar desactualizado.

1. Cierra todas las ventanas de PowerShell.
2. Abre una nueva ventana normal de PowerShell.
3. Ejecuta:

```powershell
dotnet --version
dotnet --list-sdks
dotnet --info
```

El primer comando debe mostrar `8.x.x` o una versión posterior capaz de compilar `net8.0` y `--list-sdks` debe incluir una línea que empieza con `8.`.

## Paso 6. Si `dotnet` sigue sin reconocerse

Comprueba si el ejecutable existe:

```powershell
Test-Path 'C:\Program Files\dotnet\dotnet.exe'
```

### Si devuelve `True`

Actualiza el `PATH` de la consola actual:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
dotnet --version
```

También puedes ejecutar directamente:

```powershell
& 'C:\Program Files\dotnet\dotnet.exe' --info
```

Si eso funciona pero `dotnet` solo no funciona, reinicia Windows.

### Si devuelve `False`

La instalación no terminó. Repite el Paso 4 con el instalador oficial y revisa que instalaste **.NET 8 SDK**.

No avances hasta que esto funcione:

```powershell
dotnet --version
```

---

# Parte 3 — Comprobar WebView2

Victim Host utiliza WebView2 para mostrar la interfaz Víctima dentro de la aplicación nativa. Windows 11 normalmente ya incluye el runtime.

## Paso 7. Comprobar Microsoft Edge

1. Abre Inicio.
2. Busca **Microsoft Edge**.
3. Ábrelo una vez.
4. Cierra Edge.

Si Victim Host posteriormente muestra una ventana vacía o un error de inicialización, instala **Evergreen WebView2 Runtime** desde la [página oficial de Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2).

Selecciona:

1. **Evergreen Standalone Installer** para instalaciones offline, o **Evergreen Bootstrapper** si Windows tiene Internet.
2. Arquitectura `x64` para la configuración principal.
3. Ejecuta el instalador como administrador.
4. Cierra la consola administrativa al finalizar.

---

# Parte 4 — Crear el usuario de demostración

## Paso 8. Crear `VictimaDemo`

Desde una cuenta administradora:

1. Abre **Configuración**.
2. Entra a **Cuentas → Otros usuarios**.
3. Pulsa **Agregar cuenta**.
4. Selecciona **No tengo la información de inicio de sesión de esta persona**.
5. Selecciona **Agregar un usuario sin cuenta Microsoft**.
6. Usa el nombre `VictimaDemo`.
7. No agregues datos personales.
8. Confirma que el tipo de cuenta sea **Usuario estándar**.

## Paso 9. Crear y autorizar la carpeta ficticia

Todavía desde una consola administrativa:

```powershell
New-Item -ItemType Directory -Path C:\HACKEADO-DEMO -Force
icacls C:\HACKEADO-DEMO /grant "VictimaDemo:(OI)(CI)M"
```

Después:

1. Cierra sesión.
2. Inicia como `VictimaDemo`.
3. Desde este punto utiliza el usuario estándar, salvo cuando el manual indique expresamente lo contrario.

## Paso 10. Limpiar el entorno

En la cuenta `VictimaDemo`:

- no inicies sesión en OneDrive;
- no agregues cuenta Microsoft personal;
- no abras correo personal;
- no instales gestor de contraseñas;
- no agregues perfiles personales a Edge;
- cierra Dropbox y Google Drive si existen;
- elimina documentos reales de Escritorio, Documentos y Descargas.

---

# Parte 5 — Copiar el proyecto a Windows

## Paso 11. Copiar la fuente

Necesitas el repositorio completo porque los scripts de Windows compilan el agente. En este manual `C:\HACKEADO-SOURCE` es la carpeta contenedora y el clon conserva el nombre `hackeado`, por lo que la raíz real del repositorio es:

```text
C:\HACKEADO-SOURCE\hackeado
```

Si todavía no lo has clonado, abre PowerShell dentro de `C:\HACKEADO-SOURCE` y utiliza la URL real de tu repositorio:

```powershell
cd C:\HACKEADO-SOURCE
git clone URL-DE-TU-REPOSITORIO hackeado
```

Métodos aceptables:

- memoria USB;
- ZIP temporal;
- carpeta compartida del hipervisor, únicamente durante la preparación;
- `git clone` cuando todos los cambios estén publicados.

La copia debe contener al menos:

```text
C:\HACKEADO-SOURCE\hackeado\apps\windows-agent
C:\HACKEADO-SOURCE\hackeado\config
C:\HACKEADO-SOURCE\hackeado\scripts\windows
```

No copies desde la Mac:

- `.env`;
- `certs/hackeado-demo.key`;
- `rootCA-key.pem`;
- `node_modules`;
- datos personales.

Después de copiar localmente el proyecto, desactiva en el hipervisor:

- carpetas compartidas;
- portapapeles compartido;
- drag-and-drop;
- USB passthrough innecesario.

## Paso 12. Confirmar estructura

Abre PowerShell normal como `VictimaDemo`:

```powershell
cd C:\HACKEADO-SOURCE\hackeado
Test-Path .\apps\windows-agent\Hackeado.VictimHost.sln
Test-Path .\scripts\windows\build-victim-host.ps1
Test-Path .\config\windows-agent.example.json
```

Los tres resultados deben ser `True`.

---

# Parte 6 — Preparar datos ficticios

## Paso 13. Permitir scripts solo en esta consola

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Esta configuración desaparece al cerrar PowerShell.

## Paso 14. Auditar los cambios

```powershell
.\scripts\windows\prepare-demo-vm.ps1
```

Debe mostrar el plan sin crear archivos.

## Paso 15. Crear los datos ficticios

```powershell
.\scripts\windows\prepare-demo-vm.ps1 -Apply
```

## Paso 16. Verificar Windows

```powershell
.\scripts\windows\verify-demo-vm.ps1
```

El resultado correcto termina con:

```text
PRECHECK APROBADO // revisión manual todavía obligatoria
```

Si dice que el usuario no es `VictimaDemo`, cierra sesión y entra con la cuenta correcta.

---

# Parte 7 — Instalar el certificado de la Mac

## Paso 17. Recibir el certificado público

En la Mac se genera una copia con:

```bash
cp "$(mkcert -CAROOT)/rootCA.pem" "$HOME/Desktop/HACKEADO-rootCA.pem"
```

Copia ese archivo a Windows, por ejemplo:

```text
C:\HACKEADO-CERT\HACKEADO-rootCA.pem
```

Solo debes copiar `rootCA.pem`. Nunca copies `rootCA-key.pem`.

## Paso 18. Confiar en el certificado

Abre PowerShell como administrador y ejecuta:

```powershell
New-Item -ItemType Directory -Path C:\HACKEADO-CERT -Force
certutil -addstore -f Root C:\HACKEADO-CERT\HACKEADO-rootCA.pem
```

Debe terminar con:

```text
CertUtil: -addstore command completed successfully.
```

Cierra la consola administrativa y vuelve a PowerShell normal como `VictimaDemo`.

## Paso 19. Probar el certificado y la red

Primero la Mac debe estar ejecutando:

```bash
npm run start:expo
```

En Windows sustituye `192.168.1.50` por la IP real de la Mac:

```powershell
Test-NetConnection 192.168.1.50 -Port 3000
```

Debe aparecer:

```text
TcpTestSucceeded : True
```

Después:

```powershell
Invoke-WebRequest https://192.168.1.50:3000/api/health
```

También puedes abrir en Edge:

```text
https://192.168.1.50:3000/api/health
```

El resultado debe incluir:

```json
{
  "status": "ok",
  "version": "1.0.0-rc.1"
}
```

No debe aparecer una advertencia de certificado.

---

# Parte 8 — Compilar y probar el agente

La primera compilación necesita Internet para descargar paquetes NuGet, incluyendo el SDK de WebView2 usado por el proyecto.

## Paso 20. Abrir PowerShell normal

No uses **Ejecutar como administrador**.

```powershell
cd C:\HACKEADO-SOURCE\hackeado
Set-ExecutionPolicy -Scope Process Bypass
dotnet --version
```

## Paso 21. Ejecutar pruebas C#

```powershell
dotnet test .\apps\windows-agent\Hackeado.VictimHost.sln -c Release
```

No continúes si aparece una prueba fallida.

## Paso 22. Publicar Victim Host

```powershell
.\scripts\windows\build-victim-host.ps1
```

Este script:

1. restaura dependencias;
2. ejecuta las pruebas;
3. publica una versión Release autocontenida;
4. desactiva símbolos de depuración.

La salida principal será:

```text
C:\HACKEADO-SOURCE\hackeado\apps\windows-agent\Hackeado.VictimHost\bin\Release\net8.0-windows10.0.19041.0\win-x64\publish
```

Comprueba el ejecutable:

```powershell
Test-Path .\apps\windows-agent\Hackeado.VictimHost\bin\Release\net8.0-windows10.0.19041.0\win-x64\publish\HACKEADO.VictimHost.exe
```

Debe devolver `True`.

## Paso 23. Crear el ZIP final

```powershell
.\scripts\windows\package-victim-host.ps1
```

Se generarán:

```text
C:\HACKEADO-SOURCE\hackeado\release\windows-agent\HACKEADO-VictimHost-1.0.0-rc.1-win-x64.zip
C:\HACKEADO-SOURCE\hackeado\release\windows-agent\HACKEADO-VictimHost-1.0.0-rc.1-win-x64.zip.sha256
```

Verifica el hash:

```powershell
Get-FileHash .\release\windows-agent\HACKEADO-VictimHost-1.0.0-rc.1-win-x64.zip -Algorithm SHA256
```

## Paso 24. Extraer la aplicación

```powershell
New-Item -ItemType Directory -Path C:\HACKEADO-APP -Force
Expand-Archive `
  -Path .\release\windows-agent\HACKEADO-VictimHost-1.0.0-rc.1-win-x64.zip `
  -DestinationPath C:\HACKEADO-APP `
  -Force
```

El ejecutable debe quedar dentro de:

```text
C:\HACKEADO-APP\HACKEADO-VictimHost\HACKEADO.VictimHost.exe
```

---

# Parte 9 — Configurar Victim Host

## Paso 25. Crear la configuración local

Entra a la carpeta publicada:

```powershell
cd C:\HACKEADO-APP\HACKEADO-VictimHost
Copy-Item .\agent-config.example.json .\agent-config.json
notepad .\agent-config.json
```

Usa esta estructura:

```json
{
  "serverUrl": "https://192.168.1.50:3000",
  "deviceId": "hackeado-windows-vm",
  "agentKey": "COLOCA_AQUI_LA_MISMA_CLAVE_DE_LA_MAC",
  "displayName": "VM Windows 11 — VictimaDemo",
  "emergencyHotkey": "Ctrl+Shift+F12",
  "allowDevTools": false
}
```

Cambia:

- `192.168.1.50` por la IP actual de la Mac;
- `agentKey` por el valor exacto de `DEMO_AGENT_KEY` usado en `.env` en la Mac.

No cambies `deviceId` si la Mac usa:

```dotenv
DEMO_DEVICE_ID=hackeado-windows-vm
```

Comprueba que Windows no haya creado `agent-config.json.txt`:

```powershell
Get-ChildItem .\agent-config*
```

Debe existir exactamente:

```text
agent-config.json
```

## Paso 26. No compartir la configuración

`agent-config.json` contiene la clave temporal del agente. No lo incluyas en el ZIP, Git, correo o capturas públicas.

---

# Parte 10 — Primera ejecución

## Paso 27. Arrancar primero la Mac

En la Mac, desde la raíz del proyecto:

```bash
npm run start:expo
```

La consola debe mostrar una dirección como:

```text
https://192.168.1.50:3000
```

No cierres esa terminal.

## Paso 28. Abrir Victim Host

En Windows, PowerShell normal:

```powershell
cd C:\HACKEADO-APP\HACKEADO-VictimHost
.\HACKEADO.VictimHost.exe
```

Debe aparecer una ventana visible con:

```text
AGENTE WINDOWS CONECTADO
BRIDGE://READY
```

La interfaz Víctima aparecerá dentro de esa ventana.

Si Windows muestra una advertencia de firewall para Victim Host, permite solo redes privadas. El agente inicia conexiones salientes hacia la Mac; no publiques puertos de Windows en Internet.

---

# Parte 11 — Conectar la sesión live

## Paso 29. Crear sesión desde la Mac

En la Mac abre:

```text
https://IP-DE-LA-MAC:3000/coordinacion
```

Después:

1. selecciona **REMOTO REAL**;
2. pulsa **Crear sesión segura**;
3. anota el código de seis dígitos;
4. no pulses todavía **Iniciar sesión**.

## Paso 30. Solicitar acceso desde Windows

Dentro de Victim Host:

1. escribe el código;
2. pulsa **Solicitar acceso**;
3. espera aprobación.

## Paso 31. Conectar los otros roles

En la Mac abre:

```text
https://IP-DE-LA-MAC:3000/atacante
https://IP-DE-LA-MAC:3000/publico
```

En ambos paneles:

1. escribe el código;
2. pulsa **Solicitar acceso**.

## Paso 32. Aprobar roles

En Coordinación aprueba:

1. Víctima;
2. Atacante;
3. Público.

Espera hasta ver:

```text
Víctima: EN LÍNEA
Atacante: EN LÍNEA
Público: EN LÍNEA
Agente Windows: online
```

No continúes mientras el agente indique `offline`.

---

# Parte 12 — Flujo exacto de la demostración

## Paso 33. Iniciar

En Coordinación pulsa:

```text
▶ Iniciar sesión
```

## Paso 34. Entrar al escritorio ficticio

En Windows:

1. elige una identidad ficticia;
2. pulsa **Entrar al escritorio**;
3. espera el mensaje de soporte;
4. pulsa **Revisar mensaje**;
5. revisa opcionalmente las tres señales;
6. para la ruta de control real, pulsa **Solucionar ahora**.

## Paso 35. Conceder pantalla

En Atacante:

1. pulsa **Solicitar pantalla**.

En Windows:

1. pulsa **Permitir una vez**;
2. pulsa **Elegir pantalla completa**;
3. en el selector del sistema elige el monitor completo;
4. confirma compartir.

Atacante debe mostrar el escritorio con estado **SOLO VISTA**.

## Paso 36. Conceder entrada

En Atacante:

1. pulsa **Solicitar control**.

En Windows:

1. lee **¿Permitir mouse y teclado?**;
2. pulsa **Permitir por esta sesión**;
3. espera la cuenta regresiva.

En Atacante:

1. espera que termine **Armando en 3…**;
2. pulsa **Activar control**;
3. haz clic dentro del vídeo para enviar teclado.

El estado debe cambiar a:

```text
CONTROL ACTIVO
```

## Paso 37. Ejecutar únicamente el guion seguro

Desde Atacante:

1. mueve el cursor;
2. abre Inicio;
3. abre Bloc de notas;
4. escribe un mensaje educativo;
5. abre Explorador;
6. navega a `C:\HACKEADO-DEMO`;
7. abre o renombra únicamente archivos ficticios;
8. usa Alt+Tab si forma parte del ensayo.

No abras consola, UAC, credenciales, archivos personales o rutas ajenas al laboratorio.

## Paso 38. Revelar y detener

En Atacante pulsa:

```text
Revelación
```

Esto debe revocar entrada y terminar vídeo antes de mostrar la explicación.

En Windows debe aparecer:

```text
No era “solo soporte”.
```

## Paso 39. Recuperar

En Windows:

1. pulsa **Empezar recuperación**;
2. ordena los seis pasos;
3. pulsa **Validar secuencia**;
4. confirma cada paso;
5. al llegar a 100 %, pulsa **RECUPERAR CONTROL**.

Orden correcto:

1. detener acceso remoto;
2. revocar permisos;
3. proteger cuentas;
4. cerrar sesiones;
5. activar MFA;
6. revisar y reportar.

---

# Parte 13 — Paradas locales

Prueba las cuatro paradas antes de la exposición:

## Víctima

- botón rojo visible de Victim Host;
- `Ctrl + Shift + F12`.

## Atacante

- **Liberar control**;
- **PARADA TOTAL**.

## Coordinación

- **PARADA TOTAL → Confirmar parada total**.

Después de cualquier parada deben quedar:

```text
Entrada remota: revoked
Vídeo WebRTC: ended
```

Reconectar vídeo nunca debe reactivar entrada sin una solicitud y consentimiento nuevos.

---

# Parte 14 — Reset y snapshot

## Paso 40. Reiniciar la sesión

En Coordinación:

1. confirma que vídeo e input terminaron;
2. pulsa **↺ Reiniciar**;
3. confirma **Reiniciar y rotar accesos**;
4. verifica que aparece un código nuevo.

## Paso 41. Restaurar Windows

1. Cierra Victim Host.
2. Restaura archivos de `C:\HACKEADO-DEMO` o revierte el snapshot.
3. Inicia `VictimaDemo`.
4. Vuelve a abrir Victim Host.

El snapshot final debe contener:

- .NET 8 instalado;
- WebView2 operativo;
- certificado público confiado;
- `C:\HACKEADO-APP` configurado;
- datos ficticios limpios;
- ningún programa personal abierto.

No incluyas sesiones activas en el snapshot.

---

# Parte 15 — Rutina corta para cada ensayo

Después de completar la instalación inicial, cada ensayo en Windows se reduce a:

1. restaurar snapshot;
2. iniciar sesión como `VictimaDemo`;
3. comprobar red:

   ```powershell
   Test-NetConnection IP-DE-LA-MAC -Port 3000
   ```

4. abrir:

   ```powershell
   cd C:\HACKEADO-APP\HACKEADO-VictimHost
   .\HACKEADO.VictimHost.exe
   ```

5. ingresar código de seis dígitos;
6. solicitar acceso;
7. esperar aprobación;
8. ejecutar decisiones y consentimientos del guion;
9. probar una parada;
10. cerrar y restaurar snapshot.

---

# Parte 16 — Diagnóstico de errores

## `dotnet` no se reconoce

1. Instala `Microsoft.DotNet.SDK.8`.
2. Cierra y vuelve a abrir PowerShell.
3. Ejecuta:

   ```powershell
   Test-Path 'C:\Program Files\dotnet\dotnet.exe'
   ```

4. Si existe, refresca `PATH`:

   ```powershell
   $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
   ```

5. Reinicia Windows si fuera necesario.

## `NETSDK1045` o framework no compatible

No está instalado un SDK capaz de compilar `net8.0`:

```powershell
dotnet --list-sdks
```

Instala .NET 8 SDK y repite.

## PowerShell bloquea el script

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

No cambies la política de todo el equipo.

## `NuGet` o restore falla

La primera compilación necesita Internet:

```powershell
dotnet restore .\apps\windows-agent\Hackeado.VictimHost.sln
```

Revisa fecha/hora, DNS, proxy y conexión de la VM.

## Victim Host dice `FALLO DE CONFIGURACIÓN`

Revisa:

- `agent-config.json` existe junto al `.exe`;
- el JSON no tiene comas finales;
- `serverUrl` usa HTTPS;
- la IP es correcta;
- `agentKey` tiene al menos 16 caracteres y no conserva el texto de ejemplo.

## Ventana vacía o WebView2 falla

Instala Evergreen WebView2 Runtime y reinicia Windows.

## Error de certificado

Revisa:

- se importó `rootCA.pem`, no la clave privada;
- el certificado del servidor fue generado incluyendo la IP actual de la Mac;
- Windows tiene fecha y hora correctas;
- usas exactamente la misma IP incluida en el certificado.

## `TcpTestSucceeded : False`

Revisa:

- servidor Mac encendido;
- ambos equipos en la misma red;
- VM en modo puente o red privada alcanzable;
- firewall de macOS permitió Node;
- puerto configurado `3000`;
- no hay aislamiento de clientes Wi-Fi.

## Coordinación muestra `Agente Windows: offline`

Revisa:

- la Víctima ya fue aprobada;
- Victim Host está abierto;
- `deviceId` coincide con `DEMO_DEVICE_ID`;
- `agentKey` coincide con `DEMO_AGENT_KEY`;
- no abriste la ruta Víctima en un navegador normal;
- Socket.IO/WSS está conectado.

## Atacante ve pantalla, pero no controla

Orden requerido:

```text
Solicitar control
→ Permitir por esta sesión
→ esperar cuenta regresiva
→ Activar control
→ clic dentro del vídeo
```

## `ERROR // action_rejected`

Alguna acción ocurrió fuera de orden. Ruta comprometida correcta:

```text
Solucionar ahora
→ Solicitar pantalla
→ Permitir una vez
→ Elegir pantalla completa
→ Solicitar control
→ Permitir por esta sesión
→ Activar control
→ Revelación
→ Empezar recuperación
```

## No permite reiniciar

Primero termina vídeo e input mediante:

- **Revelación**;
- **Liberar control**; o
- **PARADA TOTAL**.

Espera los estados `ended` y `revoked`.

---

# Checklist final de Windows

- [ ] `dotnet --version` funciona.
- [ ] `dotnet --list-sdks` incluye .NET 8.
- [ ] Pruebas C# aprobadas.
- [ ] Victim Host publicado en Release.
- [ ] WebView2 funciona.
- [ ] Usuario actual es `VictimaDemo`.
- [ ] Usuario no es administrador.
- [ ] Certificado público instalado.
- [ ] `Invoke-WebRequest` responde sin error TLS.
- [ ] `agent-config.json` usa IP, dispositivo y clave correctos.
- [ ] Datos de `C:\HACKEADO-DEMO` son ficticios.
- [ ] Carpetas compartidas y clipboard desactivados.
- [ ] Agente aparece `online`.
- [ ] Vídeo muestra pantalla completa.
- [ ] Control requiere consentimiento separado.
- [ ] Mouse, teclado y Alt+Tab funcionan.
- [ ] Botón local de parada funciona.
- [ ] `Ctrl+Shift+F12` funciona.
- [ ] Parada desde Atacante funciona.
- [ ] Parada desde Coordinación funciona.
- [ ] Reinicio rota el código.
- [ ] Snapshot limpio creado y probado.

## Documentos relacionados

- [Manual general de operación](11-manual-de-operacion.md)
- [Manual de contingencias](12-manual-de-contingencias.md)
- [Checklist imprimible](14-checklist-imprimible.md)
- [Especificación de control remoto nativo](17-especificacion-control-remoto-nativo.md)
- [Preparación del laboratorio Windows](19-laboratorio-vm-control-nativo.md)
- [Cierre de Release Candidate](23-release-candidate-sprint-12.md)

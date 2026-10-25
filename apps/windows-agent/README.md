# HACKEADO Windows Agent

Aplicación Windows visible `HACKEADO Victim Host`, definida en `docs/17-especificacion-control-remoto-nativo.md`.

## Estado

- Sprints 0–2: contratos, registro y leases implementados.
- Sprint 3: host WPF, WebView2, configuración, navegación cerrada y puente JSON implementados.
- Sprint 4: captura completa WebRTC desde React implementada.
- Sprint 5: mouse nativo, rueda, arrastre, rate limit y validación de lease implementados.
- Sprint 6: teclado nativo, atajos autorizados y liberación anti-teclas-atrapadas implementados.
- Sprint 7: consentimiento separado, cuenta regresiva, overlay, botón local, hotkey y watchdog implementados.
- Sprint 8: cabina Atacante video-first, HUD, fullscreen, drawers y parada total implementados.
- Sprints 9–11: narrativa automática, corte seguro, suspensión/bloqueo y logs rotativos implementados.
- Sprint 12: versión `1.0.0-rc.1`, publicación Release self-contained, ZIP y SHA-256 implementados.
- Validación física Mac–Windows pendiente en laboratorio.

## Herramientas previstas

- Windows 11.
- Visual Studio 2022 con desarrollo de escritorio .NET.
- .NET 8 SDK LTS.
- WebView2 Runtime.
- PowerShell 7 recomendado para scripts de preparación.

## Restricciones

- Aplicación visible.
- Usuario estándar durante demostración.
- Sin servicio de Windows.
- Sin inicio automático.
- Sin elevación del agente.
- Sin shell remota.
- Sin transferencia remota de archivos.
- Sin persistencia después de cerrar.

No agregar binarios, claves, certificados ni configuración local al repositorio.

## Configuración local

1. Copiar `config/windows-agent.example.json` como `agent-config.json` junto al ejecutable.
2. Cambiar `serverUrl` por origen HTTPS exacto del servidor en Mac.
3. Usar mismo `deviceId` y `agentKey` configurados en servidor.
4. Mantener `allowDevTools: false` durante exposición.

El certificado configurado en Mac debe ser confiable dentro de Windows. Para exposición, servir build con `npm run start`; Vite HTTP por LAN no constituye contexto seguro para captura.

`agent-config.json` está ignorado por Git. Nunca usar datos personales ni clave incluida en documentación.

## Compilar en Windows

Desde PowerShell, en raíz del repositorio:

```powershell
cd C:\HACKEADO-SOURCE\hackeado
.\scripts\windows\build-victim-host.ps1
```

Salida:

```text
C:\HACKEADO-SOURCE\hackeado\apps\windows-agent\Hackeado.VictimHost\bin\Release\net8.0-windows10.0.19041.0\win-x64\publish\
```

Manifiesto usa `asInvoker`: no solicita administrador. No crea servicio, tarea programada ni inicio automático.

## Empaquetar RC

```powershell
cd C:\HACKEADO-SOURCE\hackeado
.\scripts\windows\package-victim-host.ps1
```

Genera `release/windows-agent/HACKEADO-VictimHost-1.0.0-rc.1-win-x64.zip` y su SHA-256. No incluye `agent-config.json`, secretos ni certificados.

## Pruebas Windows

```powershell
cd C:\HACKEADO-SOURCE\hackeado
dotnet test .\apps\windows-agent\Hackeado.VictimHost.sln -c Release
```

Pruebas cubren configuración, origen, coordenadas con DPI 100/125/150%, lease/secuencia,
validación de teclado, shortcuts y expiración del watchdog.

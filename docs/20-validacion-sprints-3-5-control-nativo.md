# Validación — Sprints 3, 4 y 5

## Estado verificable

| Área                          | Estado en repositorio | Validación física |
| ----------------------------- | --------------------- | ----------------- |
| Host WPF visible              | Implementado          | Pendiente Windows |
| WebView2 y origen cerrado     | Implementado          | Pendiente Windows |
| Puente JSON bidireccional     | Implementado          | Pendiente Windows |
| Captura explícita de pantalla | Implementado          | Pendiente Windows |
| WebRTC 1080p/30               | Implementado          | Pendiente LAN     |
| Telemetría                    | Implementado          | Pendiente LAN     |
| Mouse, clic, arrastre y rueda | Implementado          | Pendiente Windows |
| Lease, secuencia y rate limit | Implementado          | Pruebas incluidas |

No se incluye ejecutable, secreto ni certificado. El ejecutable debe producirse dentro de VM preparada.

## Validación automatizada en Mac

```bash
npm run check
npm run test:remote-desktop
```

## Validación automatizada en Windows

```powershell
./scripts/windows/build-victim-host.ps1
```

El script exige usuario no administrador, restaura dependencias, ejecuta pruebas C# y publica build `win-x64` dependiente de .NET 8.

## Prueba manual obligatoria Mac → Windows

1. Restaurar instantánea limpia y entrar como `VictimaDemo`.
2. Confirmar que usuario no pertenece a Administradores.
3. Configurar mismo `DEMO_DEVICE_ID` y `DEMO_AGENT_KEY` en servidor y `agent-config.json`.
4. Confiar certificado local exclusivamente en VM de laboratorio.
5. Ejecutar `npm run build` y `npm run start` en Mac con TLS configurado.
6. Abrir manualmente `HACKEADO.VictimHost.exe` en Windows.
7. Confirmar `AGENTE WINDOWS CONECTADO`; cerrar aplicación y comprobar que agente pasa offline.
8. Abrir sesión live y conceder pantalla. Verificar que aparece selector de captura y elegir pantalla completa.
9. Confirmar vídeo de aplicaciones externas a HACKEADO en Mac.
10. Confirmar 1080p/30 ideal; repetir con respaldo 720p si red degrada.
11. Solicitar control en Atacante y concederlo explícitamente en Víctima.
12. Activar control; mover cursor, clic izquierdo, clic derecho, doble clic, arrastrar ventana y usar rueda.
13. Probar bordes y centro con escalas Windows 100%, 125% y 150%.
14. Liberar control desde Atacante: movimiento debe detenerse antes de un segundo.
15. Repetir y cerrar Victim Host: entrada y vídeo deben detenerse.
16. Repetir y desconectar red: botones deben liberarse y lease expirar.
17. Confirmar que no existe servicio, inicio automático, proceso elevado, shell ni transferencia.

## Evidencia a adjuntar

- Captura de Host visible.
- Captura del selector de pantalla.
- Captura del escritorio Windows dentro del visor Mac.
- Vídeo corto de movimiento, arrastre, doble clic y rueda.
- Resultado de `dotnet test`.
- Latencia, FPS, resolución, bitrate y pérdida observados.
- Firma de integrante que ejecutó y docente que revisó.

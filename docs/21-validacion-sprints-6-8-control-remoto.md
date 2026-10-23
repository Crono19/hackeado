# Validación — Sprints 6, 7 y 8

## Estado implementado

| Área            | Resultado                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------ |
| Teclado Windows | `keydown`, `keyup`, modificadores, repetición y `releaseAll` mediante `SendInput`          |
| Atajos          | Inicio, Alt+Tab, Escape, Enter, seleccionar, copiar, deshacer, cerrar y mostrar escritorio |
| Bloqueos        | Meta, F12, Ctrl+Alt+Supr/Escape, Ctrl+Shift+Escape y Alt+F4 crudo                          |
| Consentimiento  | Pantalla y control son decisiones separadas; activación espera tres segundos               |
| Parada local    | Overlay WPF, botón independiente de React y `Ctrl+Shift+F12` global                        |
| Fallo seguro    | Blur, cierre, desconexión, revocación y expiración liberan mouse y teclado                 |
| Atacante        | Visor 72vh, HUD de agente/lease, métricas, fullscreen, shortcuts y drawers                 |

## Validación automatizada

En cualquier equipo con Node 24:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

En Windows 11 con .NET 8:

```powershell
dotnet test apps/windows-agent/Hackeado.VictimHost.sln -c Release
./scripts/windows/build-victim-host.ps1
```

## Matriz manual obligatoria en Windows

1. Abrir Bloc de notas y escribir `¡HACKEADO: acción, ñ, 123!` desde la Mac.
2. Probar mayúsculas, símbolos, Shift, Control, Alt y repetición manteniendo una tecla.
3. Abrir dos aplicaciones y usar el botón `Alt + Tab`.
4. Probar Inicio, Escape, Enter, cerrar ventana y mostrar escritorio.
5. Confirmar que F12, Meta, Ctrl+Alt+Supr, Ctrl+Shift+Escape y Alt+F4 crudo no cruzan.
6. Mantener Shift, quitar red y comprobar que Windows no conserva la tecla presionada.
7. Compartir pantalla y verificar que todavía no existe entrada remota.
8. Rechazar control y comprobar que el video continúa pero mouse/teclado no responden.
9. Permitir control, observar la cuenta de tres segundos y activar después de terminar.
10. Confirmar overlay superior con operador, tiempo y botón rojo.
11. Detener desde el botón WPF; repetir con `Ctrl+Shift+F12`.
12. Cerrar Victim Host y verificar revocación inmediata.
13. Dejar expirar heartbeat/lease y verificar parada automática.
14. Probar Atacante en 1440×900, 1920×1080 y resolución del proyector.
15. Probar mouse y teclado dentro de fullscreen; salir y verificar liberación de foco.
16. Abrir/cerrar drawers sin cubrir ni desconectar el visor.

## Evidencia recomendada

- Video corto del texto español, Alt+Tab y control del Bloc de notas.
- Captura del consentimiento separado y su cuenta regresiva.
- Captura del overlay WPF mientras el panel Atacante muestra `CONTROL ACTIVO`.
- Video del botón local y del hotkey deteniendo entrada.
- Capturas del visor a las tres resoluciones.
- Salida de pruebas Node y .NET.

La validación física no puede sustituirse con pruebas ejecutadas en macOS: `SendInput`, WebView2,
el hotkey global y el overlay deben verificarse dentro de la VM Windows preparada.

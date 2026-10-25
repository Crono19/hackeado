# Validación — Sprints 9, 10 y 11

## Resultado implementado

La experiencia ya no depende de que Coordinación cambie escenas. Víctima y Atacante hacen avanzar el relato con decisiones y acciones reales. Coordinación queda reducida a crear/aprobar la sesión, iniciar o pausar el tiempo, ver presencia y ejecutar finalización, reset, respaldo o parada total.

## Flujo automático

| Disparador                                 | Resultado automático                   |
| ------------------------------------------ | -------------------------------------- |
| Coordinación inicia                        | Preparación → espera; reloj activo     |
| Víctima elige perfil ficticio              | Espera → perfil → engaño               |
| Víctima abre soporte                       | Engaño → decisión                      |
| Verifica o rechaza                         | Resultado seguro                       |
| Continúa con supuesto soporte              | Decisión → permisos                    |
| Simulado: permite pantalla y control       | Permisos → conexión                    |
| Real: empieza captura WebRTC               | Permisos → conexión                    |
| Simulado: confirma canal/pantalla/control  | Conexión → bajo control                |
| Real: consentimiento nativo + lease activo | Conexión → bajo control                |
| Atacante libera o revela                   | Control revocado → revelación          |
| Víctima pulsa recuperar                    | Revelación → contención → recuperación |
| Completa protocolo                         | Recuperación → resultado               |

El evento manual `phase:request` queda rechazado con `manual_phase_control_disabled`.

## Experiencia visual

- Víctima usa entrada compacta, identidad ficticia, señales inspeccionables y permisos descritos por impacto.
- Durante control aparece una alarma de pantalla completa roja con parada inmediata.
- Revelación compara lo visto y lo permitido sin jerga innecesaria.
- Atacante conserva el escritorio Windows como protagonista, con HUD, lease, calidad y parada.
- Coordinación usa `CoordinatorLite`: una única consola compacta sin director, checklist ni botones de escena.
- El respaldo local informa explícitamente que ya no existe control real.

## Matriz de fallos

| Fallo inyectado                      | Respuesta esperada                         | Estado seguro verificable                    | Continuidad                            |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------- | -------------------------------------- |
| Wi-Fi desconectado                   | Socket y peer cierran                      | `releaseAll`, lease revocado, vídeo cerrado  | Activar respaldo local                 |
| Atacante cerrado                     | Servidor revoca lease de propietario       | Input `revoked`, media `ended`               | Víctima continúa a recuperación        |
| Víctima cerrada                      | Agente offline y sesión remota terminada   | Mouse/teclado liberados; reloj pausado       | Coordinación usa respaldo              |
| Victim Host cerrado                  | cierre WPF ejecuta `Stop`                  | Overlay cierra y `InputSafetyPolicy.Clear()` | Reiniciar agente; consentimiento nuevo |
| WebView2 falla                       | `ProcessFailed`/navegación fallida detiene | Entrada liberada fuera de React              | Respaldo local                         |
| Windows se bloquea, suspende o apaga | monitor de sistema detiene                 | Entrada liberada antes de cambio de sesión   | Reiniciar ronda                        |
| Servidor reiniciado                  | estado en memoria desaparece               | tokens y leases anteriores dejan de existir  | crear sesión nueva o respaldo          |
| Track de vídeo termina               | `track.onended` cierra peer                | no queda DataChannel operativo               | reintentar solo vídeo                  |
| Lease vence                          | watchdog + servidor revocan                | input `revoked`; teclas/botones liberados    | solicitar consentimiento nuevo         |
| Mensaje duplicado                    | `eventId` o secuencia se rechaza           | acción no se repite                          | seguir sesión                          |
| Paquete viejo/futuro                 | ventana temporal ±5 s rechaza              | no cruza al `SendInput`                      | siguiente paquete válido               |
| Ráfaga de eventos                    | límite independiente por evento            | exceso recibe `event_rate`                   | esperar y continuar                    |
| Latencia o pérdida                   | HUD degrada calidad                        | entrada depende de lease, no del vídeo       | bajar calidad/reintentar vídeo         |
| Fallo no recuperable                 | Coordinación activa contingencia           | control y WebRTC terminados                  | vídeo `.webm` local                    |

## Comprobación automatizada

En macOS/Linux con Node 24:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

En Windows 11 con .NET 8:

```powershell
cd C:\HACKEADO-SOURCE\hackeado
dotnet test .\apps\windows-agent\Hackeado.VictimHost.sln -c Release
.\scripts\windows\build-victim-host.ps1
```

Las pruebas C# cubren lease, secuencia, antigüedad, ráfagas, watchdog, navegación, teclado, coordenadas y rotación/sanitización de logs.

## Prueba física de caos obligatoria

Ejecutar dentro de la VM preparada, nunca con datos personales:

1. Mantener una tecla y un botón del mouse, desconectar Wi-Fi y comprobar liberación inmediata.
2. Repetir cerrando Atacante, Víctima y Victim Host por separado.
3. Bloquear Windows y suspender/reanudar la VM durante control.
4. Detener el servidor, reiniciarlo y confirmar que la sesión anterior no vuelve.
5. Finalizar el track desde el selector del navegador y comprobar que control no reaparece.
6. Dejar vencer lease sin heartbeat.
7. Aplicar latencia y pérdida desde el hipervisor o una red de laboratorio.
8. Activar respaldo y completar revelación/recuperación sin red.

Registrar para cada caso: hora, responsable, resultado esperado, resultado observado, captura o vídeo y corrección necesaria.

## Límites que no deben cambiar

- Sin servicio, autoarranque, persistencia, evasión o acceso desatendido.
- Sin UAC, Secure Desktop, pantalla de bloqueo ni credenciales.
- Sin shell remota ni transferencia arbitraria de archivos.
- Usuario Windows estándar y datos exclusivamente ficticios.
- Toda reactivación requiere consentimiento nuevo y visible.

La validación física Mac–Windows queda pendiente hasta ejecutar esta matriz en el laboratorio; el código no puede certificar hardware externo desde macOS.

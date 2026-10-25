# Manual de contingencias — HACKEADO EXPO RC

## Regla

Fallo técnico nunca amplía permisos. Primero revocar entrada. Después recuperar vídeo o activar respaldo.

## Matriz

| Incidente                   | Acción inmediata                              | Continuación                           |
| --------------------------- | --------------------------------------------- | -------------------------------------- |
| Windows pierde red          | Botón WPF o hotkey; confirmar overlay cerrado | Activar respaldo local                 |
| Mac pierde red              | Víctima detiene localmente                    | Vídeo + tarjetas                       |
| Socket.IO cae               | Entrada se revoca; no insistir con mouse      | Reintentar enlace solo para estado     |
| WebRTC pierde vídeo         | Liberar control; mostrar `SIN SEÑAL`          | Reintentar solo pantalla               |
| Atacante se cierra          | Servidor revoca lease                         | Víctima inicia recuperación            |
| Victim Host se cierra       | Watchdog/cleanup libera entrada               | Reiniciar agente; consentimiento nuevo |
| Windows se bloquea/suspende | Monitor nativo detiene                        | Reiniciar ronda                        |
| Servidor reinicia           | Sesiones y leases anteriores desaparecen      | Crear código nuevo                     |
| Proyector falla             | Mantener explicación oral                     | Abrir vídeo en segunda pantalla        |
| Datos reales aparecen       | Parada total y retirar proyección             | Informar docente; no fotografiar       |
| Latencia alta               | Liberar entrada antes de ajustar red          | Modo simulado                          |
| Tiempo menor a 2 min        | Revelar, recuperar y preguntar                | Omitir efectos, nunca prevención       |

## Activar respaldo

1. Coordinación pulsa **Activar respaldo**.
2. Sistema termina WebRTC y revoca input.
3. Atacante/Público reproducen `public/fallback/hackeado-respaldo.webm`.
4. Grupo continúa revelación, consecuencias y recuperación.
5. Nadie presenta vídeo como control vivo.

## Recuperar modo live

1. Confirmar `remote: ended` e `input: revoked`.
2. Cerrar Victim Host.
3. Restaurar snapshot si hubo cambios inesperados.
4. Ejecutar desde la raíz real del clon:

   ```powershell
   cd C:\HACKEADO-SOURCE\hackeado
   .\scripts\windows\verify-demo-vm.ps1
   ```

5. Comprobar HTTPS/WSS con `verify:live-network`.
6. Crear sesión nueva.
7. Repetir consentimiento desde cero.

## Plan sin red

- Abrir `public/fallback/respaldo.html` o vídeo WebM.
- Usar tarjetas físicas.
- Representar mensaje y decisiones.
- Ordenar: detener → revocar → proteger cuentas → cerrar sesiones → MFA → revisar/reportar.

Nunca improvisar otra herramienta remota.

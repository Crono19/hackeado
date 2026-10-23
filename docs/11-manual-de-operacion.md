# Manual de operación — HACKEADO EXPO RC

## Alcance

Operación repetible de Mac atacante + VM Windows víctima. Control nativo solo dentro de cuenta estándar ficticia, con aplicación visible, consentimiento doble y parada local.

## Arranque de exposición

1. Restaurar snapshot limpio de Windows.
2. Confirmar usuario `VictimaDemo`, sin privilegios ni datos personales.
3. Conectar Mac, host de VM y proyector al router privado.
4. En Mac, copiar `.env.expo.example` a `.env` y completar IP, certificado, `deviceId` y secreto.
5. Verificar que Windows confíe en certificado TLS.
6. Ejecutar:

```bash
npm run verify:release
npm run build
npm run start:expo
```

7. En otra terminal:

```bash
HACKEADO_URL=https://IP-DEL-MAC:3000 npm run verify:live-network
```

8. En Windows, ejecutar `verify-demo-vm.ps1`.
9. Abrir manualmente `HACKEADO.VictimHost.exe`.
10. Abrir en Mac `/coordinacion`, `/atacante` y `/publico`.

## Inicio de ronda

1. Coordinación crea sesión `live`.
2. Víctima, Atacante y Público ingresan con código.
3. Coordinación aprueba tres solicitudes.
4. Confirmar cuatro nodos conectados y agente Windows `online`.
5. Pulsar **Iniciar sesión**. Desde aquí flujo avanza automáticamente.
6. Víctima elige perfil y decide.
7. Atacante solicita pantalla.
8. Víctima permite pantalla y elige explícitamente monitor completo.
9. Atacante espera vídeo `LIVE`; solicita control.
10. Víctima concede mouse/teclado. Esperar cuenta regresiva.
11. Atacante activa control y ejecuta solo guion aprobado.

## Guion técnico de impacto

- Mover cursor.
- Abrir Inicio mediante botón permitido.
- Abrir Bloc de notas por interfaz.
- Escribir mensaje educativo.
- Abrir Explorador.
- Navegar a `C:\HACKEADO-DEMO`.
- Abrir y renombrar archivo ficticio.
- Cambiar ventana con botón `Alt+Tab`.
- Pulsar **Revelación**.

No usar shell, UAC, credenciales, aplicaciones personales ni rutas fuera del material ficticio.

## Cierre y recuperación

1. Revelación revoca entrada antes de cambiar escena.
2. Víctima pulsa **Detener y recuperar**.
3. Público ordena seis pasos.
4. Víctima completa recuperación.
5. Coordinación pulsa **Finalizar ronda** si hace falta.
6. Confirmar `input: revoked`, `media: ended`.
7. Reiniciar; código y tokens deben rotar.
8. Restaurar archivos o snapshot antes de siguiente grupo.

Meta de reset operativo: menos de dos minutos incluyendo restauración necesaria.

## Paradas

- Víctima: botón rojo WPF.
- Víctima: `Ctrl+Shift+F12`.
- Atacante: **Liberar control** o **PARADA TOTAL**.
- Coordinación: **PARADA TOTAL**.

Después de cualquier parada, reconectar vídeo no reactiva entrada. Se requiere solicitud y consentimiento nuevos.

## Comandos

| Comando                                     | Uso                                          |
| ------------------------------------------- | -------------------------------------------- |
| `npm run start:expo`                        | Arranque estricto HTTPS + agente obligatorio |
| `npm run verify:release`                    | Suite, build, diez rondas, E2E y activos     |
| `npm run verify:live-network`               | Valida HTTPS, WSS y latencia en LAN final    |
| `npm run package:offline`                   | Paquete Mac con dependencias de producción   |
| `./scripts/windows/package-victim-host.ps1` | Prueba, publica y empaqueta agente Windows   |
| `npm run record:backup`                     | Regenera vídeo local                         |

## Cierre diario

1. Parada total.
2. Confirmar overlay cerrado y Mac sin entrada.
3. Cerrar Victim Host.
4. Detener servidor.
5. Retirar `.env`, certificados privados y configuración local del transporte.
6. Restaurar snapshot.
7. Registrar incidentes y resultados físicos.

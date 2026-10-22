# Manual de operación — HACKEADO RC

## Alcance

Este manual permite montar, ejecutar, restablecer y cerrar la estación sin conocimiento del código. La aplicación coordina la experiencia; no implementa control remoto ni captura información personal.

## Equipo

- Mac: servidor, coordinación y atacante.
- Windows: víctima, cuenta local ficticia sin privilegios administrativos.
- Proyector: panel público a 1920 × 1080 recomendado.
- Router autorizado: red local; Internet no es necesario en modo simulado.
- Cargadores y audio.

## Preparación inicial

1. Conectar todos los equipos a energía.
2. Cerrar correo, mensajería, nube, gestores de contraseña y cuentas personales.
3. Confirmar cuenta ficticia en Windows.
4. Conectar Mac, Windows y proyector a la misma red autorizada.
5. Copiar `.env.example` como `.env`.
6. En `CLIENT_ORIGIN`, incluir el origen exacto usado por el navegador durante desarrollo. En producción, usar la app servida desde el puerto 3000.
7. Ejecutar `sh scripts/verify-demo.sh` antes de abrir la estación.
8. Ejecutar `sh scripts/start-demo.sh`.
9. Abrir en Mac:
   - `http://localhost:3000/coordinacion`
   - `http://localhost:3000/atacante`
   - `http://localhost:3000/publico` en proyector.
10. Abrir en Windows: `http://IP-DEL-MAC:3000/victima`.

## Inicio de ronda

1. Coordinación elige `simulated`, `rehearsal` o `live`.
2. Crear sesión. Anotar solo el código temporal visible; nunca el token.
3. Víctima, atacante y público solicitan acceso.
4. Coordinación verifica cada rol y aprueba.
5. Confirmar los cuatro nodos conectados.
6. Probar tono; marcar audio listo.
7. En modo real, completar los siete checks antes de armar la herramienta externa.
8. Iniciar historia y reloj.

## Ritmo de 15 minutos

| Tiempo      | Escena       | Meta                                                     |
| ----------- | ------------ | -------------------------------------------------------- |
| 00:00–02:00 | Entrada      | Elegir identidad ficticia; explicar que decide visitante |
| 02:00–05:00 | Engaño       | Mensaje, urgencia, decisión                              |
| 05:00–08:00 | Permisos     | Pantalla, control y permisos narrativos                  |
| 08:00–10:30 | Otro lado    | Acción real limitada o simulación segura                 |
| 10:30–12:30 | Revelación   | Dos perspectivas, cronología, consecuencias              |
| 12:30–14:20 | Recuperación | Ordenar y completar seis pasos                           |
| 14:20–15:00 | Cierre       | Pregunta final y prevención                              |

Si quedan menos de dos minutos, usar **Cierre rápido**. Nunca omitir cómo detener y reportar.

## Transmisión WebRTC real

Solo tras aprobación docente y prueba física. La captura requiere `localhost` o HTTPS; consultar `16-webrtc-transmision-y-control-web.md`.

1. Víctima concede pantalla y control narrativo de forma visible.
2. Coordinación completa los siete checks y pulsa **Armar canal WebRTC**.
3. Víctima pulsa **Compartir esta pestaña** y elige únicamente HACKEADO.
4. Atacante confirma video y telemetría; coordinación marca `screen` y `control`.
5. Mantener visible **Detener transmisión** en Windows.
6. El mouse y teclado funcionan solamente dentro del escritorio web ficticio.
7. Víctima detiene; coordinación confirma `ending` y `ended`.
8. La siguiente ronda requiere código nuevo y una autorización nueva.

## Entre rondas

1. Confirmar estado remoto `ended`.
2. Cerrar ventanas y restaurar escritorio ficticio.
3. Pulsar **Reiniciar ronda**.
4. Confirmar código nuevo y tokens anteriores revocados.
5. Volver a aprobar los tres roles.
6. Objetivo: menos de 30 segundos.

## Cierre diario

1. Ejecutar parada de emergencia si queda cualquier sesión activa.
2. Cerrar herramienta remota y deshabilitar cualquier opción de inicio automático.
3. Detener servidor con `Ctrl+C`.
4. Eliminar `.env` si contiene direcciones específicas del montaje.
5. Borrar copias temporales, códigos fotografiados y grabaciones de ensayo.
6. Restaurar suspensión, red y notificaciones de ambos equipos.

## Comandos

| Comando                     | Uso                                   |
| --------------------------- | ------------------------------------- |
| `sh scripts/start-demo.sh`  | Inicia versión de producción          |
| `sh scripts/verify-demo.sh` | Preflight completo, diez rondas y E2E |
| `npm run dev`               | Desarrollo solamente                  |
| `npm run check`             | Tipos, lint, unitarias y build        |
| `npm run test:e2e`          | Flujos de navegador                   |
| `npm run package:offline`   | Genera paquete autocontenido para Mac |
| `npm run record:backup`     | Regenera video WebM de respaldo       |

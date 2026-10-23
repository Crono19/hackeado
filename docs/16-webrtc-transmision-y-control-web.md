# WebRTC — transmisión consentida y control web (documento histórico)

> Sustituido para modo live por `17-especificacion-control-remoto-nativo.md`. Solo conserva contexto de la primera versión y no debe usarse como manual de exposición.

## Alcance implementado

HACKEADO transmite en tiempo real la pestaña elegida por la víctima hacia el panel Atacante. La captura usa `getDisplayMedia`, WebRTC punto a punto y señalización autenticada mediante la sesión existente.

La víctima siempre debe pulsar **Compartir esta pestaña** y confirmar el selector nativo del navegador. Mientras transmite, conserva visibles **Detener transmisión** y el indicador nativo de Chrome o Edge.

El control remoto integrado está deliberadamente limitado al escritorio web de HACKEADO:

- cursor remoto visible;
- clic sobre controles de la demostración;
- navegación con `Tab`, `Shift+Tab`, `Enter`, espacio y `Escape`;
- habilitación solo tras conceder pantalla y teclado, confirmar estado `control` y entrar en la escena `controlled`;
- botón de detención protegido contra clic remoto;
- sin inyección de eventos en Windows, procesos nativos, archivos reales u otras aplicaciones.

## Calidad objetivo

- Captura ideal: 1920 × 1080.
- Máximo: 30 FPS.
- Bitrate máximo solicitado: 8 Mbit/s.
- `contentHint = detail` para favorecer texto y escritorio.
- Panel atacante con resolución, FPS, bitrate y paquetes perdidos.
- Indicador `CALIDAD ÓPTIMA` cuando se reciben al menos 900 líneas y 24 FPS.
- WebRTC puede adaptar resolución o FPS si la red no sostiene el objetivo; la interfaz lo muestra como `CALIDAD ADAPTADA`.

La aplicación no puede garantizar matemáticamente 1080p/30 FPS: depende de Wi-Fi, carga del equipo, navegador y resolución compartida. Para mayor estabilidad se recomienda Ethernet o router local dedicado, cerrar descargas y compartir únicamente la pestaña HACKEADO.

## Requisito de contexto seguro

Los navegadores solo permiten `getDisplayMedia` en un contexto seguro. Para una demostración local sin certificados, la topología recomendada es:

1. Ejecutar HACKEADO en Windows.
2. Abrir Víctima en `http://localhost:3000/victima`.
3. Abrir Atacante, Público y Coordinación desde el Mac usando `http://IP-DE-WINDOWS:3000/...`.

De esta forma la captura se origina en `localhost`, que el navegador considera seguro. La alternativa es servir la aplicación por HTTPS con un certificado confiable para ambos equipos.

Si Víctima se abre mediante una IP usando HTTP, el botón mostrará: `Captura bloqueada: abre Víctima desde localhost o HTTPS`.

## Flujo de operación

1. Crear una sesión en modo `live`.
2. Aprobar Víctima y Atacante.
3. Conceder los permisos narrativos Pantalla y Control.
4. Coordinación pasa a `Conexión` y marca el checklist.
5. Coordinación pulsa **Armar canal WebRTC**.
6. Víctima pulsa **Compartir esta pestaña** y, en el selector del navegador, elige la pestaña HACKEADO.
7. Atacante espera `EN VIVO` y comprueba resolución/FPS.
8. Coordinación pulsa **Confirmar pantalla recibida** y **Confirmar control web concedido**.
9. Coordinación pasa a `Bajo control`.
10. Atacante hace clic dentro del video o enfoca el video y usa las teclas permitidas.
11. Víctima pulsa **Detener transmisión** para cortar inmediatamente.

## Seguridad de señalización

- Solo el rol Víctima puede publicar ofertas.
- Solo el rol Atacante puede responder.
- ICE se reenvía únicamente entre esos dos roles autenticados.
- SDP e ICE tienen límites de tamaño validados con Zod.
- No se almacena video ni se graba la pantalla.
- El servidor solo reenvía señalización; el medio viaja punto a punto.
- No se configuran servidores TURN externos: el diseño está orientado a la misma red local.

## Limitación explícita

El video es real. El control de la aplicación también es real, pero su frontera es el contenido web de HACKEADO. No controla el escritorio completo de Windows. Implementar eso requeriría un agente nativo con privilegios de entrada y ampliaría el proyecto hacia una herramienta de administración remota, fuera de los límites educativos definidos.

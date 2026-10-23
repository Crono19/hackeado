# HACKEADO — Checklist imprimible EXPO RC

## Montaje

- [ ] Snapshot limpio restaurado.
- [ ] `VictimaDemo` es usuario estándar.
- [ ] Datos personales, nube, portapapeles y carpetas compartidas ausentes.
- [ ] Router privado, energía, HDMI y cable de red de respaldo listos.
- [ ] Certificado HTTPS confiable en Windows.
- [ ] Paquetes Mac/Windows coinciden con SHA-256 registrado.
- [ ] Vídeo WebM abre sin red.

## Preflight

- [ ] `npm run verify:release` termina en `PREFLIGHT PASS`.
- [ ] `verify-demo-vm.ps1` termina aprobado.
- [ ] `verify:live-network` confirma HTTPS + WSS.
- [ ] Victim Host muestra `BRIDGE://READY`.
- [ ] DevTools desactivado.
- [ ] `REQUIRE_NATIVE_AGENT=true`.
- [ ] Botón WPF y `Ctrl+Shift+F12` probados.
- [ ] Parada desde Atacante y Coordinación probada.

## Cada ronda

- [ ] Código nuevo.
- [ ] Cuatro roles conectados.
- [ ] Agente `online`; vídeo e input todavía apagados.
- [ ] Temporizador 15:00.
- [ ] Visitante informado: identidad y datos ficticios.
- [ ] Pantalla y control se piden por separado.
- [ ] Overlay rojo permanece visible durante control.
- [ ] Operador usa solo acciones del guion.
- [ ] Revelación revoca input.
- [ ] Recuperación incluye prevención y reporte.

## Entre rondas

- [ ] `input: revoked`.
- [ ] `media: ended`.
- [ ] Mouse/teclado locales responden.
- [ ] Archivos ficticios restaurados o snapshot aplicado.
- [ ] Reset rota código y tokens.
- [ ] Bienvenida lista en menos de dos minutos.

## Plan B

- [ ] Responsable sabe activar respaldo.
- [ ] Tarjetas físicas ordenadas.
- [ ] Nadie llama “control real” al vídeo.
- [ ] Pregunta final conservada.

## Cierre

- [ ] Parada total.
- [ ] Victim Host cerrado.
- [ ] Servidor detenido.
- [ ] `.env`, secretos y certificados privados retirados.
- [ ] Snapshot restaurado.
- [ ] Incidentes y diez rondas firmados.

Coordinación: ____________________ Seguridad: ____________________

Fecha: __________ Hora: __________ RC/SHA-256: ____________________

# Evidencia — Fases 18 y 19

## Fase 18: seguridad y privacidad

### Controles implementados

- React escapa texto; QR ahora usa `data:` en `<img>`, sin `dangerouslySetInnerHTML`.
- Rutas separadas por rol; servidor valida autorización en cada evento.
- Zod valida todo payload HTTP y Socket.IO.
- Códigos y claves de ingreso tienen límite de intentos.
- HTTP limita 300 solicitudes/minuto y 120 mutaciones/minuto por origen de red.
- Socket limita 30 eventos/10 segundos por conexión.
- Tokens aleatorios se almacenan como SHA-256 y tienen expiración propia.
- Reset revoca tokens, solicitudes y eventos procesados.
- CORS/origen acepta mismo origen o lista explícita; no usa comodín por defecto.
- CSP restringe scripts, imágenes, conexiones, formularios, objetos y framing.
- `Permissions-Policy` bloquea cámara, micrófono, ubicación y USB.
- API usa `no-store`; servidor oculta tecnología y sanitiza errores.
- JSON limitado a 32 KB; Socket.IO limitado a 32 KB.
- No existen endpoints de comandos, shell, uploads, cámara, micrófono ni archivos reales.
- Logs muestran estado técnico, no token, código, payload o contenido del visitante.
- Marca `DEMO CONTROLADA` permanece en cabecera global.

### Operación segura

Firewall: autorizar Node solo en red privada del evento. No abrir puerto en router ni usar port forwarding. Definir orígenes exactos. Usar cuenta Windows local ficticia. Después del evento: cerrar servidor, borrar `.env`, deshabilitar acceso remoto y restaurar red/suspensión.

## Fase 19: release y pruebas

### Automatización

- `npm run check`: TypeScript, ESLint, Vitest y build.
- `npm run test:e2e`: Chromium desktop/móvil.
- `npm run verify:realtime`: cuatro roles, reconexión, decisiones, simulación, recuperación, emergencia y reset medido.
- `npm run verify:ten-rounds`: diez ejecuciones consecutivas.
- `sh scripts/verify-demo.sh`: preflight completo.
- `npm run package:offline`: build + runtime, dependencias, documentación y recursos en `.tar.gz`.

### Cobertura de navegador

- Final seguro por verificación.
- Final moderado al compartir pantalla y rechazar control.
- Final comprometido y seis pasos de recuperación.
- Parada de emergencia.
- Vista 1920 × 1080.
- Vista móvil.
- Un solo `h1`, controles con nombre, imágenes con `alt`, foco por teclado y sin desbordamiento horizontal.

### Resultado automatizado del 21 de octubre de 2026

- Vitest: **95/95** pruebas aprobadas.
- Playwright: **7/7** pruebas aprobadas en Chromium desktop/móvil.
- Estrés: **10/10** rondas consecutivas, 40.3 segundos en total.
- Reset: cada ronda quedó por debajo del límite de 30 segundos.
- Paquete offline: 12 MB comprimidos; extraído y arrancado solo con dependencias de producción.
- Auditoría npm: 0 vulnerabilidades reportadas al instalar runtime y herramientas.

### Entregables

- Candidato de producción en `dist/`.
- Paquete offline en `release/` después de ejecutar empaquetador.
- Manual de operación: `docs/11-manual-de-operacion.md`.
- Manual de contingencias: `docs/12-manual-de-contingencias.md`.
- Guion por integrante: `docs/13-guion-por-integrante.md`.
- Checklist imprimible: `docs/14-checklist-imprimible.md`.
- Video local: `public/fallback/hackeado-respaldo.webm`.

## Validaciones externas pendientes

Software puede automatizar y probar flujo lógico. Estas verificaciones exigen hardware/personas y no deben declararse aprobadas sin evidencia:

- Mac → Windows con herramienta remota elegida.
- Proyector y audio físicos del aula.
- Duración humana entre 12 y 15 minutos.
- Firma/aprobación final del docente.

Registrar fecha, equipo, resultado y firma en checklist antes de habilitar modo `live`.

# HACKEADO — Alguien está dentro · 1.0.0-rc.1

Aplicación educativa multisistema para una estación interactiva sobre acceso remoto, spyware y permisos peligrosos. El Mac ejecuta el servidor y los paneles de coordinación/atacante; Windows funciona como equipo víctima; un proyector muestra la vista pública.

> Sprints 0–12 completos en software: host WPF/WebView2 visible, WebRTC, mouse/teclado Windows, consentimiento doble, lease, parada local, automatización, contingencia, empaquetado y preflight. Compilación y prueba física Mac–Windows siguen pendientes dentro de la VM.

## Estado

Fases 0–19 implementadas en software. Incluye:

- React + TypeScript + Vite.
- Node.js + Express.
- Socket.IO para comunicación en tiempo real.
- Cuatro rutas iniciales: víctima, atacante, público y coordinación.
- Consola interactiva de dominio en `/debug`.
- Máquina de estados con tres finales, parada de emergencia y reinicio total.
- Contratos compartidos para sesión, participantes, permisos, riesgo y cronología.
- Sesiones temporales, códigos de seis dígitos, QR y aprobación por rol.
- Tokens efímeros, expiración, límites de intentos y revocación total.
- Rooms Socket.IO, ACK, deduplicación, presencia, latido y reconexión.
- Sistema visual reusable con temas claro, advertencia y oscuro.
- Coordinación compacta sin dirección manual de escenas: sesión, tiempo, presencia y failsafe.
- Reloj autoritativo de 15 minutos, pausa estable, hitos privados y cierre rápido.
- Bienvenida sin datos personales y tres identidades ficticias predefinidas.
- Escritorio Nova con aplicaciones, archivos y notificaciones totalmente ficticios.
- Conversación de soporte ficticia, contador narrativo y señales inspeccionables.
- Tres decisiones con rutas segura, moderada y comprometida.
- Permisos progresivos, dependencias y riesgo narrativo recalculado.
- Centro atacante contextual con acciones autorizadas y etiquetas real/simulado.
- Vista pública con misterio protegido y revelación sincronizada para proyector.
- Flujo visual víctima/atacante, mapa de permisos y comparación de perspectivas.
- Motor de nueve efectos simulados con cola, tiempos, confirmación y cancelación segura.
- Escritorio ficticio animado con cursor, ventanas, escritura, sensores y alertas simuladas.
- Cronología por actor/naturaleza, riesgo ampliado y puntuación educativa determinista.
- Resumen final con momento clave, retroalimentación y prevención.
- Reto LOCKDOWN con seis pasos ordenables, validación y progreso colectivo.
- Bloqueo de resultado hasta confirmar el fin del acceso remoto.
- Checklist operativo para control consentido Mac → Windows y doble confirmación.
- Video WebRTC punto a punto con objetivo 1080p/30 FPS y telemetría de calidad.
- Canal de datos WebRTC para cursor, clic y teclado nativos en la VM Windows autorizada.
- Modos simulado, ensayo ×4 y real; cierre rápido y reanudación visible.
- Respaldo audiovisual offline y manual de respuesta a fallos.
- CSP, política de orígenes, rate limiting y permisos sensibles bloqueados.
- Tokens con vencimiento propio, API sin caché y errores sanitizados.
- Suite E2E Chromium para tres finales, emergencia, responsive y teclado.
- Preflight de diez rondas, paquete offline, video y manuales operativos.
- Validación con Zod.
- Vitest para pruebas unitarias e integración.
- ESLint y Prettier.
- Documentación funcional en `docs/`.
- Contrato versionado para mouse, teclado, shortcuts, heartbeat y liberación nativa.
- Estado remoto separado por agente, media, input y calidad.
- Registro temporal de una VM autorizada con secreto comparado en tiempo constante.
- Lease de control exclusivo, temporal, renovable y revocable.
- Revocación por desconexión o heartbeat vencido.
- Scripts PowerShell seguros para preparar y verificar la VM.
- Host WPF visible con WebView2, origen cerrado, descargas/popups bloqueados y puente JSON validado.
- Captura explícita de pantalla completa, 1080p/30 ideal, límite 8 Mbit/s y telemetría WebRTC.
- Visor atacante dominante con letterboxing correcto y estados de agente, señal, calidad y control.
- Mouse nativo Windows: movimiento, clic izquierdo/derecho/central, doble clic, arrastre y rueda.
- Entrada protegida por consentimiento, lease, secuencia, antigüedad y rate limit.
- Orquestación automática guiada por acciones de Víctima y Atacante.
- Watchdog, corte por bloqueo/suspensión/cierre, logs mínimos rotativos y respaldo local.

## Requisitos

- Node.js 24 LTS.
- npm 11 o compatible.
- macOS, Windows o Linux para desarrollo.

Este proyecto no utiliza Python, por lo que no necesita `.venv`. El equivalente para fijar el entorno de Node es `.nvmrc`; la configuración local se guarda en `.env`, tomando `.env.example` como plantilla.

## Inicio rápido

```bash
npm install
cp .env.example .env
npm run dev
```

Servicios de desarrollo:

- Interfaz: `http://localhost:5174`
- API y Socket.IO: `http://localhost:3000`

Para abrir la interfaz desde Windows en la misma red, se utilizará la IP local del Mac:

```text
http://IP-DEL-MAC:5174/victima
```

## Rutas iniciales

| Ruta            | Uso                                                    |
| --------------- | ------------------------------------------------------ |
| `/`             | Inicio y estado de la base                             |
| `/victima`      | Panel de víctima en Windows                            |
| `/atacante`     | Panel del operador en Mac                              |
| `/publico`      | Vista para el proyector                                |
| `/coordinacion` | Control general de la experiencia                      |
| `/debug`        | Consola de la máquina de estados (desarrollo y ensayo) |

## Scripts

| Comando                          | Función                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `npm run dev`                    | Inicia servidor y cliente en modo desarrollo             |
| `npm run dev:client`             | Inicia solamente Vite                                    |
| `npm run dev:server`             | Inicia solamente Express/Socket.IO                       |
| `npm run build`                  | Compila cliente y servidor                               |
| `npm run start`                  | Sirve el cliente compilado, API y Socket.IO desde Node   |
| `npm run start:expo`             | Arranque live estricto con TLS y agente obligatorio      |
| `npm run typecheck`              | Comprueba tipos de frontend y backend                    |
| `npm run test`                   | Ejecuta pruebas unitarias                                |
| `npm run test:native-foundation` | Valida contratos, agente, leases e integración Socket.IO |
| `npm run test:remote-desktop`    | Valida puente, vídeo, coordenadas y flujo nativo         |
| `npm run test:e2e`               | Ejecuta flujos reales en Chromium                        |
| `npm run verify:realtime`        | Verifica sincronización contra servidor activo           |
| `npm run verify:live-network`    | Comprueba HTTPS/WSS y latencia en red final              |
| `npm run verify:assets`          | Audita versión, respaldo y configuración RC              |
| `npm run lint`                   | Ejecuta ESLint                                           |
| `npm run format`                 | Formatea el repositorio con Prettier                     |
| `npm run check`                  | Ejecuta tipos, lint, pruebas y build                     |
| `npm run verify:release`         | Ejecuta preflight, diez rondas y E2E                     |
| `npm run package:offline`        | Crea paquete autocontenido para el Mac                   |

## Arquitectura inicial

```text
Navegadores React
víctima | atacante | público | coordinación
                 │
                 │ HTTP + Socket.IO
                 ▼
Servidor Node.js + Express
sesiones | roles | estado temporal | simulación | resumen
                 │
                 │ señalización WebRTC + lease
                 ▼
Victim Host WPF visible en Windows
WebView2 | captura | mouse/teclado | parada local
```

El servidor será la fuente de verdad. El dominio y la máquina de estados ya están definidos en `src/shared`; la persistencia temporal y sincronización completa se conectarán en las siguientes fases.

## Árbol del proyecto

```text
hackeado/
├── docs/                  Especificación, fases y presentación
├── public/                Recursos estáticos ficticios
├── scenarios/             Escenarios narrativos en JSON
├── scripts/               Utilidades de operación
├── src/
│   ├── client/            Aplicación React y vistas
│   ├── server/            API y Socket.IO
│   └── shared/            Tipos y contratos compartidos
├── tests/                 Pruebas unitarias e integración
├── .env.example
├── .nvmrc
├── package.json
└── vite.config.ts
```

## Configuración

Variables disponibles en `.env.example`:

- `HOST`: interfaz de red del servidor.
- `PORT`: puerto del backend.
- `CLIENT_ORIGIN`: origen permitido durante desarrollo.
- `SESSION_TTL_MINUTES`: vida futura de las sesiones.
- `VITE_SERVER_URL`: URL opcional del servidor para el cliente.

No deben almacenarse credenciales ni secretos reales.

## Documentación

- [Especificación maestra](docs/01-especificacion-maestra-hackeado.md)
- [Plan de desarrollo](docs/02-plan-de-desarrollo-por-fases.md)
- [Manual de presentación](docs/03-manual-presentacion-hackeado.md)
- [Validación ética y operativa de Fase 0](docs/04-fase-0-validacion-y-operacion.md)
- [Dominio y máquina de estados de Fase 2](docs/05-fase-2-dominio-y-maquina-de-estados.md)
- [Sesiones, tiempo real y sistema visual](docs/06-fases-3-5-sesiones-realtime-y-diseno.md)
- [Coordinación, reloj y víctima](docs/07-fases-6-8-coordinacion-tiempo-victima.md)
- [Engaño, permisos y atacante](docs/08-fases-9-11-engano-permisos-atacante.md)
- [Público, simulación y resultados](docs/09-fases-12-14-publico-simulacion-resultados.md)
- [Recuperación, control remoto y resiliencia](docs/10-fases-15-17-recuperacion-operacion-resiliencia.md)
- [Manual de operación](docs/11-manual-de-operacion.md)
- [Manual de contingencias](docs/12-manual-de-contingencias.md)
- [Guion por integrante](docs/13-guion-por-integrante.md)
- [Checklist imprimible](docs/14-checklist-imprimible.md)
- [Seguridad y release](docs/15-fases-18-19-seguridad-y-release.md)
- [Transmisión WebRTC y control web](docs/16-webrtc-transmision-y-control-web.md)
- [Especificación de control remoto nativo](docs/17-especificacion-control-remoto-nativo.md)
- [Sprints de control remoto nativo](docs/18-sprints-control-remoto-nativo.md)
- [Validación de Sprints 3–5](docs/20-validacion-sprints-3-5-control-nativo.md)
- [Preparación del laboratorio Windows](docs/19-laboratorio-vm-control-nativo.md)
- [Validación de Sprints 6–8](docs/21-validacion-sprints-6-8-control-remoto.md)
- [Validación de Sprints 9–11 y matriz de fallos](docs/22-validacion-sprints-9-11-y-matriz-de-fallos.md)
- [Release Candidate y cierre de Sprint 12](docs/23-release-candidate-sprint-12.md)
- [Manual completo de Windows](docs/24-manual-windows-instalacion-y-ejecucion.md)
- [Manual completo de Mac](docs/25-manual-mac-instalacion-y-operacion.md)

## Estado de aceptación de Fases 0–19

| Fase | Estado                                     | Evidencia                                                                          |
| ---- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| 0    | Implementada; aprobación docente pendiente | Matriz, wireframes, límites, topología, inventario y acta preparados               |
| 1    | Completa                                   | Arranque, cuatro rutas, API de salud, build, herramientas y servidor de producción |
| 2    | Completa                                   | Tipos, máquina de estados, `/debug` y pruebas automatizadas                        |
| 3    | Completa                                   | Sesiones, código/QR, aprobación, tokens, expiración y reset                        |
| 4    | Completa                                   | Rooms, eventos validados, ACK, dedup, presencia y reconexión                       |
| 5    | Completa                                   | Componentes, tres temas, responsive y accesibilidad                                |
| 6    | Completa                                   | Centro de mando, estado técnico, escenas, reset y parada segura                    |
| 7    | Completa                                   | Reloj de servidor, pausa, hitos, alertas y cierre rápido                           |
| 8    | Completa                                   | Identidad ficticia, escenario entregado y escritorio Nova                          |
| 9    | Completa                                   | Mensajería, señales, decisiones, puntuación inicial y final seguro                 |
| 10   | Completa                                   | Permisos, dependencias, riesgo, rechazo parcial y sincronización                   |
| 11   | Completa                                   | Centro atacante, catálogo contextual, confirmaciones y cronología                  |
| 12   | Completa                                   | Misterio protegido, revelación, flujo, comparación y estado público filtrado       |
| 13   | Completa                                   | Cola simulada, nueve efectos, tiempos, confirmación y cancelación segura           |
| 14   | Completa                                   | Cronología tipada, riesgo, puntuación y resumen educativo final                    |
| 15   | Completa                                   | Reto ordenable, seis pasos, bloqueo remoto y puntuación final                      |
| 16   | Completa en software                       | Checklist, estados y doble confirmación; prueba física pendiente                   |
| 17   | Completa                                   | Simulación, ensayo, cierre rápido, reconexión y respaldo offline                   |
| 18   | Completa                                   | CSP, orígenes, límites, tokens, privacidad y pruebas de abuso                      |
| 19   | Completa en software                       | RC, E2E, preflight, paquete, video y manuales; aprobación externa pendiente        |

La firma docente y la comprobación del equipo físico son validaciones externas: deben realizarse antes de una demostración híbrida. Hasta entonces solo se autoriza el modo simulado.

## Límites de seguridad

- Información exclusivamente ficticia.
- Sin keylogging, spyware, exploits o persistencia.
- Sin captura real de cámara, micrófono o contraseñas.
- Sin transferencia real de archivos.
- Transmisión WebRTC visible, temporal y revocable.
- Control nativo limitado a mouse, teclado y shortcuts permitidos de la sesión gráfica estándar dentro de la VM autorizada.
- Sin UAC, pantalla de bloqueo, shell remota, transferencia arbitraria ni acceso desatendido.
- Modo simulado como respaldo operativo.

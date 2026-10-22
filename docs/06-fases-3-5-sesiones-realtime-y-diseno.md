# Fases 3–5 — Sesiones, tiempo real y sistema visual

## Estado

Implementación completa al 20 de octubre de 2026. Fuente de verdad: memoria del proceso Node. No existe base de datos ni almacenamiento de información personal.

## Fase 3 — Sesiones temporales

### Flujo

1. Coordinador crea sesión desde `/coordinacion`.
2. Servidor genera UUID, código aleatorio de seis dígitos y token coordinador de 256 bits.
3. Participante introduce código o escanea QR.
4. Solicitud permanece `waiting` hasta decisión del coordinador.
5. Al aprobar, servidor crea participante y token limitado al rol.
6. Cliente consume el token una sola vez y abre Socket.IO.
7. Actividad válida renueva vida de la sesión en memoria.
8. Reinicio rota código, elimina solicitudes y revoca todos los tokens anteriores.

### Estados de unión

```text
waiting ── aprobación ──> approved
   ├────── rechazo ─────> rejected
   └────── tiempo ──────> expired
```

### Endpoints

| Método | Ruta                                                  | Autorización       | Función                             |
| ------ | ----------------------------------------------------- | ------------------ | ----------------------------------- |
| `POST` | `/api/sessions`                                       | Local              | Crear sesión y coordinador          |
| `POST` | `/api/sessions/join`                                  | Código             | Solicitar rol                       |
| `GET`  | `/api/join-requests/:id?key=…`                        | Clave de solicitud | Consultar decisión y consumir token |
| `GET`  | `/api/sessions/:id/join-requests`                     | Coordinador        | Ver cola                            |
| `POST` | `/api/sessions/:id/join-requests/:requestId/decision` | Coordinador        | Aprobar o rechazar                  |
| `GET`  | `/api/sessions/:id/state`                             | Token de rol       | Recuperar estado                    |
| `POST` | `/api/sessions/:id/reset`                             | Coordinador        | Reinicio total y token nuevo        |
| `GET`  | `/api/scenarios`                                      | Local              | Listar escenarios ficticios         |

### Controles

- Tokens aleatorios guardados únicamente como SHA-256 en servidor.
- Código único activo; máximo seis intentos por cliente/código/minuto.
- Solicitud de unión expira en cinco minutos.
- Sesión expira tras inactividad según `SESSION_TTL_MINUTES`.
- Token público puede leer, nunca cambiar fase, permiso o control remoto.
- Tokens y códigos nunca se escriben en logs.
- QR contiene solo URL local y código temporal.
- `localStorage` guarda credencial temporal por rol; se elimina al expirar o salir localmente.

## Fase 4 — Comunicación en tiempo real

### Conexión

```text
cliente ── handshake {sessionId, token} ──> Socket.IO
        <── session:state completo ──────── servidor
        ── latido cada 8 s ───────────────>
        <── presencia + estado autorizado ─ room session:{id}
```

Cada socket entra únicamente a la room de su sesión. Middleware valida token antes de aceptar conexión. Reconexión usa credencial temporal existente y recibe estado completo; no reconstruye estado desde eventos locales.

### Eventos implementados

| Evento                      | Roles mutadores       | Protección                               |
| --------------------------- | --------------------- | ---------------------------------------- |
| `system:heartbeat`          | Todos                 | Validación de sesión                     |
| `phase:request`             | Coordinador           | Zod + máquina de estados + deduplicación |
| `permission:answered`       | Víctima, coordinador  | Zod + lista cerrada                      |
| `remote:status`             | Atacante, coordinador | Confirmación narrativa; no controla SO   |
| `experience:emergency-stop` | Coordinador           | Máquina de estados                       |
| `fallback:activate`         | Coordinador           | Activa modo simulado                     |
| `session:reset`             | Coordinador           | Revoca tokens y desconecta room          |

### Fiabilidad

- Todo evento crítico porta `eventId`.
- Últimos 300 identificadores se conservan por sesión; duplicados reciben ACK sin repetir mutación.
- Máximo 30 eventos por socket cada diez segundos.
- ACK uniforme: `{ ok, data?, error?, duplicate? }`.
- Cierre de pestaña cambia presencia a `disconnected`.
- Pérdida de víctima pausa temporizador activo.
- Reconexión cambia presencia a `connected` y restaura estado canónico.
- Limpieza automática cada 30 segundos notifica `session:expired`.

## Fase 5 — Sistema visual

### Dirección

**Cyber-forensics industrial**, no “Matrix” decorativo. Carbón técnico, verde ácido para control seguro, cian para información y rojo reservado para peligro. Firma visual: barra de señal diagonal animada y paneles recortados con coordenadas operativas.

### Tokens

| Token                           | Uso                           |
| ------------------------------- | ----------------------------- |
| `--void`, `--carbon`, `--panel` | Fondos oscuros                |
| `--paper`, `--muted`            | Texto y jerarquía             |
| `--acid`                        | Acción primaria/estado seguro |
| `--cyan`                        | Información y simulación      |
| `--danger`                      | Compromiso/emergencia         |
| `--amber`                       | Advertencia y espera          |
| `--mono`, `--display`           | Datos y titulares             |
| `--ease`                        | Movimiento corto consistente  |

### Temas

- `theme-light`: inicio cotidiano de víctima.
- `theme-warning`: solicitudes de permiso y conexión.
- `theme-dark`: atacante, público, coordinación, compromiso y emergencia.

Víctima cambia automáticamente de tema según fase. Etiquetas escritas acompañan siempre al color.

### Componentes

| Componente        | Responsabilidad                                      |
| ----------------- | ---------------------------------------------------- |
| `Button`          | Primario, fantasma y peligro; objetivo táctil ≥44 px |
| `Panel`           | Contenedor técnico reusable                          |
| `Modal`           | Diálogo accesible con cierre explícito               |
| `StatusBadge`     | Estado textual + forma + color                       |
| `Countdown`       | Tiempo legible a distancia                           |
| `ConnectionBadge` | Conectado, reconectando, desconectado                |
| `PermissionCard`  | Naturaleza real/simulada y decisión                  |
| `RiskMeter`       | Índice narrativo y cinco dimensiones                 |
| `Timeline`        | Últimas seis señales del incidente                   |
| `SessionLobby`    | Código, QR, espera, rechazo, expiración y aprobación |

### Accesibilidad y respuesta

- Foco visible con doble señal.
- Contraste alto; rojo/verde nunca son única diferencia.
- Región de estado para conexión, solicitud y errores.
- Inputs etiquetados y código con teclado numérico.
- Movimiento CSS desactivado por `prefers-reduced-motion`.
- Grids colapsan a una columna bajo 1000 px.
- Objetivos táctiles mínimos de 44 px.
- Vista pública usa escala tipográfica mayor y máximo seis eventos.
- Sin flashes rápidos ni animación JS pesada.

## Verificación

```bash
npm run check

# Con servidor de producción activo en 3107:
HACKEADO_URL=http://127.0.0.1:3107 npm run verify:realtime
```

`verify:realtime` crea sesión real en memoria, aprueba víctima y público, abre tres sockets, sincroniza fase, prueba deduplicación, bloquea mutación del público y reconecta víctima restaurando estado.

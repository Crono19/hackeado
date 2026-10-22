# HACKEADO — Evidencia técnica de Fases 6, 7 y 8

> Estado: implementadas y verificadas el 21 de octubre de 2026.  
> Alcance: coordinación, reloj autoritativo y primer entorno de víctima.  
> Seguridad: experiencia educativa; contenido ficticio; sin acceso a archivos, cámara, micrófono o credenciales del visitante.

## 1. Resultado

Las tres fases forman una ronda operable sin herramientas de desarrollo:

1. Coordinación crea la sesión, muestra código y QR, y aprueba cada rol.
2. El coordinador inicia la historia y el cronómetro de quince minutos.
3. La víctima elige una identidad predefinida; no puede escribir información personal.
4. El servidor registra el inicio y entrega el escenario ficticio.
5. La víctima entra a un escritorio cotidiano con archivos, aplicaciones y notificaciones inventadas.
6. Todos los clientes reciben el mismo reloj y estado de fase por Socket.IO.
7. Coordinación puede pausar, continuar, adelantar escenas, activar cierre rápido, reiniciar o detener todo.

## 2. Panel de coordinación — Fase 6

### Controles disponibles

- Creación de sesión temporal.
- Código numérico y QR de ingreso.
- Cola de solicitudes con aprobación o rechazo.
- Botón de inicio de historia y botones únicamente para transiciones permitidas.
- Inicio, pausa y continuación del cronómetro.
- Confirmación de prueba de audio.
- Cierre rápido con confirmación.
- Reinicio con confirmación y rotación de código/tokens.
- Parada de emergencia con confirmación.

### Estado técnico visible

- Servidor y revisión sincronizada.
- Conexión de la víctima.
- Prueba de audio.
- Estado informativo del control remoto.
- Participantes, rol, conexión y antigüedad del último pulso.
- Modo normal o contingencia.

### Autorización

Los eventos de fase, reloj, cierre rápido, estado técnico, emergencia y reinicio vuelven a validar en el servidor que el token pertenece al coordinador. Ocultar un botón no constituye la protección.

### Parada segura

Al confirmar la parada:

- la fase global pasa a `emergency`;
- el reloj queda pausado;
- el control remoto queda `ended`;
- permisos solicitados o concedidos pasan a `denied`;
- se registra un evento educativo;
- todos los paneles reciben una pantalla inequívoca de “acceso finalizado”.

## 3. Dirección de tiempo — Fase 7

### Fuente de verdad

El servidor conserva `startedAt`, `lastTickAt`, segundos restantes, estado, hitos alcanzados y modo de cierre rápido. Un pulso de servidor calcula el tiempo usando marcas temporales; los navegadores solo representan el valor recibido.

### Estados

| Estado     | Conducta                                            |
| ---------- | --------------------------------------------------- |
| `idle`     | 15:00, aún no iniciado                              |
| `running`  | El servidor descuenta segundos y difunde estado     |
| `paused`   | Valor congelado; reanudar fija una nueva referencia |
| `finished` | 00:00; no continúa descontando                      |

### Hitos privados

| Minuto | Indicación de coordinación       |
| ------ | -------------------------------- |
| 03:00  | El engaño debe estar planteado   |
| 06:00  | Decisión y permisos en pantalla  |
| 10:00  | Mostrar qué ocurre detrás        |
| 14:00  | Cerrar con prevención y reacción |
| 15:00  | Fin obligatorio de la ronda      |

Cada hito se guarda una sola vez, emite un evento de advertencia y cambia la guía privada del coordinador. El panel de víctima presenta el mismo tiempo en la barra inferior; atacante y público lo reciben en su contador operativo.

### Cierre rápido

Reduce el máximo restante a dos minutos, marca la sesión como cierre rápido y sincroniza la fase de revelación. Permite terminar pedagógicamente aunque el grupo llegue atrasado.

## 4. Panel de víctima — Fase 8

### Entrada sin fricción

- Durante preparación muestra una sala de espera clara.
- Al iniciar, explica que todo es ficticio.
- Ofrece tres identidades cerradas: Alex Rivera, Sam Vega y Noa Castillo.
- No existe campo libre para nombre, correo, teléfono u otros datos.
- Un único botón lleva al escritorio.

### Escritorio Nova

Entorno visual claro y cotidiano, deliberadamente distinto del centro de mando oscuro:

- buscador decorativo;
- saludo personalizado con el alias;
- aplicaciones ficticias de tareas, mensajes y portal académico;
- carpeta de imágenes de demostración;
- archivos ficticios de presupuesto, inscripción, reporte y accesos señuelo;
- tres notificaciones, incluida la futura entrada narrativa de soporte;
- ventanas locales al seleccionar un elemento;
- marca persistente “ENTORNO EDUCATIVO · DATOS 100% FICTICIOS”.

Los elementos no leen el disco, no permiten carga y no abren servicios reales. Sus textos viven en el escenario controlado del proyecto.

### Entrega del escenario

`GET /api/scenarios/:scenarioId` entrega los perfiles, escritorio y notificaciones. El inicio por `profile:selected` solo acepta uno de los tres identificadores validados con Zod. La cronología guarda “Participante inició con identidad ficticia”, no el alias ni información del visitante.

## 5. Archivos principales

```text
src/
├── client/views/coordinator/CoordinatorPanel.tsx
├── client/views/victim/VictimExperience.tsx
├── server/http/sessions.ts
├── server/sessions/store.ts
├── server/sockets/gateway.ts
└── shared/
    ├── scenario.ts
    ├── schemas.ts
    ├── session.ts
    ├── timer.ts
    └── types.ts
```

## 6. Verificación ejecutada

- `npm run check`: tipos, ESLint, pruebas y builds de producción.
- 56 pruebas automatizadas aprobadas.
- `npm run verify:realtime` contra servidor real local.
- Flujo verificado con coordinador, víctima y público conectados.
- Verificados: transición, deduplicación, restricción de rol, reconexión, selección ficticia, reloj, pausa y emergencia segura.

## 7. Matriz de aceptación

| Criterio                                                 | Estado |
| -------------------------------------------------------- | ------ |
| Coordinación opera sin DevTools                          | Cumple |
| Crear, aprobar, iniciar, pausar, continuar y reiniciar   | Cumple |
| Emergencia deja todos los paneles en estado seguro       | Cumple |
| Reloj autoritativo compartido                            | Cumple |
| Pausa sin pérdida o salto de tiempo                      | Cumple |
| Hitos 3, 6, 10, 14 y 15                                  | Cumple |
| Cierre rápido sincronizado                               | Cumple |
| Bienvenida y elección comprensible                       | Cumple |
| Escritorio con apps, archivos y notificaciones ficticias | Cumple |
| Sin información personal ni marcas/cuentas reales        | Cumple |

## 8. Comprobaciones físicas pendientes

Antes de presentar, el equipo debe comprobar resolución del proyector, zoom del navegador, audio del salón, acceso Mac→Windows y visibilidad a distancia. Son validaciones externas; no impiden el uso completo del modo simulado.

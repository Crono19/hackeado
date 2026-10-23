# HACKEADO — Especificación de control remoto nativo para Windows

> **Estación:** Grupo 3 — “Alguien está dentro”  
> **Modalidad:** Mac atacante → VM Windows víctima  
> **Naturaleza:** Demostración académica, visible, consentida y limitada al laboratorio  
> **Estado:** Sprints 0–12 completos en software; validación física Windows y aprobación interna pendientes  
> **Plan de ejecución:** [`18-sprints-control-remoto-nativo.md`](18-sprints-control-remoto-nativo.md)

---

## 1. Propósito

Este documento define la nueva versión de HACKEADO en la que una aplicación nativa abierta voluntariamente dentro de una VM Windows permite compartir el escritorio y, después de una autorización explícita, recibir control real de mouse y teclado desde el panel Atacante ejecutado en una Mac.

La demostración dejará de limitar el control al contenido web. El operador podrá interactuar con la sesión gráfica real del usuario estándar dentro de la VM: mover el cursor, escribir, abrir aplicaciones y manipular archivos ficticios mediante la interfaz visible de Windows.

La solución no debe transformarse en una herramienta oculta, persistente o de acceso desatendido. La víctima siempre abre la aplicación, observa los permisos solicitados, decide si los concede y conserva un mecanismo local para detener inmediatamente el acceso.

---

## 2. Relación con la documentación existente

Esta especificación amplía y modifica el alcance descrito en:

- `01-especificacion-maestra-hackeado.md`.
- `02-plan-de-desarrollo-por-fases.md`.
- `16-webrtc-transmision-y-control-web.md`.

Cuando exista una contradicción relacionada con el control remoto, prevalece este documento.

Cambios principales:

1. La herramienta remota deja de ser un producto externo.
2. HACKEADO incorpora una aplicación nativa propia para Windows.
3. WebRTC continúa transportando vídeo y eventos de control.
4. El control deja de limitarse a elementos HTML.
5. El panel Atacante pasa a ser el centro operativo y visual.
6. la vista Víctima pasa a ser el centro narrativo y de consentimiento.
7. Coordinación deja de dirigir manualmente cada escena.
8. La máquina de estados avanza principalmente mediante acciones reales de Víctima y Atacante.

---

## 3. Resultado esperado

Al completar esta versión:

- La víctima ejecutará `HACKEADO Victim Host` dentro de Windows.
- La aplicación presentará la historia y las solicitudes de permisos.
- La víctima concederá primero visualización de pantalla y posteriormente control.
- La Mac recibirá el escritorio completo mediante WebRTC.
- El operador controlará el cursor y teclado de la sesión de Windows.
- La víctima verá permanentemente que existe control remoto.
- Víctima, atacante o coordinación podrán finalizar el acceso.
- Toda sesión quedará limitada a la VM, al usuario estándar y al tiempo autorizado.
- La VM podrá restaurarse desde una instantánea limpia entre grupos.

### 3.1 Significado de “control completo”

En este proyecto significa control real y amplio de la **sesión gráfica del usuario estándar de la VM**. No significa dominio administrativo irrestricto del sistema operativo.

El operador podrá:

- Ver el escritorio completo.
- Mover el cursor.
- Hacer clic izquierdo, derecho y doble clic.
- Mantener y soltar botones para arrastrar.
- Usar la rueda vertical y horizontal.
- Escribir texto.
- Utilizar teclas modificadoras y atajos autorizados.
- Abrir Inicio, Explorador y aplicaciones normales.
- Cambiar, minimizar, maximizar, mover y cerrar ventanas.
- Abrir, crear, editar, mover, renombrar y eliminar archivos ficticios.
- Navegar por configuraciones disponibles para el usuario estándar.

No podrá:

- Superar UAC o el escritorio seguro.
- Controlar procesos con mayor nivel de integridad.
- Acceder a la Mac anfitriona o escapar de la VM.
- Mantener acceso después de cerrar la sesión.
- Instalar persistencia o ejecutarse de forma oculta.
- Abrir una shell remota o ejecutar comandos invisibles.
- Extraer archivos hacia la Mac.
- Capturar credenciales mediante keylogging.
- Desactivar antivirus, firewall o controles de seguridad.

---

## 4. Principios obligatorios

### P-01 — Inicio local

La conexión solo podrá comenzar después de que una persona abra la aplicación en Windows.

### P-02 — Consentimiento por capacidad

Ver pantalla y controlar entrada serán permisos separados. Compartir pantalla no concederá automáticamente mouse o teclado.

### P-03 — Indicador permanente

Mientras exista control, Windows mostrará un indicador nativo siempre visible con operador, duración y botón de detención.

### P-04 — Sin acceso desatendido

Cerrar la aplicación, reiniciar Windows, expirar la sesión o perder la conexión revocará el control.

### P-05 — Menor privilegio

El agente se ejecutará como usuario estándar y no solicitará elevación administrativa.

### P-06 — Entrada, no comandos

Las aplicaciones y archivos se operarán mediante mouse y teclado. No existirá una API remota para ejecutar procesos, comandos o rutas arbitrarias.

### P-07 — Información ficticia

La VM solo contendrá cuentas, archivos, imágenes y mensajes preparados para la actividad.

### P-08 — Fallo seguro

Ante desconexión, error, timeout o heartbeat vencido, la entrada remota se deshabilitará antes de intentar reconectar.

### P-09 — Un único operador

Solo un panel Atacante podrá poseer el control en cada momento.

### P-10 — Espectáculo con claridad

Víctima y Atacante concentrarán la narrativa. Coordinación será una consola pequeña de administración y emergencia.

---

## 5. Topología soportada

### 5.1 Recomendación para la exposición

```text
Mac del atacante                  Equipo anfitrión de la VM
┌───────────────────────┐         ┌──────────────────────────┐
│ Servidor HACKEADO     │         │ Hipervisor               │
│ Panel Atacante        │◀───────▶│ └── VM Windows 11        │
│ Coordinación          │  LAN    │     └── Victim Host.exe  │
└───────────────────────┘         └──────────────────────────┘
```

Esta distribución demuestra que el control cruza una red real y reparte la carga entre dos equipos.

### 5.2 Alternativa con una sola Mac

La Mac podrá ejecutar el servidor, el panel Atacante y la VM Windows. Se recomienda una red virtual host-only o bridged que permita comunicación directa entre host y VM.

### 5.3 Condiciones de red

- Red local privada o autorizada.
- Sin publicación de puertos en Internet.
- HTTPS/WSS para el modo live.
- Señalización mediante el servidor HACKEADO.
- WebRTC punto a punto cuando la topología lo permita.
- Sin TURN público.
- Un router local dedicado como respaldo para la exposición.

---

## 6. Arquitectura lógica

```text
┌──────────────────────────── MAC ────────────────────────────┐
│                                                            │
│  React — Panel Atacante                                    │
│  ├── Escritorio remoto                                     │
│  ├── Captura de eventos de entrada                         │
│  ├── HUD de sesión                                         │
│  └── Revelación y detención                                │
│              │                                             │
│              │ WebRTC                                      │
│              ▼                                             │
│  Node/Express/Socket.IO                                    │
│  ├── Sesiones                                              │
│  ├── Señalización                                          │
│  ├── Registro del agente                                   │
│  ├── Leases de control                                     │
│  └── Máquina de estados                                    │
└───────────────────────────┬────────────────────────────────┘
                            │ LAN
┌───────────────────────────▼ WINDOWS VM ─────────────────────┐
│                                                            │
│  HACKEADO Victim Host — WPF + WebView2                     │
│  ├── Experiencia React de víctima                          │
│  ├── Captura del escritorio                                │
│  ├── RTCDataChannel                                        │
│  ├── Puente JavaScript ↔ C#                                │
│  ├── Política de entrada                                   │
│  ├── Entrada nativa de Windows                             │
│  └── Indicador y parada de emergencia                      │
└────────────────────────────────────────────────────────────┘
```

### 6.1 Flujo de un evento de entrada

```text
Mouse/teclado en Mac
        ↓
AttackerRemoteDesktop.tsx
        ↓
RemoteControlMessage validado
        ↓
RTCDataChannel
        ↓
VictimRemoteTransport.ts
        ↓
window.chrome.webview.postMessage(JSON)
        ↓
NativeMessageRouter.cs
        ↓
InputSafetyPolicy.cs
        ↓
PointerController / KeyboardController
        ↓
Sesión gráfica de Windows
```

---

## 7. Tecnologías

### 7.1 Aplicación web y servidor

- React.
- TypeScript.
- Vite.
- Node.js.
- Express.
- Socket.IO.
- Zod.
- WebRTC.
- Vitest.
- Playwright.

### 7.2 Aplicación Windows

- C#.
- .NET 8 LTS o la versión LTS aprobada al iniciar el sprint.
- WPF.
- Microsoft WebView2.
- APIs Win32 para mouse, teclado y atajo de emergencia.
- xUnit para pruebas del agente.

### 7.3 Motivo de WPF + WebView2

- Permite reutilizar la experiencia React actual.
- Proporciona una ventana nativa para consentimiento y emergencia.
- Permite comunicación JSON entre web y C#.
- Evita duplicar toda la interfaz de víctima en XAML.
- Mantiene la lógica sensible de entrada fuera del navegador.

---

## 8. Flujo completo de la experiencia

### 8.1 Preparación técnica

1. Restaurar la instantánea limpia de Windows.
2. Iniciar sesión como `VictimaDemo`, usuario estándar.
3. Verificar que no existan carpetas compartidas ni sesiones personales.
4. Iniciar el servidor HACKEADO en la Mac.
5. Abrir Atacante, Público y Coordinación.
6. Abrir manualmente `HACKEADO Victim Host.exe` en Windows.
7. La aplicación verifica servidor, identidad de la VM y puente nativo.
8. Coordinación crea una sesión temporal.

### 8.2 Entrada de la víctima

1. La víctima observa la bienvenida dentro de la aplicación Windows.
2. Introduce el código o selecciona la sesión preparada.
3. Coordinación aprueba el ingreso.
4. La víctima elige una identidad ficticia.
5. La máquina de estados inicia automáticamente el engaño.

### 8.3 Engaño

1. Aparece una solicitud falsa de soporte.
2. Se presentan urgencia, autoridad y apariencia de legitimidad.
3. La víctima puede verificar, rechazar o continuar.
4. Una decisión segura conduce a revelación segura.
5. Continuar conduce a solicitudes de permisos.

### 8.4 Permiso de visualización

La aplicación mostrará:

> SOPORTE NOVA solicita ver el contenido de tu pantalla.

Explicará que el operador podría ver:

- Aplicaciones abiertas.
- Notificaciones.
- Archivos visibles.
- Información mostrada durante la sesión.

La víctima elegirá `Permitir pantalla` o `Rechazar`.

La selección nativa de captura deberá permanecer visible. La aplicación no seleccionará el monitor silenciosamente.

### 8.5 Permiso de control

Después de confirmar vídeo, se mostrará una segunda solicitud:

> SOPORTE NOVA solicita controlar este dispositivo.

La pantalla explicará que podrá:

- Mover el cursor.
- Hacer clic.
- Escribir.
- Abrir aplicaciones.
- Interactuar con archivos visibles.

La víctima elegirá `Permitir durante esta sesión` o `Rechazar`.

### 8.6 Activación

1. El servidor emite un lease temporal.
2. El agente valida sesión, dispositivo, consentimiento y lease.
3. Aparece una cuenta regresiva de tres segundos.
4. La banda nativa cambia a rojo.
5. El atacante recibe `CONTROL ACTIVO`.
6. La máquina de estados entra automáticamente en `controlled`.

### 8.7 Control real

El operador podrá realizar el guion acordado:

1. Mover inesperadamente el cursor.
2. Abrir Inicio.
3. Abrir Bloc de notas.
4. Escribir un mensaje educativo.
5. Abrir el Explorador.
6. Entrar en `C:\HACKEADO-DEMO`.
7. Abrir un archivo ficticio.
8. Renombrar o mover otro archivo.
9. Cambiar entre aplicaciones.
10. Mostrar que la sesión actúa con la identidad de la víctima.

### 8.8 Revelación

1. El atacante pulsa `REVELAR`.
2. El sistema deshabilita entrada antes de cambiar la escena.
3. El público ve la relación entre permiso y consecuencia.
4. La víctima recupera control local.
5. Se explica qué fue real, qué fue preparado y qué habría ocurrido con datos personales.

### 8.9 Contención y cierre

1. La víctima pulsa `Detener y reportar`.
2. El agente revoca el lease.
3. Se detiene captura y control.
4. La víctima completa el reto de recuperación.
5. El resultado se genera automáticamente.
6. Coordinación finaliza o reinicia la sesión.
7. Se restaura la VM antes del siguiente grupo.

---

## 9. Diseño de roles

### 9.1 Víctima — protagonista narrativa

La experiencia de víctima debe sentirse como una computadora cotidiana, no como una consola técnica.

Estados visuales:

- Bienvenida.
- Perfil ficticio.
- Mensaje de soporte.
- Decisión.
- Permiso de pantalla.
- Permiso de control.
- Cuenta regresiva.
- Control activo.
- Acceso detenido.
- Recuperación.
- Resultado.

Durante el control se mostrará una banda nativa siempre visible:

```text
CONTROL REMOTO ACTIVO · Operador: SOPORTE NOVA · 01:24
Ctrl + Shift + F12 para detener                [DETENER ACCESO]
```

El botón y el atajo no dependerán de React ni del canal WebRTC.

### 9.2 Atacante — protagonista operativa

El escritorio remoto ocupará entre 70% y 80% del viewport.

Elementos permanentes:

- Vídeo del escritorio.
- Estado `SIN SEÑAL / VISTA / CONTROL ACTIVO`.
- Resolución, FPS, latencia y pérdida.
- Estado del agente.
- Estado del lease.
- Temporizador.
- Botón `Liberar control`.
- Botón `Revelar`.
- Botón de emergencia.

Controles del visor:

- Movimiento y botones del mouse.
- Doble clic.
- Arrastre.
- Rueda.
- Captura de teclado al enfocar.
- Liberación local del teclado con un atajo visible.
- Pantalla completa.
- Botones para Inicio, `Alt+Tab`, Escape, Enter y cerrar ventana.

Elementos secundarios colapsables:

- Permisos.
- Cronología.
- Consecuencias.
- Riesgo narrativo.
- Acciones simuladas de respaldo.

### 9.3 Coordinación — administración mínima

Coordinación conservará solamente:

- Crear sesión.
- Mostrar y copiar código.
- Aprobar participantes.
- Iniciar ronda y temporizador.
- Pausar o reanudar tiempo.
- Ver conectividad resumida.
- Finalizar sesión.
- Reiniciar para otro grupo.
- Parada de emergencia.

Se eliminarán de su interfaz:

- Director manual de escenas.
- Botones `Bajo control` y `Revelación`.
- Rail completo de fases.
- Checklist remoto interactivo.
- Confirmaciones manuales de pantalla y control.
- Matriz técnica extensa.
- Prueba de audio.
- Hitos de dirección.
- Cronología detallada.

### 9.4 Público

La vista pública continuará mostrando misterio, revelación, consecuencias y recuperación. No controlará la sesión ni mostrará datos técnicos sensibles.

---

## 10. Máquina de estados automática

```text
preparation
    ↓ crear/iniciar
waiting
    ↓ víctima conectada
profile
    ↓ perfil seleccionado
bait
    ↓ decisión
decision
    ├── verificar/rechazar → reveal
    └── continuar → permissions
                         ↓ pantalla aceptada
                    connecting
                         ↓ vídeo + consentimiento + lease
                     controlled
                         ↓ atacante revela o acceso se detiene
                       reveal
                         ↓
                    containment
                         ↓
                     recovery
                         ↓
                       result
                         ↓ coordinador reinicia
                        reset
```

Coordinación solo podrá forzar `emergency`, finalizar o reiniciar. No será necesaria para avanzar una sesión normal.

---

## 11. Estado remoto

El estado remoto dejará de ser una única cadena y se dividirá:

```ts
interface RemoteControlState {
  agent: {
    status: 'offline' | 'online' | 'fault';
    deviceId?: string;
    version?: string;
    lastSeenAt?: number;
    capabilities: AgentCapabilities;
  };
  media: {
    status: 'idle' | 'requesting' | 'negotiating' | 'live' | 'degraded' | 'ended';
    startedAt?: number;
    endedAt?: number;
  };
  input: {
    status: 'disabled' | 'requested' | 'granted' | 'active' | 'revoked';
    leaseId?: string;
    grantedAt?: number;
    expiresAt?: number;
  };
  quality: {
    width: number;
    height: number;
    fps: number;
    bitrateKbps: number;
    packetsLost: number;
    roundTripMs: number;
  };
  stopReason?: 'victim' | 'attacker' | 'coordinator' | 'timeout' | 'network' | 'emergency';
}
```

Capacidades mínimas del agente:

```ts
interface AgentCapabilities {
  nativeBridge: boolean;
  desktopCapture: boolean;
  pointer: boolean;
  keyboard: boolean;
  wheel: boolean;
  emergencyHotkey: boolean;
  displayCount: number;
  screenWidth: number;
  screenHeight: number;
  dpiScale: number;
}
```

---

## 12. Protocolo de entrada

El protocolo actual `pointer | click | key` será reemplazado por mensajes discriminados:

- `pointer.move`.
- `pointer.down`.
- `pointer.up`.
- `pointer.wheel`.
- `keyboard.down`.
- `keyboard.up`.
- `keyboard.releaseAll`.
- `keyboard.shortcut`.
- `control.heartbeat`.
- `control.release`.

Todos incluirán:

```ts
interface RemoteMessageBase {
  version: 1;
  sessionId: string;
  leaseId: string;
  sequence: number;
  sentAt: number;
}
```

Reglas:

- Coordenadas normalizadas entre 0 y 1.
- Transformación considerando letterboxing, monitor y DPI.
- `down` y `up` separados para soportar arrastre.
- `code` de teclado además del carácter visible.
- Límite de frecuencia por clase de mensaje.
- Rechazo de secuencias repetidas o antiguas.
- Liberación de botones y teclas al cerrar el canal.
- El canal nunca transportará comandos de sistema.

---

## 13. Eventos de servidor

Eventos nuevos:

```text
agent:register
agent:heartbeat
agent:capabilities
agent:status

control:request
control:grant
control:activate
control:revoke
control:heartbeat
control:stopped

remote:quality
remote:fault
session:start
session:end
```

Eventos que dejarán de controlarse desde Coordinación:

```text
remote:checklist-update
remote:status
phase:request
technical:update
```

Se podrán conservar temporalmente para migración y pruebas, pero no formarán parte del flujo final.

---

## 14. Aplicación Windows

### 14.1 Responsabilidades

- Presentar la experiencia de víctima.
- Informar capacidades nativas.
- Solicitar captura de pantalla mediante una acción local.
- Recibir el canal de control.
- Validar cada mensaje antes de tocar Windows.
- Traducir coordenadas y teclas.
- Mantener el indicador de acceso.
- Detenerse de forma local y remota.
- Informar fallos y telemetría.

### 14.2 Componentes

```text
apps/windows-agent/
├── Configuration/
│   ├── AgentConfiguration.cs
│   └── ConfigurationLoader.cs
├── Bridge/
│   ├── NativeMessageRouter.cs
│   ├── NativeMessageValidator.cs
│   └── WebViewBridge.cs
├── Input/
│   ├── InputController.cs
│   ├── PointerController.cs
│   ├── KeyboardController.cs
│   ├── CoordinateMapper.cs
│   └── InputSafetyPolicy.cs
├── Session/
│   ├── ControlLease.cs
│   ├── AgentSession.cs
│   └── SessionWatchdog.cs
├── Safety/
│   ├── EmergencyHotkey.cs
│   ├── StopOverlay.xaml
│   ├── StopOverlay.xaml.cs
│   └── NavigationPolicy.cs
└── Telemetry/
    ├── AgentTelemetry.cs
    └── AgentLogger.cs
```

### 14.3 Política de navegación WebView2

- Permitir únicamente el origen HACKEADO configurado.
- Bloquear ventanas emergentes y navegación externa.
- Bloquear descargas.
- Desactivar menús contextuales innecesarios.
- Desactivar DevTools en la compilación de exposición.
- Validar todos los mensajes JSON.
- No ejecutar scripts construidos con entrada del usuario.

### 14.4 Watchdog

El agente comprobará continuamente:

- Aplicación abierta.
- Sesión válida.
- Consentimiento activo.
- Lease vigente.
- Heartbeat reciente.
- Canal WebRTC conectado.

Si cualquiera falla, la entrada quedará revocada y se liberarán teclas y botones.

---

## 15. Cambios en el cliente web

### 15.1 División de WebRTC

`src/client/components/WebRtcSession.tsx` se dividirá en:

```text
src/client/webrtc/
├── peer.ts
├── protocol.ts
├── quality.ts
└── coordinates.ts

src/client/components/remote/
├── AttackerRemoteDesktop.tsx
├── VictimDesktopBroadcast.tsx
├── ControlConsent.tsx
├── ControlStatus.tsx
├── OperatorToolbar.tsx
├── RemoteQuality.tsx
└── RemoteTimeline.tsx
```

Se eliminará el uso de:

- `document.elementFromPoint` para control remoto.
- `.click()` sobre controles HTML.
- Control limitado a `Tab`, Enter, espacio y Escape.
- Mensajes que describen el control como exclusivo de la pestaña.

### 15.2 Puente de cliente

```text
src/client/native/
├── bridge.ts
├── capabilities.ts
└── messages.ts
```

El modo live exigirá `nativeBridge === true`. Un navegador normal podrá seguir utilizando modo simulado o ensayo, pero no anunciará control nativo.

### 15.3 Estilos

El archivo global se dividirá:

```text
src/client/styles/
├── tokens.css
├── base.css
├── victim.css
├── attacker.css
├── coordinator.css
└── remote.css
```

Dirección visual:

- Industrial y utilitaria.
- Negro carbón, verde ácido, cian y rojo de emergencia.
- Tipografía display condensada y datos monoespaciados.
- Escritorio remoto como elemento dominante.
- Glitch reservado para toma de control y revelación.
- Animaciones respetando `prefers-reduced-motion`.
- Contraste AA y foco visible.

---

## 16. Cambios en el servidor

Nuevos módulos:

```text
src/server/control/
├── agent-registry.ts
└── lease-manager.ts
```

### 16.1 Registro del agente

El servidor almacenará temporalmente:

- `deviceId` autorizado.
- Versión del agente.
- Capacidades.
- Último heartbeat.
- Sesión asociada.
- Estado online/offline/fault.

### 16.2 Lease de control

El lease será:

- Temporal.
- Asociado a una sola sesión.
- Asociado a un único atacante.
- Asociado a un único agente.
- Renovable solo mientras exista heartbeat.
- Revocable por víctima, atacante, coordinación o servidor.
- Invalidado al cambiar a revelación, emergencia o resultado.

### 16.3 Señalización

- Solo Víctima/Agente podrá publicar la oferta de vídeo.
- Solo Atacante podrá responder.
- ICE solo se reenviará entre esos roles.
- El servidor no almacenará vídeo.
- Los eventos de entrada viajarán por RTCDataChannel, no por Socket.IO.

---

## 17. Configuración

Variables previstas:

```text
DEMO_DEVICE_ID
DEMO_AGENT_KEY
CONTROL_LEASE_SECONDS
AGENT_HEARTBEAT_MS
REQUIRE_NATIVE_AGENT
TLS_CERT_PATH
TLS_KEY_PATH
```

No deberán subirse al repositorio:

- Claves del agente.
- Certificados privados.
- Configuración local de la VM.
- Logs de una demostración.
- Binarios publicados.

---

## 18. Preparación de la VM

### 18.1 Sistema

- Windows 11 actualizado.
- Usuario local estándar `VictimaDemo`.
- Sin cuenta personal de Microsoft.
- Sin credenciales reales.
- Sin carpetas compartidas con el host.
- Sin portapapeles compartido del hipervisor.
- Sin drag-and-drop host/guest.
- Sin USB passthrough innecesario.
- Resolución 1920 × 1080.
- Escala recomendada 100% o 125%.

### 18.2 Datos ficticios

```text
C:\HACKEADO-DEMO\
├── Escritorio\
│   ├── Tarea_Final.docx
│   └── Foto_Graduacion.jpg
├── Documentos\
│   ├── Presupuesto_Familiar.xlsx
│   ├── Datos_Bancarios_SIMULADOS.pdf
│   └── Contraseñas_FALSAS.txt
├── Descargas\
│   └── SoporteTecnico.exe.txt
└── Evidencias\
    └── Registro_Incidente.txt
```

### 18.3 Aplicaciones del guion

- Explorador de archivos.
- Bloc de notas.
- Paint.
- Calculadora.
- Navegador con páginas locales.
- Visor de fotografías.
- Visor de documentos ficticios sin macros.

### 18.4 Restauración

- Crear una instantánea base verificada.
- Restaurarla antes del evento.
- Restaurarla ante cualquier comportamiento inesperado.
- Mantener una segunda copia de la VM.

---

## 19. Calidad de transmisión

Objetivos:

- Ideal: 1920 × 1080 a 30 FPS.
- Respaldo: 1280 × 720 a 24–30 FPS.
- Latencia local objetivo inferior a 150 ms.
- Bitrate máximo objetivo de 8 Mbit/s.
- `contentHint = detail` para priorizar texto.
- Ajuste automático de calidad.
- Métricas visibles en Atacante.

Estados de calidad:

- `ÓPTIMA`: al menos 900 líneas y 24 FPS.
- `ADAPTADA`: vídeo utilizable por debajo del objetivo.
- `DEGRADADA`: latencia o pérdida perceptible.
- `SIN SEÑAL`: no existe medio activo.

Una pérdida de vídeo desactivará control; nunca se permitirán clics a ciegas.

---

## 20. Paradas de emergencia

Existirán cuatro mecanismos independientes:

1. Botón nativo en Windows.
2. Atajo global local.
3. Botón en Atacante.
4. Botón en Coordinación.

Al activarse cualquiera:

1. Se invalida el lease.
2. Se rechazan nuevos eventos.
3. Se liberan teclas y botones presionados.
4. Se cierra el canal de control.
5. Se detiene la captura o se pasa a vista sin control según el motivo.
6. Se registra actor, hora y razón.
7. No existe reconexión automática de entrada.

---

## 21. Fallos y recuperación técnica

### Pérdida de Socket.IO

- Congelar estado narrativo.
- Revocar control.
- Mostrar reconexión.
- Exigir nuevo consentimiento para reactivar entrada.

### Pérdida de WebRTC

- Desactivar mouse y teclado.
- Mostrar `SIN SEÑAL`.
- Intentar renegociación de vídeo.
- No reactivar control automáticamente.

### Cierre del agente

- Revocar lease.
- Marcar agente offline.
- Notificar Atacante y Coordinación.

### Fallo del puente nativo

- Mantener experiencia en modo vista o simulado.
- No presentar el sistema como control real.

### Fallo total

- Activar vídeo de respaldo.
- Continuar la explicación educativa.
- Restaurar la VM antes de otra ronda live.

---

## 22. Pruebas

### 22.1 TypeScript unitarias

- Esquemas de eventos.
- Transiciones automáticas.
- Generación y revocación de leases.
- Expiración.
- Calidad.
- Coordenadas normalizadas.
- Redacción de estado público.

### 22.2 C# unitarias

- Validación de mensajes.
- Coordenadas y DPI.
- Secuencias repetidas.
- Mensajes vencidos.
- Política de teclas.
- Expiración de lease.
- Liberación de entrada.

### 22.3 Integración

- Registro de agente.
- Vídeo Víctima → Atacante.
- Consentimiento → lease → control.
- Revocación desde cada rol.
- Desconexión y watchdog.
- Automatización de fases.

### 22.4 E2E

- Flujo seguro.
- Flujo comprometido.
- Rechazo de permisos.
- Revelación.
- Recuperación.
- Reinicio de ronda.
- Coordinación mínima.

### 22.5 Hardware

- VM en la misma Mac.
- VM en otro equipo.
- Red bridged.
- Red host-only cuando aplique.
- 1080p y 720p.
- Escala 100%, 125% y 150%.
- Teclados español e inglés.
- Diez rondas consecutivas.

---

## 23. Cambios por archivo

### Archivos existentes a modificar

- `package.json`: scripts para compilar, probar y empaquetar el agente.
- `.gitignore`: `bin`, `obj`, publicación, claves, certificados y configuración local.
- `src/shared/types.ts`: estado remoto, agente, capacidades y protocolo.
- `src/shared/events.ts`: eventos de agente, control y calidad.
- `src/shared/schemas.ts`: validación de nuevos payloads.
- `src/shared/session.ts`: registro, lease, revocación y heartbeat.
- `src/shared/state-machine.ts`: transiciones automáticas.
- `src/shared/attacker-actions.ts`: solicitar, revelar y liberar control.
- `src/shared/public-state.ts`: ocultar detalles privados antes de revelación.
- `src/shared/recovery.ts`: requerir control revocado antes de recuperación.
- `src/client/App.tsx`: jerarquía de rutas y portada.
- `src/client/routes.ts`: descripciones y prioridad de roles.
- `src/client/components/RoleDashboard.tsx`: shell compacto en sesión.
- `src/client/components/WebRtcSession.tsx`: dividir y reemplazar control web.
- `src/client/views/victim/VictimExperience.tsx`: consentimiento nativo y recuperación.
- `src/client/views/attacker/AttackerPanel.tsx`: escritorio remoto protagonista.
- `src/client/views/coordinator/CoordinatorPanel.tsx`: consola mínima.
- `src/client/styles/global.css`: migración gradual a hojas por rol.
- `src/server/config.ts`: agente, lease y TLS.
- `src/server/index.ts`: HTTPS opcional/obligatorio en modo live.
- `src/server/sockets/gateway.ts`: registro, señalización y control.
- `src/server/sessions/store.ts`: credenciales y estado del agente.
- Pruebas unitarias, de integración y E2E existentes.

### Archivos nuevos principales

- `apps/windows-agent/**`.
- `src/client/native/**`.
- `src/client/webrtc/**`.
- `src/client/components/remote/**`.
- `src/client/components/coordinator/CoordinatorLite.tsx`.
- `src/server/control/agent-registry.ts`.
- `src/server/control/lease-manager.ts`.
- `src/shared/remote-protocol.ts`.
- `src/shared/remote-state.ts`.
- Nuevas suites de pruebas.
- Scripts de build y preparación de VM.

---

## 24. Requisitos funcionales trazables

| ID        | Requisito                                                                |
| --------- | ------------------------------------------------------------------------ |
| RF-CR-001 | La víctima abre manualmente la aplicación Windows.                       |
| RF-CR-002 | La aplicación identifica una VM autorizada.                              |
| RF-CR-003 | La víctima concede pantalla mediante una acción explícita.               |
| RF-CR-004 | La víctima concede control mediante una segunda acción explícita.        |
| RF-CR-005 | El atacante ve el escritorio completo en tiempo real.                    |
| RF-CR-006 | El atacante controla movimiento, botones y rueda del mouse.              |
| RF-CR-007 | El atacante controla teclado y atajos autorizados.                       |
| RF-CR-008 | El control permite operar aplicaciones y archivos ficticios mediante UI. |
| RF-CR-009 | Windows muestra un indicador nativo durante el control.                  |
| RF-CR-010 | La víctima puede detener localmente el acceso.                           |
| RF-CR-011 | El atacante puede liberar el control.                                    |
| RF-CR-012 | Coordinación puede ejecutar una parada de emergencia.                    |
| RF-CR-013 | Solo un atacante posee el lease de control.                              |
| RF-CR-014 | La pérdida de vídeo o heartbeat revoca entrada.                          |
| RF-CR-015 | Las fases normales avanzan sin Coordinación.                             |
| RF-CR-016 | Atacante concentra el monitor y controles del show.                      |
| RF-CR-017 | Víctima concentra engaño, permisos y recuperación.                       |
| RF-CR-018 | Coordinación se limita a sesión, tiempo, presencia y emergencia.         |
| RF-CR-019 | El sistema mantiene un modo simulado de contingencia.                    |
| RF-CR-020 | La VM puede restaurarse entre rondas.                                    |

## 25. Requisitos no funcionales

| ID         | Requisito                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| RNF-CR-001 | Latencia local objetivo inferior a 150 ms.                                                              |
| RNF-CR-002 | Calidad ideal 1080p/30 FPS y respaldo 720p.                                                             |
| RNF-CR-003 | Revocación efectiva en menos de un segundo.                                                             |
| RNF-CR-004 | Ningún control sin consentimiento y lease vigente.                                                      |
| RNF-CR-005 | Ningún dato personal en la VM.                                                                          |
| RNF-CR-006 | Sin servicio, persistencia ni acceso desatendido.                                                       |
| RNF-CR-007 | Todos los mensajes se validan antes de entrar a Windows.                                                |
| RNF-CR-008 | La interfaz mantiene contraste, foco y reducción de movimiento.                                         |
| RNF-CR-009 | Una ronda nueva puede prepararse en menos de dos minutos, incluyendo restauración cuando sea necesaria. |
| RNF-CR-010 | Diez rondas consecutivas deben completarse sin reiniciar el servidor.                                   |

---

## 26. Criterios de aceptación final

La versión se considerará terminada cuando:

1. Windows no pueda ser controlado antes de abrir la aplicación.
2. La captura no comience sin intervención local.
3. Ver pantalla no habilite automáticamente la entrada.
4. La víctima observe claramente qué concederá.
5. La Mac reciba el escritorio completo de Windows.
6. El operador pueda mover, hacer clic, arrastrar, desplazar y escribir.
7. El operador pueda abrir Inicio, Explorador, Bloc de notas y archivos ficticios.
8. El indicador nativo permanezca visible durante el control.
9. El botón y atajo local detengan el acceso.
10. Una desconexión deje inmediatamente el agente en estado seguro.
11. El atacante pueda activar la revelación sin Coordinación.
12. La recuperación no comience mientras el control siga activo.
13. Coordinación no necesite dirigir manualmente escenas o permisos.
14. El modo live no funcione desde un navegador sin puente nativo.
15. No exista shell, persistencia, elevación ni transferencia de archivos.
16. La sesión completa se ejecute dentro de los 15 minutos asignados.
17. La aplicación complete diez rondas de prueba consecutivas.
18. El docente pueda distinguir claramente qué es real, qué es narrativo y qué límites protegen el laboratorio.

---

## 27. Decisiones cerradas

- La víctima oficial será una VM Windows 11.
- Kali Linux no forma parte de esta versión.
- La Mac será atacante y servidor principal.
- El control será nativo y propio, sin RustDesk.
- La entrada remota operará la sesión estándar, no el escritorio seguro.
- La víctima siempre iniciará la aplicación y concederá permisos.
- Atacante y Víctima serán las vistas principales.
- Coordinación será una consola mínima.
- El control se realizará mediante eventos de entrada, no mediante comandos remotos.
- La VM y sus datos serán desechables y ficticios.

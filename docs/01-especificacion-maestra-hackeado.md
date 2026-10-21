# HACKEADO — Especificación maestra de la aplicación

> **Estación:** Grupo 3 — “Alguien está dentro”  
> **Tema:** Acceso remoto, spyware y permisos peligrosos  
> **Modalidad objetivo:** Mac como equipo operador/“atacante”, Windows como equipo víctima y un proyector como vista pública  
> **Naturaleza:** Demostración educativa, controlada y basada exclusivamente en información ficticia  
> **Estado del documento:** Especificación funcional y técnica inicial

---

## 1. Propósito del documento

Este documento define todo lo que deberá contener la aplicación **HACKEADO — Alguien está dentro**: propósito, alcance, experiencia del visitante, paneles, funciones, arquitectura, tecnologías, modelo de datos, comunicaciones, controles de seguridad, pruebas, operación y criterios de aceptación.

Debe utilizarse como fuente de verdad para diseño, desarrollo, ensayos y aprobación del docente. El plan de implementación se encuentra en `02-plan-de-desarrollo-por-fases.md`.

---

## 2. Resumen del producto

La aplicación coordinará una experiencia interactiva de hasta 15 minutos en la que un visitante interpreta a una persona que recibe una solicitud falsa de soporte. Sus decisiones habilitan o bloquean permisos y determinan lo que un supuesto atacante podría observar o controlar.

La experiencia combinará:

- Una aplicación web local y multisistema operativo.
- Una vista para la víctima en Windows.
- Un panel del atacante en Mac.
- Una vista pública proyectada.
- Un panel de coordinación para dirigir la sesión.
- Control remoto real y consentido mediante una herramienta legítima de soporte.
- Acciones teatrales simuladas para representar riesgos que no deben ejecutarse realmente.
- Un reto final de contención y recuperación.
- Reinicio rápido para recibir al siguiente grupo.

La aplicación **no será una herramienta de acceso remoto ni un programa de vigilancia**. La captura real de pantalla y el control real del mouse/teclado estarán a cargo de una herramienta legítima independiente, configurada para una sola sesión y con consentimiento visible.

---

## 3. Objetivos

### 3.1 Objetivo educativo

Al terminar, el visitante debe poder explicar:

1. Qué es un acceso remoto.
2. Cómo una persona puede concederlo sin comprender el alcance.
3. Qué observa la víctima.
4. Qué ve o controla la persona al otro lado.
5. Qué información podría quedar expuesta.
6. Qué señales de alerta estaban presentes.
7. Cómo detener, contener y reportar el incidente.

### 3.2 Objetivo de experiencia

Crear una estación que sea:

- Sorprendente durante los primeros tres minutos.
- Participativa, no una exposición pasiva.
- Fácil de entender para jóvenes de 17 y 18 años.
- Visualmente memorable.
- Segura y explicable ante el docente.
- Repetible durante muchas rondas.
- Funcional aun si falla Internet o el control remoto.

### 3.3 Objetivo técnico

Coordinar varias pantallas en tiempo real desde un servidor local ejecutado en el Mac, sin almacenar información personal y sin depender de una base de datos o servicio en la nube.

---

## 4. Alcance

### 4.1 Incluido

- Creación de sesiones temporales.
- Emparejamiento mediante código corto o QR.
- Roles de víctima, atacante, público y coordinador.
- Historia interactiva con decisiones ramificadas.
- Solicitudes de permisos educativas.
- Sincronización en tiempo real.
- Cronología del incidente.
- Medidor narrativo de exposición y riesgo.
- Acciones reales limitadas sobre una cuenta ficticia.
- Acciones simuladas de alto impacto visual.
- Final seguro, moderado y comprometido.
- Reto de recuperación.
- Puntuación educativa.
- Temporizador de 15 minutos.
- Pausa, salto de escena, cierre rápido y parada de emergencia.
- Restauración de la experiencia.
- Modo simulación completo.
- Modo ensayo en una sola computadora.
- Material ficticio y escenarios configurables.

### 4.2 Fuera de alcance

- Crear un protocolo propio de escritorio remoto.
- Acceso oculto o sin consentimiento.
- Acceso desatendido.
- Persistencia después de cerrar la aplicación.
- Keylogging.
- Captura real de cámara o micrófono.
- Lectura de contraseñas, cookies, sesiones o archivos personales.
- Transferencia real de archivos desde la víctima.
- Elevación administrativa.
- Desactivación de antivirus o firewall.
- Exploración de otros dispositivos de la red.
- Uso de BeEF, troyanos, spyware o exploits.
- Uso de nombres, cuentas o imágenes reales de visitantes.

---

## 5. Principios de diseño

1. **Consentimiento visible:** toda conexión real debe mostrar quién solicita acceso y cómo detenerlo.
2. **Realidad controlada:** el cursor puede moverse realmente; la información sensible siempre será ficticia.
3. **Claridad antes que tecnicismo:** cada pantalla debe expresar una sola idea principal.
4. **La decisión causa el resultado:** el visitante debe comprender qué acción cambió el riesgo.
5. **El público también participa:** no se limitará a mirar a una persona usar la computadora.
6. **Recuperación visible:** la experiencia no termina en el miedo; termina recuperando el control.
7. **Degradación elegante:** si algo falla, la narración continúa en modo simulado.
8. **Reinicio rápido:** una ronda nueva debe poder comenzar en menos de 30 segundos.
9. **Sin datos personales:** todo contenido será ficticio y se eliminará al reiniciar.
10. **Seguridad demostrable:** debe ser sencillo explicar al docente qué es real, qué es simulado y qué medidas lo limitan.

---

## 6. Topología física

### 6.1 Equipo mínimo

- Un Mac para coordinación, panel del atacante y servidor local.
- Una computadora Windows para la víctima.
- Un proyector o pantalla externa conectado al Mac.
- Un router o red Wi-Fi autorizada.
- Altavoces pequeños o los altavoces del proyector.

### 6.2 Distribución recomendada

```text
Área de víctima                    Área de atacante
┌──────────────────┐              ┌──────────────────┐
│ Windows          │              │ Mac              │
│ Visitante        │              │ Operador         │
└──────────────────┘              └────────┬─────────┘
                                          │ HDMI
                                          ▼
                                 ┌──────────────────┐
                                 │ Vista pública    │
                                 │ Proyector        │
                                 └──────────────────┘
```

El visitante no debe ver el panel privado del atacante durante la fase inicial. Puede utilizarse una cortina, orientación opuesta de mesas o bloqueo visual.

---

## 7. Roles de aplicación

### 7.1 Víctima

- Interactúa con la historia.
- Recibe mensajes y solicitudes.
- Concede o rechaza permisos.
- Observa interferencias reales y simuladas.
- Puede detener la sesión.
- Participa en la recuperación.

### 7.2 Atacante/operador

- Observa decisiones en tiempo real.
- Solicita acciones narrativas.
- Opera la herramienta de control remoto legítima.
- Ejecuta únicamente acciones aprobadas sobre datos ficticios.
- Inicia la revelación.

### 7.3 Público

- Observa el misterio al inicio.
- Ve la revelación del “otro lado”.
- Identifica permisos y consecuencias.
- Participa en el reto de recuperación.

### 7.4 Coordinador

- Inicia y reinicia sesiones.
- Controla tiempo y escenas.
- Confirma manualmente el estado del control remoto.
- Activa pausas y contingencias.
- Ejecuta la parada de emergencia.

---

## 8. Estados de la experiencia

```text
PREPARACIÓN
    ↓
ESPERANDO_VISITANTE
    ↓
PERFIL_VÍCTIMA
    ↓
ENGAÑO
    ↓
DECISIÓN
    ├── rechazo/verificación → FINAL_SEGURO
    └── aceptación → SOLICITUD_PERMISOS
                           ↓
                       CONEXIÓN
                           ↓
                    BAJO_CONTROL
                           ↓
                       REVELACIÓN
                           ↓
                      CONTENCIÓN
                           ↓
                      RECUPERACIÓN
                           ↓
                       RESULTADO
                           ↓
                         REINICIO
```

No se permitirán saltos arbitrarios salvo desde el panel de coordinación. Todas las transiciones deben registrarse en la cronología.

---

## 9. Flujo completo de una sesión

### 9.1 Preparación

1. El coordinador inicia el servidor en el Mac.
2. Se comprueba el acceso desde Windows.
3. Se abre la vista pública en el proyector.
4. Se abre el panel del atacante.
5. Se confirma que Windows utiliza una cuenta local ficticia.
6. Se confirma que no existen cuentas personales abiertas.
7. Se prepara la herramienta de soporte remoto.
8. El sistema ejecuta una comprobación técnica.
9. El coordinador crea una sesión temporal.

### 9.2 Llegada

1. La pantalla pública muestra el título de la estación.
2. Windows presenta el personaje ficticio “Alex Rivera”.
3. El visitante selecciona un avatar o alias ficticio.
4. El coordinador inicia el temporizador.

### 9.3 Engaño

1. Llega un mensaje del falso soporte.
2. Aparece urgencia: riesgo de perder acceso a la plataforma.
3. El visitante elige solucionar, posponer o verificar.
4. La decisión se replica en todos los paneles.
5. El panel público no revela todavía todas las consecuencias.

### 9.4 Permisos

Si el visitante continúa, se solicitan progresivamente:

1. Ver pantalla.
2. Controlar teclado y mouse.
3. Acceder al portapapeles.
4. Acceder a archivos.
5. Utilizar micrófono.
6. Utilizar cámara.
7. Recordar el acceso.

Solo visualización y control pueden corresponder a una función real. Los demás permisos serán narrativos.

### 9.5 Conexión real

1. La herramienta legítima genera una autorización temporal.
2. El Mac inicia la solicitud.
3. Windows muestra la identidad del solicitante.
4. El visitante aprueba compartir la pantalla.
5. El visitante aprueba el control.
6. El coordinador marca ambos pasos como confirmados.
7. La aplicación entra en estado `BAJO_CONTROL`.

### 9.6 Control

Durante un máximo recomendado de 90 segundos, el operador:

1. Mueve el cursor.
2. Abre una carpeta ficticia.
3. Abre un documento ficticio.
4. Escribe una frase en el documento.
5. Abre una conversación ficticia.
6. Activa una o dos consecuencias simuladas.
7. Escribe: “No tuve que romper la computadora. Me permitiste entrar.”

### 9.7 Revelación

1. Se congela la historia.
2. El proyector muestra la cronología.
3. Se iluminan los permisos aceptados.
4. Se diferencia cada acción real de cada acción simulada.
5. Se explican posibles consecuencias.

### 9.8 Recuperación

1. El público ordena los pasos de respuesta.
2. La víctima detiene realmente la sesión remota.
3. El coordinador confirma la desconexión.
4. Se revocan permisos narrativos.
5. Se protegen cuentas ficticias.
6. Se completa el reporte del incidente.

### 9.9 Cierre

1. Se muestra la puntuación.
2. Se realiza la pregunta final.
3. Se muestra la respuesta clave.
4. El coordinador restablece la estación.
5. Se verifica que la sesión remota terminó.

---

## 10. Panel de la víctima

### 10.1 Pantalla de bienvenida

- Título de la experiencia.
- Personaje ficticio y avatar.
- Botón “Comenzar”.
- Marca “Demostración controlada”.
- Indicador de conexión con el servidor.

### 10.2 Escritorio de demostración

- Accesos a tareas, fotografías, presupuesto, chats y portal estudiantil.
- Archivos falsos restaurables.
- Barra de estado de la experiencia.
- Área para notificaciones.
- Botón visible para detener el acceso cuando corresponda.

### 10.3 Mensajería de soporte

- Remitente ficticio.
- Número de caso.
- Cuenta regresiva.
- Botones “Solucionar”, “Después” y “Verificar”.
- Señales sutiles de alerta.
- Vista ampliable de detalles del remitente.

### 10.4 Solicitudes de permisos

Cada solicitud incluye:

- Icono y nombre.
- Explicación sencilla.
- Razón declarada por el falso soporte.
- Impacto real explicado después.
- Botones permitir/rechazar.
- Opción “¿Por qué se necesita?”.

### 10.5 Estado de asistencia

- Barra amarilla o roja.
- Identidad del técnico.
- Duración.
- Estado de visualización/control.
- Botón “Detener acceso”.
- Indicador de quién controla el cursor.

### 10.6 Recuperación

- Tarjetas para ordenar acciones.
- Retroalimentación inmediata.
- Botón final de desconexión.
- Confirmación visible de que el control terminó.

---

## 11. Panel del atacante

### 11.1 Cabecera

- Identificador ficticio del objetivo.
- Sistema operativo.
- Estado de conexión.
- Tiempo de sesión.
- Nivel de riesgo.
- Botón de parada de emergencia.

### 11.2 Tarjeta de sesión

- Origen de la solicitud.
- Permisos concedidos.
- Estado de control real confirmado manualmente.
- Tiempo desde la conexión.
- Estado de la herramienta externa.

### 11.3 Mapa de permisos

- Pantalla.
- Teclado y mouse.
- Archivos.
- Portapapeles.
- Micrófono.
- Cámara.
- Acceso permanente.

Estados visuales: no solicitado, solicitado, permitido, rechazado y simulado.

### 11.4 Consola narrativa

- Botones de acciones permitidas según la fase.
- Confirmación antes de acciones de alto impacto.
- Bloqueo de botones fuera de contexto.
- Indicador real/simulado.
- Registro de resultados.

### 11.5 Cronología

- Hora relativa.
- Actor.
- Acción.
- Resultado.
- Etiqueta real, simulada o educativa.

### 11.6 Medidor de consecuencias

- Privacidad.
- Control del dispositivo.
- Riesgo para cuentas.
- Riesgo para archivos.
- Capacidad de recuperación.

Los valores serán narrativos y se explicará que no constituyen una medición técnica.

---

## 12. Panel público

### 12.1 Modo misterio

- Título.
- Cronómetro discreto.
- Mensajes como “Una decisión está a punto de cambiar el resultado”.
- Sin revelar inicialmente el panel completo.

### 12.2 Modo revelación

- Línea de tiempo grande.
- Mapa de permisos.
- Flujo visual de datos ficticios.
- Consecuencias.
- Comparación de lo que vio la víctima y lo que ocurrió detrás.

### 12.3 Modo recuperación

- Lista de pasos.
- Progreso colectivo.
- Puntuación.
- Tiempo restante.
- Confirmación “Control recuperado”.

### 12.4 Cierre

- Pregunta: “¿En qué momento comenzó realmente el ataque?”.
- Respuesta: comenzó cuando se concedió acceso sin verificar.
- Recomendaciones prácticas.
- Código QR opcional hacia un resumen preventivo estático.

---

## 13. Panel de coordinación

### 13.1 Controles

- Crear sesión.
- Iniciar historia.
- Pausar/reanudar.
- Avanzar o retroceder una escena autorizada.
- Activar revelación.
- Iniciar recuperación.
- Cierre rápido.
- Restablecer.
- Parada de emergencia.

### 13.2 Estado técnico

- Servidor activo.
- Víctima conectada.
- Atacante conectado.
- Público conectado.
- Último latido de cada cliente.
- Herramienta remota lista/no lista.
- Sonido listo/no listo.
- Modo normal o contingencia.

### 13.3 Temporizador

- Total de 15 minutos.
- Hitos configurables.
- Alertas silenciosas para el coordinador.
- Cambio automático a cierre rápido cuando sea necesario.

---

## 14. Catálogo de acciones

### 14.1 Acciones reales permitidas

- Mover mouse.
- Escribir en archivos ficticios.
- Abrir/cerrar ventanas.
- Navegar por carpetas ficticias.
- Renombrar o mover archivos ficticios.
- Abrir una página web local.
- Seleccionar elementos del escritorio de demostración.

### 14.2 Acciones simuladas

- Copia de portapapeles.
- Descubrimiento de contraseñas ficticias.
- Cámara o micrófono “disponible”.
- Copia de archivos.
- Inicio de sesión desde otra ubicación.
- Envío de mensaje en nombre de la víctima.
- Bloqueo narrativo.
- Cambio de nivel de riesgo.

### 14.3 Acciones prohibidas

- Cualquier captura de credenciales reales.
- Cámara o micrófono reales.
- Keylogging.
- Descarga de archivos reales.
- Ejecución administrativa.
- Desactivación de defensas.
- Acceso fuera del equipo preparado.
- Persistencia o reconexión automática.

---

## 15. Historia y finales

### 15.1 Final seguro

El visitante verifica o rechaza. Se muestran las señales detectadas y una simulación breve de lo que habría ocurrido.

### 15.2 Riesgo moderado

El visitante comparte pantalla, pero rechaza el control. Se explica la diferencia entre observar e interactuar.

### 15.3 Compromiso alto

El visitante concede control y permisos adicionales. Se ejecuta la secuencia completa y luego se recupera el dispositivo.

### 15.4 Puntuación sugerida

- Examinar remitente: +10.
- Verificar por canal oficial: +20.
- Rechazar acceso permanente: +20.
- Detener la sesión: +20.
- Proteger cuentas desde otro dispositivo: +10.
- Cerrar sesiones: +10.
- Reportar el incidente: +10.

La puntuación debe enseñar, no avergonzar.

---

## 16. Arquitectura lógica

```text
┌──────────────────────────────────────────────────────────────┐
│ Cliente React                                                │
│ víctima | atacante | público | coordinación                 │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP + Socket.IO
┌──────────────────────────▼───────────────────────────────────┐
│ Servidor Node.js                                             │
│ Express | sesiones | máquina de estados | validación        │
│ sincronización | cronología | puntuación | reinicio          │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│ Estado temporal en memoria                                   │
│ sesiones | participantes | eventos | permisos | temporizador │
└──────────────────────────────────────────────────────────────┘

Componente externo separado:
Mac ── herramienta legítima de soporte ── Windows
```

### 16.1 Responsabilidades del cliente

- Renderizar la vista correspondiente.
- Enviar intenciones del usuario.
- Recibir el estado autorizado.
- Reconectarse.
- Precargar recursos.
- Mostrar contingencias.

### 16.2 Responsabilidades del servidor

- Ser la única fuente de verdad.
- Validar roles y mensajes.
- Autorizar transiciones.
- Emitir estado consistente.
- Registrar cronología temporal.
- Gestionar expiración y reinicio.

### 16.3 Responsabilidades de la herramienta remota

- Compartir pantalla con consentimiento.
- Permitir control de mouse/teclado.
- Mostrar cómo detener la sesión.
- Terminar sin dejar acceso persistente.

---

## 17. Tecnologías

| Área | Selección |
|---|---|
| Lenguaje | TypeScript |
| Interfaz | React |
| Compilación | Vite |
| Servidor | Node.js 24 LTS + Express |
| Tiempo real | Socket.IO |
| Validación | Zod |
| Animaciones | CSS + Motion |
| Gráficos | SVG |
| Sonido | Web Audio API / HTML Audio |
| Pruebas unitarias | Vitest |
| Pruebas de navegador | Playwright |
| Formato/calidad | ESLint + Prettier |
| Datos | Memoria + JSON ficticio |
| Control remoto | Chrome Remote Desktop Support o RustDesk restringido |

No se utilizará una base de datos en la primera versión.

---

## 18. Árbol propuesto del repositorio

```text
hackeado/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── .env.example
├── docs/
│   ├── architecture.md
│   ├── rehearsal-runbook.md
│   ├── safety-boundaries.md
│   └── troubleshooting.md
├── public/
│   ├── audio/
│   ├── avatars/
│   ├── icons/
│   ├── images/
│   └── fake-files/
├── scenarios/
│   ├── default.json
│   ├── safe-ending.json
│   └── fallback.json
├── src/
│   ├── client/
│   │   ├── main.tsx
│   │   ├── router.tsx
│   │   ├── components/
│   │   │   ├── PermissionCard.tsx
│   │   │   ├── RiskMeter.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── ConnectionBadge.tsx
│   │   │   ├── Countdown.tsx
│   │   │   └── EmergencyOverlay.tsx
│   │   ├── views/
│   │   │   ├── victim/
│   │   │   ├── attacker/
│   │   │   ├── audience/
│   │   │   └── coordinator/
│   │   ├── hooks/
│   │   ├── socket/
│   │   ├── audio/
│   │   └── styles/
│   ├── server/
│   │   ├── index.ts
│   │   ├── http.ts
│   │   ├── sockets.ts
│   │   ├── sessions/
│   │   ├── state-machine/
│   │   ├── validation/
│   │   ├── scoring/
│   │   └── health/
│   └── shared/
│       ├── types.ts
│       ├── events.ts
│       ├── schemas.ts
│       ├── phases.ts
│       └── constants.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── scripts/
    ├── start-demo.sh
    ├── verify-demo.sh
    └── restore-fixtures.sh
```

---

## 19. Modelo de sesión

```ts
interface DemoSession {
  id: string;
  pairingCode: string;
  phase: ExperiencePhase;
  scenarioId: string;
  participants: Participant[];
  permissions: PermissionState[];
  timeline: TimelineEvent[];
  score: number;
  risk: RiskState;
  remote: RemoteControlState;
  timer: TimerState;
  mode: "live" | "simulated" | "rehearsal";
  createdAt: number;
  expiresAt: number;
}
```

El estado no contendrá información personal del visitante.

---

## 20. API HTTP

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Estado técnico del servidor. |
| POST | `/api/sessions` | Crear sesión. |
| POST | `/api/sessions/:id/join` | Solicitar ingreso con rol. |
| GET | `/api/sessions/:id/state` | Recuperar estado completo. |
| POST | `/api/sessions/:id/reset` | Restablecer sesión. |
| GET | `/api/scenarios` | Escenarios disponibles. |

Las mutaciones narrativas ordinarias se realizarán mediante Socket.IO.

---

## 21. Eventos de tiempo real

### 21.1 Sesión

- `session:create`
- `session:join`
- `session:joined`
- `session:state`
- `session:reset`
- `session:expired`

### 21.2 Experiencia

- `phase:request`
- `phase:changed`
- `decision:submitted`
- `permission:requested`
- `permission:answered`
- `risk:updated`
- `timeline:appended`

### 21.3 Control remoto

- `remote:ready`
- `remote:screen-confirmed`
- `remote:control-confirmed`
- `remote:stop-requested`
- `remote:ended`

Estos eventos representan confirmaciones manuales; no controlan la herramienta externa.

### 21.4 Operación

- `timer:start`
- `timer:pause`
- `timer:warning`
- `experience:pause`
- `experience:resume`
- `experience:emergency-stop`
- `fallback:activate`

Todo evento crítico requiere confirmación y un identificador para evitar duplicados.

---

## 22. Emparejamiento y permisos de roles

1. El coordinador crea una sesión.
2. Se genera un código aleatorio de seis dígitos con expiración.
3. El cliente solicita un rol.
4. El coordinador aprueba atacante, público o víctima.
5. El servidor entrega un token temporal limitado al rol.
6. El token expira al reiniciar o cerrar la sesión.

Permisos:

- Víctima: responder decisiones y recuperación.
- Atacante: solicitar acciones narrativas autorizadas.
- Público: solo lectura.
- Coordinador: control de fases, temporizador y emergencia.

---

## 23. Seguridad y privacidad

- Aplicación disponible únicamente en la red autorizada.
- Códigos temporales y tokens por rol.
- Validación de todos los mensajes con Zod.
- Lista explícita de acciones permitidas.
- Sin ejecución de comandos enviados por el navegador.
- Sin cargas de archivos.
- Sin base de datos.
- Sin analítica externa.
- Sin grabación de pantalla.
- Sin registros de contenido sensible.
- Política de seguridad de contenido.
- Limitación de frecuencia de eventos.
- Expiración automática de sesiones.
- Marca visible de demostración controlada.
- Cuenta Windows local sin privilegios administrativos.
- Herramienta remota sin acceso desatendido.

---

## 24. Fiabilidad y contingencias

### 24.1 Reconexión

- Indicador de pérdida de conexión.
- Reintento automático limitado.
- Solicitud de estado completo después de reconectar.
- Pausa automática si la víctima desaparece.

### 24.2 Modo simulado

Reproduce dentro del navegador:

- Movimiento de un cursor falso.
- Apertura de carpetas simuladas.
- Escritura automática.
- Interferencias de ventanas.
- Consecuencias y recuperación.

### 24.3 Modo ensayo

Permite abrir los cuatro paneles en un mismo equipo y acelerar el reloj.

### 24.4 Cierre rápido

Resume revelación, consecuencias y recuperación en dos minutos cuando el grupo esté atrasado.

### 24.5 Video de respaldo

Debe existir un video local corto de la secuencia completa como último recurso, pero no será el modo normal.

---

## 25. Diseño visual

### 25.1 Víctima

- Apariencia cotidiana.
- Colores claros al inicio.
- Amarillo durante solicitudes.
- Rojo durante compromiso.

### 25.2 Atacante

- Fondo oscuro.
- Alto contraste.
- Datos grandes y comprensibles.
- Diferenciación visible entre real y simulado.

### 25.3 Público

- Texto visible a distancia.
- Máximo una idea principal por escena.
- Cronología de no más de seis eventos simultáneos.
- Animaciones con propósito.

### 25.4 Accesibilidad

- No depender exclusivamente del color.
- Contraste suficiente.
- Subtítulos para mensajes sonoros relevantes.
- Opción de reducir movimiento.
- Sin destellos rápidos.
- Botones grandes y navegación por teclado.

---

## 26. Contenido ficticio

El paquete inicial incluirá:

- Un personaje ficticio.
- Seis archivos académicos/personales.
- Dos conversaciones.
- Tres notificaciones.
- Un portal estudiantil local.
- Una cuenta bancaria completamente ficticia y sin marcas reales.
- Un mensaje de soporte.
- Un reporte de incidente.

Todos los recursos se restaurarán desde plantillas inmutables.

---

## 27. Pruebas

### 27.1 Unitarias

- Transiciones válidas e inválidas.
- Puntuación.
- Cálculo narrativo de riesgo.
- Validación de eventos.
- Expiración y reinicio.

### 27.2 Integración

- Creación y unión de sesión.
- Roles.
- Reconexión.
- Sincronización de cuatro paneles.
- Parada de emergencia.

### 27.3 Navegador

- Flujo seguro.
- Flujo moderado.
- Flujo comprometido.
- Recuperación completa.
- Modo simulado.
- Cierre rápido.

### 27.4 Hardware

- Mac + Windows + proyector.
- Red local sin Internet.
- Internet disponible.
- Resolución del proyector.
- Sonido.
- Diez rondas consecutivas.

---

## 28. Operación de la estación

### 28.1 Lista previa

- Baterías/cargadores conectados.
- Suspensión automática desactivada durante la actividad.
- Cuenta ficticia activa.
- Notificaciones personales cerradas.
- Red comprobada.
- Sonido comprobado.
- Control remoto probado y cerrado.
- Escenario restaurado.
- Plan B disponible.

### 28.2 Entre rondas

1. Terminar control remoto.
2. Cerrar documentos.
3. Restaurar archivos ficticios.
4. Borrar la sesión.
5. Crear nuevo código.
6. Confirmar cuatro paneles.
7. Volver a bienvenida.

### 28.3 Después de la actividad

- Cerrar servidor.
- Deshabilitar o desinstalar la herramienta remota si corresponde.
- Borrar códigos y sesiones.
- Restaurar configuración de suspensión y red.
- Confirmar que no queda acceso habilitado.

---

## 29. Métricas de éxito

- 95% de rondas completadas sin reinicio técnico.
- Reinicio entre grupos menor de 30 segundos.
- Duración entre 12 y 15 minutos.
- Todos los visitantes toman al menos una decisión.
- El público identifica al menos tres señales de alerta.
- La audiencia puede explicar cómo detener el acceso.
- Ningún dato personal es capturado o almacenado.

---

## 30. Criterios de aceptación final

La aplicación estará terminada cuando:

1. Funcione con Mac operador y Windows víctima.
2. Los cuatro paneles se sincronicen.
3. Los tres finales funcionen.
4. La víctima pueda detener el control real.
5. Las acciones reales y simuladas estén claramente documentadas.
6. No exista acceso desatendido.
7. El modo simulado cubra toda la historia.
8. El reinicio tarde menos de 30 segundos.
9. La parada de emergencia funcione.
10. Se completen diez ensayos seguidos.
11. La duración no exceda 15 minutos.
12. El docente apruebe el montaje y sus límites.

---

## 31. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Internet inestable | Modo local o simulación completa. |
| Herramienta remota bloqueada | Prueba previa y respaldo simulado. |
| Red escolar restrictiva | Router autorizado dedicado. |
| Confusión entre real y simulado | Etiquetas internas y explicación durante la revelación. |
| Exposición accidental de datos | Cuenta Windows limpia y ficticia. |
| Exceso de tiempo | Hitos y cierre rápido. |
| Sobrecarga visual | Una idea principal por escena. |
| Visitante rechaza todo | Final seguro con simulación de consecuencias. |
| Reconexión no autorizada | Códigos temporales y sin acceso desatendido. |

---

## 32. Evolución posterior opcional

- Editor visual de escenarios.
- Soporte para varios idiomas.
- Múltiples temas de interfaz.
- Estadísticas agregadas y anónimas durante el evento.
- Botón físico conectado al panel de coordinación.
- Aplicación empaquetada para inicio con doble clic.
- Segundo escenario sobre aplicaciones móviles.

Estas mejoras no forman parte del alcance inicial y solo deben abordarse después de completar y ensayar el flujo principal.


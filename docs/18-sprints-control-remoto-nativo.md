# HACKEADO — Sprints para control remoto nativo

> **Documento técnico base:** [`17-especificacion-control-remoto-nativo.md`](17-especificacion-control-remoto-nativo.md)  
> **Estado:** Sprints 0–12 implementados en software; cierre físico Windows pendiente  
> **Objetivo:** Implementar control real Mac → VM Windows con consentimiento visible, rediseñar Víctima y Atacante y reducir Coordinación.

---

## Estado de implementación

| Sprint | Estado                                                 | Evidencia principal                                                                                 |
| ------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 0      | Software completo; validación física externa pendiente | `scripts/windows/`, `config/windows-agent.example.json`, `docs/19-laboratorio-vm-control-nativo.md` |
| 1      | Completo                                               | `remote-protocol.ts`, `remote-state.ts`, esquemas Zod y pruebas                                     |
| 2      | Completo                                               | `agent-registry.ts`, `lease-manager.ts`, gateway Socket.IO y pruebas de integración                 |
| 3      | Código completo; prueba física Windows pendiente       | Solución WPF, WebView2, puente nativo, navegación cerrada y pruebas C#                              |
| 4      | Código completo; prueba de red real pendiente          | Captura de escritorio, WebRTC 1080p/30, telemetría y corte seguro                                   |
| 5      | Código completo; prueba física Windows pendiente       | Mouse nativo, arrastre, rueda, letterboxing, rate limit y validación de lease                       |
| 6      | Código completo; prueba física Windows pendiente       | Entrada de teclado, shortcuts permitidos y liberación de teclas                                     |
| 7      | Código completo; prueba física Windows pendiente       | Consentimiento doble, overlay, hotkey y watchdog                                                    |
| 8      | Completo                                               | Visor Atacante protagonista, HUD, fullscreen, métricas y drawers                                    |
| 9      | Completo                                               | Experiencia Víctima, rail narrativo, permisos claros, alarma y recuperación                         |
| 10     | Completo                                               | Orquestación automática y `CoordinatorLite`                                                         |
| 11     | Código completo; pruebas físicas de caos pendientes    | Corte seguro, rate limit, antirrepetición, contingencia y matriz de fallos                          |
| 12     | Software completo; validación física pendiente         | RC, paquetes Mac/Windows, preflight, diez rondas, manuales y verificación HTTPS/WSS                 |

La preparación física de la VM, compilación WPF, prueba Mac–Windows y aprobación docente requieren Windows y equipo externo; no pueden certificarse desde este entorno macOS sin SDK .NET.

---

## 1. Estrategia de ejecución

El desarrollo se divide en trece sprints. Cada sprint produce una capacidad demostrable y comprobable. No se considera terminado un sprint si únicamente existe interfaz sin integración o integración sin pruebas.

Duración sugerida:

- Sprints 0–3: 3 a 4 días cada uno.
- Sprints 4–8: 4 a 6 días cada uno.
- Sprints 9–12: 3 a 5 días cada uno.
- Duración total estimada con trabajo paralelo de ocho integrantes: 6 a 8 semanas.

Las estimaciones dependen de disponibilidad de la VM, Visual Studio, red local y pruebas físicas Mac–Windows.

---

## 2. Reglas de trabajo

Cada sprint deberá incluir:

1. Código integrado en el repositorio.
2. Validación de tipos y lint.
3. Pruebas unitarias proporcionales al cambio.
4. Al menos una prueba de integración cuando cambie un flujo.
5. Evidencia manual en Windows cuando toque código nativo.
6. Actualización de documentación afectada.
7. Demostración interna del incremento.
8. Revisión de límites de seguridad.

No se aceptarán como terminadas:

- Pantallas conectadas a datos falsos cuando ya existe backend.
- Botones sin comportamiento real.
- Estados que dependan de refrescar manualmente.
- Control que permanezca activo al perder conexión.
- Código nativo ejecutado como administrador.
- Secretos, certificados o binarios añadidos al repositorio.

---

## 3. Líneas de trabajo

### Línea A — Dominio y servidor

- Tipos.
- Esquemas.
- Sesiones.
- Leases.
- Señalización.
- Máquina de estados.

### Línea B — Agente Windows

- WPF.
- WebView2.
- Puente nativo.
- Mouse y teclado.
- Watchdog.
- Indicador de control.

### Línea C — Experiencia web

- Víctima.
- Atacante.
- Coordinación.
- Público.
- Estilos y accesibilidad.

### Línea D — Calidad y operación

- Pruebas.
- VM.
- Red.
- Empaquetado.
- Documentación.
- Ensayos.

---

## Sprint 0 — Validación de alcance y laboratorio

### Objetivo

Cerrar las decisiones técnicas y preparar un laboratorio seguro antes de incorporar control nativo.

### Requisitos cubiertos

- RF-CR-001.
- RF-CR-002.
- RF-CR-020.
- RNF-CR-005.
- RNF-CR-006.

### Tareas

#### Arquitectura

- Revisar `17-especificacion-control-remoto-nativo.md` con todo el equipo.
- Presentar alcance y límites al docente.
- Confirmar Windows 11 como víctima oficial.
- Confirmar Mac como servidor y atacante.
- Elegir hipervisor y modalidad de red.
- Definir si la VM estará en la Mac o en otro equipo.

#### Laboratorio

- Crear usuario estándar `VictimaDemo`.
- Desconectar cuentas personales.
- Desactivar carpetas compartidas, portapapeles y drag-and-drop del hipervisor.
- Crear `C:\HACKEADO-DEMO` con contenido ficticio.
- Instalar aplicaciones necesarias.
- Configurar resolución y escala.
- Crear instantánea limpia.
- Crear copia de respaldo de la VM.

#### Repositorio

- Reservar `apps/windows-agent/`.
- Agregar exclusiones de `bin`, `obj`, publish, certificados y claves.
- Definir convención de versiones para web y agente.
- Documentar requisitos de Visual Studio y .NET.

### Entregables

- VM preparada.
- Instantánea base.
- Arquitectura aprobada.
- Checklist de límites.
- Decisión de red documentada.

### Criterios de aceptación

- La VM no contiene información personal.
- El usuario no es administrador.
- La VM no comparte recursos con el host.
- El docente conoce que el control será real dentro de la sesión gráfica estándar.
- La restauración de instantánea funciona.

### Dependencias

Ninguna.

---

## Sprint 1 — Contratos de dominio y protocolo

### Objetivo

Crear los tipos y validadores que utilizarán servidor, navegador y agente.

### Requisitos cubiertos

- RF-CR-002.
- RF-CR-013.
- RF-CR-014.
- RNF-CR-004.
- RNF-CR-007.

### Frontend/Shared

- Crear `src/shared/remote-protocol.ts`.
- Crear `src/shared/remote-state.ts`.
- Definir `AgentCapabilities`.
- Definir estados separados de agente, media e input.
- Definir mensajes de puntero, teclado, heartbeat y liberación.
- Definir `stopReason`.
- Definir versión del protocolo.

### Backend

- Agregar eventos de agente y control a `events.ts`.
- Crear esquemas Zod para cada payload.
- Establecer tamaños máximos y campos obligatorios.
- Definir errores de dominio estables.

### Pruebas

- Payload válido por tipo.
- Tipo desconocido rechazado.
- Coordenadas fuera de rango rechazadas.
- Secuencia inválida rechazada.
- Lease vacío rechazado.
- Capacidades incompletas rechazadas.

### Entregables

- Contrato TypeScript versionado.
- Esquemas Zod.
- Pruebas unitarias.
- Diagrama actualizado de mensajes.

### Criterios de aceptación

- Cliente y servidor comparten los mismos tipos.
- Ningún payload remoto se trata como `any`.
- Todos los mensajes sensibles tienen sesión, lease, secuencia y tiempo.
- `npm run typecheck` y pruebas quedan en verde.

### Dependencias

- Sprint 0.

---

## Sprint 2 — Registro del agente y lease de control

### Objetivo

Permitir que el servidor reconozca la VM y conceda control temporal a un único atacante.

### Requisitos cubiertos

- RF-CR-002.
- RF-CR-013.
- RF-CR-014.
- RNF-CR-003.
- RNF-CR-004.

### Backend

- Crear `agent-registry.ts`.
- Crear `lease-manager.ts`.
- Implementar `agent:register`.
- Implementar heartbeat del agente.
- Marcar agente offline al vencer heartbeat.
- Implementar solicitud, concesión, renovación y revocación.
- Rechazar un segundo atacante.
- Revocar en desconexión, expiración o emergencia.
- Agregar variables de configuración.

### Shared

- Actualizar `DemoSession`.
- Migrar el estado remoto anterior.
- Actualizar la redacción pública del estado.

### Pruebas

- Registro autorizado y no autorizado.
- Lease único.
- Expiración.
- Revocación por cada rol.
- Desconexión del propietario.
- Heartbeat vencido.
- Sesiones aisladas entre sí.

### Entregables

- Registro temporal de agente.
- Gestor de leases.
- Estado sincronizado.
- Cobertura de pruebas del dominio.

### Criterios de aceptación

- Un navegador ordinario no puede anunciar control nativo.
- Solo existe un lease activo por sesión.
- Un lease vencido nunca se renueva sin consentimiento vigente.
- Emergencia invalida inmediatamente el lease.

### Dependencias

- Sprint 1.

---

## Sprint 3 — Esqueleto de HACKEADO Victim Host

### Objetivo

Construir la aplicación Windows visible y establecer comunicación segura entre React y C#.

### Requisitos cubiertos

- RF-CR-001.
- RF-CR-002.
- RF-CR-009.
- RNF-CR-006.
- RNF-CR-007.

### Windows

- Crear solución WPF.
- Integrar WebView2.
- Crear configuración local.
- Cargar la ruta Víctima del servidor.
- Restringir navegación al origen autorizado.
- Bloquear popups, descargas y navegación externa.
- Implementar mensajes JSON web → host y host → web.
- Informar capacidades iniciales.
- Agregar logs locales mínimos y sin datos sensibles.

### Frontend

- Crear `src/client/native/bridge.ts`.
- Detectar disponibilidad del puente.
- Mostrar `AGENTE WINDOWS CONECTADO`.
- Mantener modo simulado cuando no exista puente.
- Bloquear modo live sin agente.

### Pruebas

- Parser de configuración.
- Navegación autorizada/rechazada.
- Mensajes conocidos/desconocidos.
- Detección del agente desde React.

### Entregables

- Ejecutable de desarrollo WPF.
- WebView2 mostrando Víctima.
- Comunicación bidireccional básica.
- Indicador nativo inicial.

### Criterios de aceptación

- La víctima debe abrir la aplicación manualmente.
- El agente no se inicia con Windows.
- Cerrar la aplicación elimina sus capacidades.
- La web distingue claramente agente nativo de navegador normal.

### Dependencias

- Sprint 1.
- Sprint 2 para registro real; se puede iniciar con stub tipado.

---

## Sprint 4 — Captura completa y transmisión WebRTC

### Objetivo

Transmitir el escritorio completo de Windows hacia la Mac con telemetría de calidad.

### Requisitos cubiertos

- RF-CR-003.
- RF-CR-005.
- RF-CR-014.
- RNF-CR-001.
- RNF-CR-002.

### Frontend víctima

- Separar `VictimDesktopBroadcast` del componente WebRTC actual.
- Solicitar captura mediante acción visible.
- Cambiar copy de “pestaña” a “pantalla”.
- Guiar a la víctima para seleccionar el monitor correcto.
- Reportar cancelación y finalización.

### Frontend atacante

- Crear `AttackerRemoteDesktop` básico.
- Recibir y reproducir vídeo.
- Calcular resolución, FPS, bitrate, pérdida y RTT.
- Ajustar relación de aspecto y letterboxing.
- Desactivar interacción mientras no exista control.

### Backend

- Adaptar señalización al agente.
- Autorizar oferta desde Víctima/Agente.
- Autorizar respuesta desde Atacante.
- Revocar estado al detener captura.

### Calidad

- Objetivo 1080p/30.
- Respaldo 720p.
- Bitrate objetivo máximo de 8 Mbit/s.
- Estado óptimo/adaptado/degradado/sin señal.

### Pruebas

- Oferta/respuesta/ICE.
- Cancelación del selector.
- Detención local.
- Pérdida del track.
- Desconexión del atacante.
- Prueba en red real.

### Entregables

- Vídeo completo Windows → Mac.
- Métricas visibles.
- Corte seguro de transmisión.

### Criterios de aceptación

- La captura no inicia silenciosamente.
- El atacante ve aplicaciones fuera de HACKEADO.
- Al perder vídeo se revoca cualquier entrada.
- El servidor no almacena el vídeo.

### Dependencias

- Sprints 2 y 3.

---

## Sprint 5 — Control real del mouse

### Objetivo

Controlar el puntero real de Windows desde el visor remoto.

### Requisitos cubiertos

- RF-CR-004.
- RF-CR-006.
- RF-CR-008.
- RF-CR-010.
- RF-CR-014.

### Frontend atacante

- Enviar `pointer.move` con rate limiting.
- Enviar `pointer.down` y `pointer.up`.
- Implementar botón izquierdo, derecho y central.
- Implementar doble clic.
- Implementar rueda.
- Capturar puntero únicamente dentro del vídeo.
- Corregir coordenadas por letterboxing.
- Mostrar estado de control.

### Windows

- Crear `CoordinateMapper`.
- Detectar resolución, monitor y DPI.
- Crear `PointerController`.
- Validar lease y consentimiento en cada evento.
- Aplicar límites de frecuencia.
- Liberar botones al detenerse.

### Pruebas

- Coordenadas en bordes y centro.
- Vídeo 16:9 dentro de contenedores diferentes.
- DPI 100%, 125% y 150%.
- Arrastre prolongado.
- Clic derecho.
- Rueda.
- Eventos repetidos, vencidos o sin lease.

### Entregables

- Movimiento y clic reales.
- Arrastre de ventanas.
- Rueda funcional.
- Pruebas C# y TypeScript.

### Criterios de aceptación

- Desde la Mac se abre Inicio con el mouse.
- Se puede mover una ventana.
- Se puede abrir un archivo mediante doble clic.
- Revocar control detiene entrada en menos de un segundo.

### Dependencias

- Sprint 4.

---

## Sprint 6 — Control real del teclado

### Objetivo

Permitir escritura y atajos autorizados sin convertir el agente en una shell remota.

### Requisitos cubiertos

- RF-CR-004.
- RF-CR-007.
- RF-CR-008.
- RF-CR-010.
- RNF-CR-003.

### Frontend atacante

- Capturar `keydown` y `keyup` al enfocar el visor.
- Mostrar claramente cuándo el teclado está capturado.
- Añadir atajo local para liberar foco.
- Crear botones de Inicio, `Alt+Tab`, Escape, Enter y cerrar ventana.
- Evitar que atajos de la Mac se interpreten como Windows cuando no corresponde.

### Windows

- Crear `KeyboardController`.
- Traducir códigos y modificadores autorizados.
- Implementar `releaseAll`.
- Bloquear combinaciones prohibidas.
- Mantener estado de teclas presionadas.
- Liberar teclas ante blur, desconexión, timeout o emergencia.

### Pruebas

- Texto en español.
- Mayúsculas y símbolos.
- Shift, Control y Alt.
- Auto-repeat.
- `Alt+Tab`.
- Escape.
- Pérdida de red con tecla presionada.
- Combinaciones prohibidas.

### Entregables

- Escritura real.
- Atajos autorizados.
- Política de teclas.
- Protección contra teclas atascadas.

### Criterios de aceptación

- El operador escribe una frase en Bloc de notas.
- Cambia entre dos aplicaciones.
- No puede activar combinaciones bloqueadas.
- Cualquier cierre libera todas las teclas.

### Dependencias

- Sprint 5.

---

## Sprint 7 — Consentimiento, indicador y parada local

### Objetivo

Completar el flujo obligatorio en el que la víctima abre la app, concede permisos separados y conserva control para detenerla.

### Requisitos cubiertos

- RF-CR-001.
- RF-CR-003.
- RF-CR-004.
- RF-CR-009.
- RF-CR-010.
- RNF-CR-003.
- RNF-CR-004.

### Víctima web

- Crear pantalla de permiso de visualización.
- Crear pantalla de permiso de control.
- Explicar capacidades con lenguaje sencillo.
- Agregar cuenta regresiva de tres segundos.
- Mostrar confirmación de acceso.

### Windows nativo

- Crear `StopOverlay` siempre visible.
- Mostrar operador y tiempo.
- Agregar botón nativo de detención.
- Registrar atajo global de emergencia.
- Crear `SessionWatchdog`.
- Revocar lease y entrada desde la capa nativa.

### Backend

- Registrar quién concedió o revocó.
- Impedir que compartir pantalla conceda entrada.
- Exigir consentimiento reciente para emitir lease.

### Pruebas

- Rechazo de pantalla.
- Pantalla permitida, control rechazado.
- Control permitido.
- Detención con botón.
- Detención con atajo.
- Cierre de ventana.
- Expiración y pérdida de heartbeat.

### Entregables

- Consentimiento en dos pasos.
- Overlay nativo.
- Botón y atajo de emergencia.
- Watchdog.

### Criterios de aceptación

- No existe ruta de control sin dos decisiones explícitas.
- El indicador no puede ocultarse desde el panel Atacante.
- El botón local funciona aunque React deje de responder.
- Después de detener, reactivar exige nuevo consentimiento.

### Dependencias

- Sprints 2, 3, 5 y 6.

---

## Sprint 8 — Rediseño del panel Atacante

### Objetivo

Convertir Atacante en el principal espectáculo visual y operativo.

### Requisitos cubiertos

- RF-CR-005.
- RF-CR-006.
- RF-CR-007.
- RF-CR-011.
- RF-CR-016.
- RNF-CR-008.

### Frontend

- Hacer que el vídeo ocupe 70–80% del viewport.
- Crear HUD compacto.
- Agregar pantalla completa.
- Integrar mouse, teclado y shortcuts.
- Mostrar estado del agente y lease.
- Mostrar métricas discretas.
- Agregar `Liberar control`.
- Agregar `Revelar`.
- Convertir permisos, riesgo y cronología en drawers.
- Mantener acciones simuladas como respaldo colapsado.
- Eliminar mensajes de “control web”.

### Diseño

- Mantener estética industrial.
- Marco rojo durante control.
- Cian para telemetría.
- Verde para listo.
- Glitch breve en activación/revelación.
- Sin cards genéricas dominando la pantalla.
- Foco visible y soporte de reducción de movimiento.

### Pruebas

- Resoluciones 1440 × 900, 1920 × 1080 y proyector.
- Teclado y mouse en pantalla completa.
- Drawers sin bloquear el visor.
- Liberación del foco.
- Accesibilidad básica.

### Entregables

- Nueva consola Atacante.
- Visor operativo protagonista.
- Controles narrativos integrados.

### Criterios de aceptación

- El operador completa el guion sin salir de Atacante.
- El escritorio Windows es el elemento visual principal.
- Estado, parada y revelación permanecen siempre accesibles.

### Dependencias

- Sprints 4–7.

---

## Sprint 9 — Rediseño de Víctima y experiencia de pérdida de control

### Objetivo

Convertir Víctima en una experiencia clara, cotidiana e impactante.

### Requisitos cubiertos

- RF-CR-001.
- RF-CR-003.
- RF-CR-004.
- RF-CR-009.
- RF-CR-010.
- RF-CR-017.
- RNF-CR-008.

### Frontend

- Reducir el hero gigante durante una sesión.
- Rediseñar bienvenida y entrada de código.
- Mejorar el mensaje falso de soporte.
- Presentar señales de alerta de forma descubrible.
- Diseñar permisos como decisiones, no como formularios técnicos.
- Integrar estados del agente y captura.
- Mostrar control recuperado.
- Actualizar recuperación y resultado.

### Windows

- Coordinar overlay nativo y contenido React.
- Evitar que el overlay tape elementos esenciales.
- Mantener botón local accesible con distintas escalas.

### Contenido

- Reescribir textos para público de 17–18 años.
- Evitar jerga sin explicación.
- Explicar qué puede ver y hacer el operador.
- Destacar señales de alerta antes de cada decisión.

### Pruebas

- Recorrido con personas que no conocen la aplicación.
- Lectura a distancia.
- Teclado únicamente.
- Contraste.
- Escala de Windows.

### Entregables

- Nueva experiencia Víctima.
- Permisos claros.
- Recuperación integrada.
- Copy educativo revisado.

### Criterios de aceptación

- La víctima entiende qué concede antes de aceptar.
- El control activo es imposible de confundir con estado normal.
- Detener y recuperar resulta obvio.
- No existen grandes zonas vacías o jerarquías confusas.

### Dependencias

- Sprint 7.

---

## Sprint 10 — Coordinación mínima y automatización narrativa

### Objetivo

Eliminar la dirección manual de escenas y dejar Coordinación como consola de sesión y emergencia.

### Requisitos cubiertos

- RF-CR-012.
- RF-CR-015.
- RF-CR-018.
- RF-CR-019.

### Dominio

- Perfil seleccionado → engaño.
- Decisión segura → revelación segura.
- Decisión riesgosa → permisos.
- Captura activa → conexión.
- Consentimiento + lease → bajo control.
- Revelar/liberar → revelación o contención.
- Control revocado → recuperación habilitada.
- Recuperación completa → resultado.

### Frontend coordinación

- Crear `CoordinatorLite`.
- Mantener creación y código.
- Mantener aprobación de participantes.
- Mantener iniciar/pausar tiempo.
- Mostrar cuatro indicadores de presencia.
- Mantener finalizar, reiniciar y emergencia.
- Eliminar director de escenas.
- Eliminar checklist y matriz técnica.
- Eliminar confirmaciones de WebRTC.

### Atacante y víctima

- Mover `Revelar` al atacante.
- Mover recuperación a víctima.
- Mostrar bloqueos con razones concretas.

### Pruebas

- Flujo seguro sin coordinador.
- Flujo comprometido sin coordinador.
- Emergencia desde coordinación.
- Finalización y reset.
- Intentos de transición inválida.

### Entregables

- Máquina de estados automática.
- Coordinación simplificada.
- Transiciones integradas a acciones reales.

### Criterios de aceptación

- Una sesión normal no requiere botones de escena.
- Coordinación cabe en una sola pantalla compacta.
- Atacante controla revelación.
- Víctima controla contención y recuperación.

### Dependencias

- Sprints 7–9.

---

## Sprint 11 — Resiliencia, seguridad y contingencia

### Objetivo

Garantizar que los fallos terminen en un estado seguro y que la presentación continúe.

### Requisitos cubiertos

- RF-CR-010.
- RF-CR-011.
- RF-CR-012.
- RF-CR-014.
- RF-CR-019.
- RNF-CR-003.
- RNF-CR-004.
- RNF-CR-006.
- RNF-CR-007.

### Backend

- Rate limiting por evento.
- Antirrepetición por secuencia.
- Validación temporal.
- Revocación ante desconexión.
- Estado seguro tras reinicio del servidor.
- Redacción de errores sin información sensible.

### Windows

- Watchdog completo.
- Liberación de entrada ante cualquier fallo.
- Gestión de cierre inesperado de WebView2.
- Gestión de suspensión o bloqueo de Windows.
- Logs rotativos y mínimos.

### Frontend

- Estados de error claros.
- Reintentar solo vídeo, nunca entrada automática.
- Modo simulado accesible.
- Activación de vídeo de respaldo.
- Mensajes diferenciados para público y operadores.

### Pruebas de caos

- Desconectar Wi-Fi.
- Cerrar Atacante.
- Cerrar Víctima.
- Cerrar agente.
- Reiniciar servidor.
- Perder track de vídeo.
- Vencer lease.
- Duplicar mensajes.
- Introducir latencia y pérdida.

### Entregables

- Matriz de fallos.
- Comportamiento seguro verificado.
- Contingencia funcional.
- Manual técnico actualizado.

### Criterios de aceptación

- Ningún fallo deja entrada activa a ciegas.
- Reconectar vídeo no reactiva teclado o mouse.
- El modo simulado permite terminar la estación.
- Toda revocación libera botones y teclas.

### Dependencias

- Sprints 2–10.

---

## Sprint 12 — Integración final, empaquetado y ensayo

### Objetivo

Entregar una versión repetible y lista para la exposición.

### Requisitos cubiertos

- RF-CR-001 a RF-CR-020.
- RNF-CR-001 a RNF-CR-010.

### Integración

- Ejecutar suite completa TypeScript.
- Ejecutar suite C#.
- Ejecutar E2E.
- Verificar build web y servidor.
- Verificar publicación Windows.
- Verificar HTTPS/WSS en la red final.
- Probar Mac y VM reales.

### Empaquetado

- Crear build de exposición del agente.
- Desactivar DevTools y diagnóstico visual innecesario.
- Preparar configuración local no versionada.
- Crear scripts de inicio.
- Crear script de verificación.
- Crear paquete offline.
- Mantener binarios fuera del repositorio público.

### Operación

- Actualizar manual de presentación.
- Actualizar manual de operación.
- Actualizar contingencias.
- Actualizar checklist imprimible.
- Preparar instantánea final.
- Preparar router y cables de respaldo.
- Preparar vídeo de respaldo.

### Ensayo

- Ensayar pitch.
- Ensayar consentimiento.
- Ensayar control real.
- Ensayar revelación.
- Ensayar recuperación.
- Ensayar emergencia.
- Medir sesión completa.
- Ejecutar diez rondas consecutivas.
- Intercambiar operadores para comprobar que todos dominan el sistema.

### Entregables

- Versión candidata de exposición.
- VM final.
- Paquete offline.
- Manuales actualizados.
- Evidencia de pruebas.
- Registro de diez rondas.

### Criterios de aceptación

- Sesión completa dentro de 15 minutos.
- 1080p/30 en condiciones ideales o 720p utilizable como degradación.
- Latencia suficientemente baja para operar el escritorio.
- Paradas desde Víctima, Atacante y Coordinación.
- Diez rondas sin estado residual.
- Restauración y reinicio documentados.
- Demostración aprobada internamente por todo el grupo.

### Dependencias

- Todos los sprints anteriores.

---

## 4. Matriz de trazabilidad

| Requisito | Sprint principal | Validación                                           |
| --------- | ---------------: | ---------------------------------------------------- |
| RF-CR-001 |          3, 7, 9 | La víctima abre la aplicación; no hay control antes. |
| RF-CR-002 |             2, 3 | Registro de VM autorizado.                           |
| RF-CR-003 |             4, 7 | Consentimiento separado de pantalla.                 |
| RF-CR-004 |          5, 6, 7 | Consentimiento separado de entrada.                  |
| RF-CR-005 |             4, 8 | Escritorio completo visible en Mac.                  |
| RF-CR-006 |             5, 8 | Mouse completo y arrastre.                           |
| RF-CR-007 |             6, 8 | Escritura y atajos autorizados.                      |
| RF-CR-008 |         5, 6, 12 | Operación real de apps y archivos ficticios.         |
| RF-CR-009 |          3, 7, 9 | Overlay nativo permanente.                           |
| RF-CR-010 |            7, 11 | Parada local independiente.                          |
| RF-CR-011 |            8, 11 | Liberación desde Atacante.                           |
| RF-CR-012 |           10, 11 | Emergencia desde Coordinación.                       |
| RF-CR-013 |                2 | Lease exclusivo.                                     |
| RF-CR-014 |         2, 4, 11 | Revocación por pérdida de canal/heartbeat.           |
| RF-CR-015 |               10 | Flujo completo sin dirección manual.                 |
| RF-CR-016 |                8 | Atacante como vista protagonista.                    |
| RF-CR-017 |                9 | Víctima como vista protagonista.                     |
| RF-CR-018 |               10 | Coordinación mínima.                                 |
| RF-CR-019 |               11 | Modo simulado y vídeo de respaldo.                   |
| RF-CR-020 |            0, 12 | Instantánea y restauración verificadas.              |

---

## 5. Ruta crítica

```text
Sprint 0
   ↓
Sprint 1
   ↓
Sprint 2 ──────┐
   ↓           │
Sprint 3       │
   ↓           │
Sprint 4       │
   ↓           │
Sprint 5       │
   ↓           │
Sprint 6       │
   ↓           │
Sprint 7 ◀─────┘
   ├───────────────┐
   ↓               ↓
Sprint 8        Sprint 9
   └───────┬───────┘
           ↓
       Sprint 10
           ↓
       Sprint 11
           ↓
       Sprint 12
```

Sprints 8 y 9 pueden desarrollarse en paralelo después de estabilizar consentimiento y control.

---

## 6. Reparto sugerido para ocho integrantes

### Integrante 1 — Coordinación técnica

- Arquitectura.
- Integración.
- Revisión de alcance.
- Control de calidad.

### Integrantes 2 y 3 — Agente Windows

- WPF/WebView2.
- Puente nativo.
- Mouse, teclado y watchdog.

### Integrantes 4 y 5 — Backend y tiempo real

- Sesiones.
- Registro del agente.
- Leases.
- Señalización.
- Máquina de estados.

### Integrantes 6 y 7 — Frontend

- Víctima.
- Atacante.
- Coordinación mínima.
- Responsive y accesibilidad.

### Integrante 8 — QA y operación

- Automatización de pruebas.
- Preparación de VM.
- Scripts.
- Manuales y ensayos.

Todos deberán rotar durante ensayos y conocer la parada de emergencia.

---

## 7. Definición global de terminado

Una tarea se considera terminada cuando:

- Cumple el requisito asignado.
- No introduce rutas de acceso oculto.
- Tiene pruebas automatizadas cuando corresponde.
- Fue probada en la VM real cuando toca Windows.
- Maneja error, timeout y desconexión.
- Mantiene TypeScript y C# sin errores.
- No incorpora secretos ni datos personales.
- Incluye texto y accesibilidad revisados.
- Actualiza documentación relacionada.
- Fue demostrada a otro integrante.

Un sprint se considera terminado cuando todos sus criterios de aceptación cuentan con evidencia.

---

## 8. Orden de prioridad ante falta de tiempo

### Imprescindible

1. Aplicación Windows visible.
2. Consentimiento de pantalla.
3. Transmisión de escritorio completo.
4. Consentimiento de control.
5. Mouse real.
6. Teclado real.
7. Detención local.
8. Revocación por pérdida de conexión.
9. Atacante centrado en el vídeo.
10. Coordinación mínima.
11. VM ficticia restaurable.

### Muy importante

- Pantalla completa.
- Métricas de calidad.
- Overlay nativo pulido.
- Timeline.
- Automatización completa de fases.
- Modo simulado.
- Diez rondas de ensayo.

### Opcional

- Soporte de varios monitores.
- Rueda horizontal.
- Animaciones avanzadas.
- Estadísticas históricas.
- Automatización de restauración del hipervisor.
- Segundo escenario narrativo.

No debe sacrificarse la parada segura para implementar elementos visuales opcionales.

---

## 9. Resultado final del plan

Al completar los trece sprints, HACKEADO tendrá un flujo en el que:

1. La víctima abre una aplicación real en la VM Windows.
2. Ingresa a una sesión académica temporal.
3. Recibe una situación de soporte engañosa.
4. Concede visualización de pantalla.
5. Concede control de mouse y teclado.
6. El atacante, desde la Mac, controla la sesión gráfica real.
7. El público observa aplicaciones y archivos ficticios operados en vivo.
8. El atacante activa la revelación.
9. La víctima detiene, contiene y reporta.
10. Coordinación administra el tiempo, finaliza o reinicia.
11. La VM vuelve a un estado limpio para el siguiente grupo.

Ese resultado conserva el impacto de una demostración real y mantiene límites técnicos visibles: consentimiento, usuario estándar, sesión temporal, VM desechable, sin persistencia y sin acceso administrativo.

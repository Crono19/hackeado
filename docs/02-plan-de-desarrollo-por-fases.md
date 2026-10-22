# HACKEADO — Plan de desarrollo por fases

> **Estado al 21 de octubre de 2026:** Fases 0–19 implementadas en software. Firma docente, ensayo humano de 12–15 minutos y comprobación física Mac → Windows/proyector permanecen como validaciones externas previas al modo híbrido. Evidencia consolidada en `15-fases-18-19-seguridad-y-release.md` y documentos anteriores.

> **Producto:** “Alguien está dentro”  
> **Documento relacionado:** `01-especificacion-maestra-hackeado.md`  
> **Objetivo:** Construir, verificar y preparar la experiencia completa de manera incremental, manteniendo una demostración utilizable al final de cada bloque importante.

---

## 1. Estrategia general

El desarrollo se divide en **20 fases**. El orden reduce riesgos: primero se fijan los límites y el protocolo de comunicación; después se construyen los paneles; al final se integra la operación remota, se endurece la aplicación y se ensaya la presentación.

Cada fase incluye:

- Objetivo.
- Trabajo de frontend.
- Trabajo de backend.
- Trabajo de contenido, operación o infraestructura.
- Entregables.
- Criterios de aceptación.

No debe iniciarse una fase dependiente si los criterios de aceptación de la anterior no se cumplen.

---

## Fase 0 — Validación académica, ética y operativa

### Objetivo

Definir por escrito qué será real, qué será simulado y qué acciones están prohibidas.

### Frontend

- Crear bocetos de las cuatro vistas.
- Identificar visualmente acciones reales y simuladas para el equipo organizador.
- Diseñar la marca “Demostración controlada”.

### Backend

- Sin implementación todavía.
- Documentar que el servidor no ejecutará comandos del sistema.

### Operación

- Presentar al docente el concepto híbrido.
- Obtener aprobación para la herramienta legítima de soporte.
- Confirmar disponibilidad de Mac, Windows, proyector y red.
- Definir la cuenta ficticia de Windows.
- Elaborar la lista de acciones prohibidas.

### Entregables

- Matriz real/simulado/prohibido.
- Diagrama físico aprobado.
- Lista de equipos.
- Acta breve de aprobación o comentarios del docente.

### Criterios de aceptación

- El docente comprende el flujo.
- No se utilizarán herramientas ofensivas.
- Los equipos y sistemas operativos están confirmados.

---

## Fase 1 — Preparación del repositorio y herramientas

### Objetivo

Crear una base reproducible para desarrollo y pruebas.

### Frontend

- Inicializar React + TypeScript + Vite.
- Configurar rutas iniciales para los cuatro paneles.
- Agregar estilos globales mínimos.

### Backend

- Inicializar Node.js + Express.
- Agregar endpoint `/api/health`.
- Servir la compilación del frontend.

### Infraestructura

- Fijar versión LTS de Node.
- Configurar npm scripts.
- Configurar ESLint, Prettier, Vitest y variables de entorno.
- Crear `.env.example` sin secretos.

### Entregables

- Repositorio ejecutable.
- Comandos `dev`, `build`, `start`, `test` y `lint`.
- Página inicial accesible desde Mac.

### Criterios de aceptación

- Instalación limpia sin errores.
- Compilación correcta.
- El servidor responde saludable.

---

## Fase 2 — Dominio, tipos y máquina de estados

### Objetivo

Definir el lenguaje común de toda la aplicación antes de construir comportamiento visual complejo.

### Frontend

- Consumir tipos compartidos.
- Crear una pantalla de depuración que muestre la fase actual.

### Backend

- Definir `DemoSession`, participantes, permisos, riesgo y cronología.
- Implementar las transiciones autorizadas.
- Rechazar transiciones inválidas.
- Definir los tres finales.

### Pruebas

- Probar cada transición válida.
- Probar intentos de salto inválido.
- Probar reinicio desde cualquier estado.

### Entregables

- Tipos compartidos.
- Diagrama de estados actualizado.
- Máquina de estados cubierta por pruebas.

### Criterios de aceptación

- No es posible llegar a `BAJO_CONTROL` sin pasar por permisos y conexión.
- La parada de emergencia funciona desde cualquier fase activa.

---

## Fase 3 — Gestión de sesiones temporales

### Objetivo

Crear, unir, expirar y restablecer sesiones sin base de datos.

### Frontend

- Formulario para introducir código.
- Estados de esperando, aprobado, rechazado y expirado.
- QR visual para facilitar conexión.

### Backend

- Crear códigos aleatorios temporales.
- Aprobar roles.
- Emitir tokens temporales por rol.
- Expirar sesiones inactivas.
- Implementar restablecimiento total.

### Seguridad

- Limitar intentos por código.
- No registrar datos personales.
- Invalidar todos los tokens al reiniciar.

### Criterios de aceptación

- Los cuatro roles pueden unirse.
- Un código expirado no funciona.
- Un token de público no puede controlar la experiencia.

---

## Fase 4 — Comunicación en tiempo real

### Objetivo

Sincronizar todos los paneles mediante Socket.IO.

### Frontend

- Cliente Socket.IO compartido.
- Indicadores conectado/reconectando/desconectado.
- Solicitud de estado completo tras reconectar.

### Backend

- Rooms por sesión.
- Validación de eventos.
- Confirmaciones y deduplicación.
- Latido de clientes.
- Broadcast del estado autorizado.

### Pruebas

- Desconectar y reconectar un panel.
- Enviar el mismo evento dos veces.
- Cerrar una pestaña y comprobar el estado técnico.

### Criterios de aceptación

- Los paneles reflejan cambios en menos de un segundo en red local.
- Una reconexión restaura el estado correcto.

---

## Fase 5 — Sistema visual y componentes compartidos

### Objetivo

Crear una identidad visual coherente y reutilizable.

### Frontend

- Variables de color, tipografía, espacio y movimiento.
- Componentes de botón, tarjeta, modal, contador y estado.
- `PermissionCard`, `RiskMeter`, `Timeline` y `ConnectionBadge`.
- Temas claro, advertencia y oscuro.
- Diseño adaptable a laptop y proyector.

### Accesibilidad

- Contraste.
- Foco visible.
- Navegación por teclado.
- Opción de reducir movimiento.
- Etiquetas que no dependan solo del color.

### Criterios de aceptación

- Los componentes funcionan en Chrome/Edge de Windows y navegador del Mac.
- La vista pública es legible desde varios metros.

---

## Fase 6 — Panel de coordinación básico

### Objetivo

Dar al coordinador control seguro de la experiencia.

### Frontend

- Crear sesión y mostrar código/QR.
- Aprobar participantes.
- Mostrar estado técnico.
- Controles iniciar, pausar, continuar y reiniciar.
- Botón de parada de emergencia.

### Backend

- Autorizar comandos solo para coordinador.
- Registrar cambios de fase.
- Difundir pausas y reinicios.

### Criterios de aceptación

- El coordinador puede operar sin abrir herramientas de desarrollo.
- La parada de emergencia deja todos los paneles en estado seguro.

---

## Fase 7 — Temporizador y dirección de escena

### Objetivo

Mantener la actividad dentro de 15 minutos.

### Frontend

- Cronómetro principal.
- Hitos y alertas privadas.
- Control de pausa.
- Botón “Cierre rápido”.

### Backend

- Reloj autoritativo.
- Sincronización del tiempo.
- Eventos de advertencia.
- Transición al cierre rápido cuando se solicita.

### Contenido

- Definir hitos en minutos 3, 6, 10, 14 y 15.

### Criterios de aceptación

- Todos los paneles muestran el mismo tiempo.
- Pausar no desincroniza el reloj.

---

## Fase 8 — Panel de víctima: bienvenida y escritorio

### Objetivo

Construir el entorno cotidiano y creíble de la víctima.

### Frontend

- Bienvenida.
- Avatar y alias ficticio.
- Escritorio de demostración.
- Archivos y aplicaciones ficticias.
- Área de notificaciones.
- Marca discreta de demostración.

### Backend

- Entregar perfil y escenario.
- Registrar inicio de participación sin guardar datos personales.

### Contenido

- Preparar textos, imágenes y archivos ficticios.
- Evitar marcas o cuentas reales.

### Criterios de aceptación

- Un visitante entiende cómo comenzar sin instrucciones técnicas.
- Ningún elemento utiliza información personal.

---

## Fase 9 — Engaño y toma de decisiones

### Objetivo

Implementar el mensaje de soporte y las rutas segura, moderada y comprometida.

### Frontend

- Notificación inicial.
- Conversación con falso soporte.
- Cuenta regresiva narrativa.
- Detalles del remitente.
- Opciones solucionar, posponer y verificar.

### Backend

- Validar decisiones según fase.
- Calcular puntuación inicial.
- Determinar ruta narrativa.
- Registrar señales examinadas.

### Criterios de aceptación

- Cada decisión conduce al estado previsto.
- Rechazar no bloquea la experiencia; activa el final seguro.

---

## Fase 10 — Sistema de permisos

### Objetivo

Mostrar cómo el riesgo aumenta con cada permiso.

### Frontend

- Solicitudes individuales.
- Explicaciones sencillas.
- Estados permitir/rechazar.
- Barra de exposición.
- Estado visible de asistencia.

### Backend

- Modelo de permisos.
- Reglas de dependencia.
- Actualización de riesgo.
- Emisión hacia atacante y público.

### Pruebas

- Combinaciones de permisos.
- Rechazo parcial.
- Intento de conceder permisos fuera de fase.

### Criterios de aceptación

- Cada permiso cambia inmediatamente el panel del atacante.
- La explicación posterior refleja las decisiones reales.

---

## Fase 11 — Panel del atacante

### Objetivo

Construir el centro de control narrativo.

### Frontend

- Cabecera y tarjeta de sesión.
- Mapa de permisos.
- Medidores de consecuencias.
- Cronología.
- Consola de acciones.
- Diferenciación real/simulado.
- Confirmaciones para acciones relevantes.

### Backend

- Lista de acciones permitidas por fase.
- Control de rol.
- Resultado y confirmación de acción.
- Registro en cronología.

### Criterios de aceptación

- No aparecen acciones fuera de contexto.
- Cada acción muestra su naturaleza real o simulada al operador.

---

## Fase 12 — Vista pública y revelación

### Objetivo

Transformar las decisiones privadas en una explicación colectiva impactante.

### Frontend

- Modo misterio.
- Animación de revelación.
- Cronología ampliada.
- Flujo visual de datos.
- Mapa de permisos.
- Comparación víctima/atacante.
- Mensajes legibles a distancia.

### Backend

- Estado público de solo lectura.
- Filtrar información reservada del coordinador.
- Sincronizar escenas y animaciones.

### Criterios de aceptación

- El proyector no revela el giro antes de tiempo.
- La audiencia comprende qué cambió al comenzar la revelación.

---

## Fase 13 — Motor de acciones simuladas

### Objetivo

Representar consecuencias de alto impacto sin acceder a datos reales.

### Frontend

- Cursor simulado.
- Carpetas y ventanas simuladas.
- Escritura automática.
- Copia ficticia de portapapeles.
- Micrófono/cámara simulados.
- Progreso de “información expuesta”.
- Alerta de inicio de sesión ficticio.

### Backend

- Cola de acciones.
- Confirmaciones.
- Tiempos configurables.
- Cancelación al pausar o detener.

### Seguridad

- Verificar que ninguna acción solicita APIs reales de cámara/micrófono.
- Verificar que no se leen archivos del equipo.

### Criterios de aceptación

- El flujo completo puede ejecutarse sin herramienta remota.
- La parada de emergencia cancela la cola.

---

## Fase 14 — Cronología, riesgo y puntuación

### Objetivo

Convertir acciones dispersas en una explicación comprensible.

### Frontend

- Cronología por actor.
- Etiquetas real/simulado/educativo.
- Medidores de riesgo.
- Puntuación y retroalimentación.

### Backend

- Reglas de puntuación.
- Reglas narrativas de riesgo.
- Evitar duplicación de eventos.
- Generar resumen final.

### Criterios de aceptación

- La puntuación puede explicarse con decisiones concretas.
- Los porcentajes se etiquetan como recurso narrativo.

---

## Fase 15 — Reto de contención y recuperación

### Objetivo

Enseñar qué hacer después de detectar el acceso.

### Frontend

- Tarjetas ordenables.
- Respuestas correctas e incorrectas.
- Progreso colectivo.
- Botón final “Recuperar control”.
- Pantalla final con recomendaciones.

### Backend

- Validar orden lógico.
- Registrar intentos.
- Actualizar puntuación.
- Exigir confirmación de fin del control remoto.

### Contenido

- Desconectar/terminar sesión.
- Revocar permisos.
- Cambiar contraseñas desde equipo seguro.
- Cerrar sesiones.
- Activar verificación en dos pasos.
- Revisar y reportar.

### Criterios de aceptación

- El participante no puede completar la recuperación sin detener la sesión.
- El cierre explica a quién informar.

---

## Fase 16 — Integración operativa del control remoto

### Objetivo

Integrar de forma segura el control real Mac → Windows sin automatizarlo desde la aplicación.

### Frontend

- Lista de comprobación en coordinación.
- Confirmaciones de pantalla compartida, control concedido y sesión terminada.
- Instrucciones visibles para detener el acceso.

### Backend

- Estados informativos `ready`, `screen`, `control`, `ending` y `ended`.
- Requerir confirmación antes de entrar en `BAJO_CONTROL`.
- Bloquear reinicio si la sesión no figura como terminada.

### Operación

- Probar Chrome Remote Desktop Support.
- Evaluar RustDesk local como contingencia.
- Deshabilitar acceso desatendido, transferencia, portapapeles y elevación.
- Preparar la cuenta Windows ficticia.

### Criterios de aceptación

- El visitante concede y revoca control visiblemente.
- No es posible reconectar sin nueva autorización.
- La sesión termina al finalizar cada ronda.

---

## Fase 17 — Resiliencia y modos de contingencia

### Objetivo

Garantizar que la actividad pueda continuar ante fallos previsibles.

### Frontend

- Modo simulación.
- Modo ensayo.
- Modo cierre rápido.
- Mensajes de conexión perdida.
- Controles para reanudar.

### Backend

- Recuperación de estado.
- Expiración segura.
- Copia inmutable del escenario inicial.
- Restablecimiento idempotente.

### Operación

- Video de respaldo.
- Guion físico con tarjetas.
- Lista de respuesta a fallos.

### Criterios de aceptación

- La experiencia completa funciona sin Internet.
- Puede terminarse aun si Windows pierde conexión.
- Reiniciar varias veces no corrompe el estado.

---

## Fase 18 — Seguridad, privacidad y endurecimiento

### Objetivo

Reducir superficie de riesgo antes de presentar la aplicación.

### Frontend

- Evitar renderizado inseguro de texto.
- Ocultar controles no autorizados.
- Marcas visibles de demostración.

### Backend

- Validación estricta con Zod.
- Rate limiting.
- Tokens por rol y expiración.
- Política de orígenes.
- Política de seguridad de contenido.
- Sin endpoints de ejecución o carga de archivos.
- Registros mínimos y sin datos sensibles.

### Operación

- Revisar firewall y red autorizada.
- Revisar permisos de la herramienta remota.
- Documentar eliminación posterior.

### Criterios de aceptación

- Un rol público no puede emitir acciones.
- Entradas malformadas son rechazadas.
- No hay datos personales en logs o archivos.

---

## Fase 19 — Pruebas integrales, empaquetado y presentación

### Objetivo

Convertir el proyecto funcional en una estación confiable y lista para evaluación.

### Pruebas

- Unitarias y de integración completas.
- Flujos E2E seguro, moderado y comprometido.
- Reconexión y emergencia.
- Accesibilidad.
- Compatibilidad Mac/Windows.
- Resolución real del proyector.
- Sonido ambiental.
- Diez rondas consecutivas.

### Empaquetado

- Compilación de producción.
- Script sencillo de inicio.
- Verificador previo.
- Copia offline de dependencias necesarias.
- README de instalación y operación.

### Ensayo

- Asignar responsabilidades.
- Ensayar guion de 15 minutos.
- Ensayar cierre rápido.
- Ensayar plan B sin red.
- Registrar tiempos y ajustar escenas.
- Presentar al docente.

### Entregables

- Versión candidata final.
- Manual de operación.
- Manual de contingencias.
- Guion por integrante.
- Lista de comprobación impresa.
- Video de respaldo.

### Criterios de aceptación

- Diez ejecuciones consecutivas sin fallo crítico.
- Reinicio menor de 30 segundos.
- Duración entre 12 y 15 minutos.
- Aprobación final del docente.

---

## 2. Hitos de producto

### Hito A — Esqueleto conectado

Incluye fases 0 a 4. Los cuatro roles pueden conectarse y compartir estado.

### Hito B — Primera experiencia jugable

Incluye fases 5 a 10. El visitante puede recibir el engaño, decidir y conceder permisos.

### Hito C — Demostración visual completa

Incluye fases 11 a 15. Atacante, público, consecuencias y recuperación funcionan en modo simulado.

### Hito D — Experiencia híbrida real

Incluye fase 16. El control remoto consentido funciona entre Mac y Windows.

### Hito E — Versión lista para presentar

Incluye fases 17 a 19. La experiencia tiene contingencias, seguridad, pruebas y documentación.

---

## 3. Orden de prioridad

### Imprescindible

- Sesiones y roles.
- Sincronización.
- Víctima, atacante, público y coordinación.
- Decisiones y permisos.
- Cronología.
- Recuperación.
- Modo simulado.
- Reinicio y emergencia.

### Muy importante

- Control remoto real autorizado.
- Medidores y animaciones.
- Sonido.
- Puntuación.
- Tres finales.

### Opcional si queda tiempo

- Editor de escenarios.
- Botón físico.
- Estadísticas agregadas.
- Empaquetado nativo con doble clic.
- Variaciones visuales adicionales.

---

## 4. Dependencias entre fases

```text
0 → 1 → 2 → 3 → 4
                ↓
          5 → 6 → 7
                ↓
          8 → 9 → 10
                    ↓
             11 → 12 → 13 → 14 → 15
                                   ↓
                                  16
                                   ↓
                              17 → 18 → 19
```

El contenido ficticio puede prepararse en paralelo desde la fase 5, pero debe integrarse formalmente en las fases 8, 9 y 13.

---

## 5. Definición de terminado para cada fase

Una fase solo se considera terminada cuando:

1. El código compila.
2. Las pruebas relacionadas pasan.
3. El comportamiento fue comprobado en navegador.
4. Los estados de error tienen una salida clara.
5. No se introducen datos reales.
6. La documentación correspondiente fue actualizada.
7. Al menos otro integrante puede ejecutar la función sin ayuda del autor.

---

## 6. Recomendación de reparto técnico

| Área                 | Responsabilidad                                 |
| -------------------- | ----------------------------------------------- |
| Coordinación técnica | Integración, prioridades y revisiones.          |
| Backend              | Sesiones, estados, Socket.IO y seguridad.       |
| Víctima              | Historia, permisos y recuperación.              |
| Atacante             | Consola, cronología y acciones.                 |
| Público              | Revelación, visualizaciones y puntuación.       |
| Diseño/contenido     | Identidad, textos, recursos ficticios y sonido. |
| QA/operación         | Pruebas, contingencias, hardware y ensayos.     |

Todos los integrantes deben poder iniciar, detener y restablecer la estación.

---

## 7. Resultado final esperado

Al concluir las 20 fases existirán:

- Una aplicación web local multisistema.
- Cuatro paneles sincronizados.
- Tres rutas narrativas.
- Control remoto real, visible y revocable.
- Simulación completa de respaldo.
- Reto de recuperación.
- Guion de 15 minutos.
- Documentación técnica y operativa.
- Una estación segura, repetible e impactante.

# Evidencia técnica — Fases 15, 16 y 17

**Estado:** implementadas en software. La comprobación física Mac → Windows y la aprobación docente siguen siendo validaciones externas obligatorias antes de usar modo real.

## Fase 15 — Recuperación

La víctima recibe un reto visual “LOCKDOWN” con seis tarjetas desordenadas. Puede arrastrarlas o moverlas con botones accesibles. El servidor registra cada intento, señala la primera posición incorrecta y solo habilita el protocolo al recibir el orden exacto:

1. Detener acceso remoto.
2. Revocar permisos.
3. Cambiar contraseñas desde un equipo seguro.
4. Cerrar sesiones abiertas.
5. Activar verificación en dos pasos.
6. Revisar y reportar a docente, encargado de laboratorio o TI.

La recuperación no puede avanzar si el estado remoto no es `ended`; tampoco se puede generar el resultado final si falta una acción. La vista pública muestra el mismo progreso sin controles. El resultado incluye puntuación y recomendaciones.

## Fase 16 — Operación remota consentida

La aplicación **no instala, inicia ni automatiza control remoto**. Solo dirige y registra un flujo visible de una herramienta legítima separada.

### Herramienta principal: Chrome Remote Desktop Support

1. En Windows, abrir la función de soporte remoto desde el sitio oficial.
2. Iniciar sesión únicamente con la cuenta ficticia preparada para la actividad.
3. Generar un código de soporte de un solo uso; no reutilizarlo ni proyectarlo al público.
4. En Mac, introducirlo en la herramienta externa.
5. La víctima lee el nombre del operador y concede pantalla visiblemente.
6. Coordinación marca `screen` en HACKEADO.
7. Solo si la víctima concede control, coordinación marca `control`.
8. La víctima conserva visible la barra y el botón **Detener / Stop sharing**.
9. Al terminar, la víctima detiene primero; coordinación marca `ending` y después `ended` al ver la confirmación.
10. Cerrar ambas pestañas y usar un código nuevo en la ronda siguiente.

### Contingencia: RustDesk local

Usar únicamente una versión oficial previamente instalada y ensayada. Mantener visible el aviso de sesión y requerir aprobación manual en Windows. No habilitar servicio permanente ni contraseña fija.

### Checklist obligatorio en la consola

- Cuenta ficticia exclusiva; ninguna cuenta personal abierta.
- Acceso desatendido desactivado.
- Transferencia de archivos desactivada.
- Portapapeles compartido desactivado.
- Elevación/administración desactivada.
- Botón de detención visible para la víctima.
- Archivos del escritorio enteramente ficticios.

En modo `live`, el backend bloquea `ready` hasta completar el checklist. Las transiciones permitidas son `idle → ready → screen → control → ending → ended`; no se puede saltar una confirmación ni reiniciar durante acceso activo.

## Fase 17 — Resiliencia

### Modos

- `simulated`: experiencia completa local, sin herramienta remota ni Internet.
- `rehearsal`: mismo flujo con reloj narrativo a velocidad ×4.
- `live`: integración manual y consentida con la herramienta externa.
- Cierre rápido: reduce la ronda a dos minutos y lleva a revelación educativa.

Socket.IO conserva el estado autoritativo del servidor. Si un navegador pierde conexión, muestra una alerta, congela su última escena y ofrece reconexión. El token temporal permite restaurar el estado. Si Windows no vuelve, coordinación puede ejecutar orden, detención simulada y seis pasos hasta el resultado.

El escenario maestro está congelado profundamente y cada consumidor recibe una copia aislada. Reiniciar rota código y tokens; múltiples reinicios limpios no corrompen estado. El servidor impide reiniciar con acceso remoto activo.

### Respuesta a fallos

| Falla                      | Acción inmediata                             | Continuación                                           |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Windows pierde Wi‑Fi       | Pausar reloj; no reconectar control remoto   | Coordinación finaliza con recuperación y vista pública |
| Herramienta remota falla   | Marcar sesión terminada y cerrar herramienta | Activar simulación local                               |
| Socket se desconecta       | Pulsar “Reintentar enlace”                   | El servidor restaura estado                            |
| Proyector pierde señal     | Mantener explicación oral                    | Abrir respaldo local en otro equipo                    |
| Servidor deja de responder | No repetir permisos reales                   | Usar tarjetas físicas y respaldo audiovisual           |
| Tiempo insuficiente        | Activar cierre rápido                        | Revelación, prevención y pregunta final                |

### Respaldo y tarjetas físicas

El archivo [`public/fallback/respaldo.html`](../public/fallback/respaldo.html) es una reproducción audiovisual autónoma: no usa CDN, fuente web, API ni Internet. Funciona manual o automáticamente y cubre decisión, doble perspectiva, señales, seis pasos y cierre.

Imprimir seis tarjetas grandes, una por paso, y una séptima tarjeta roja: **“¿La sesión remota ya terminó?”**. Ante fallo total, los visitantes ordenan las tarjetas y el presentador revela la respuesta. Al reverso:

- Detener: “corta acciones nuevas”.
- Revocar: “cerrar una ventana no borra permisos”.
- Contraseñas: “hazlo desde otro equipo seguro”.
- Sesiones: “expulsa accesos todavía abiertos”.
- 2FA: “agrega una segunda barrera”.
- Reportar: “protege también a los demás”.

## Pruebas trazables

- `recovery.test.ts`: orden, intentos, bloqueo remoto, secuencia y resultado.
- `remote-safety.test.ts`: checklist y confirmaciones sin saltos.
- `resilience.test.ts`: velocidad de ensayo e inmutabilidad.
- `session-store.test.ts`: bloqueo de reinicio y reinicios sucesivos.
- Pruebas previas: sesiones, roles, permisos, cronología, simulación, reconexión y emergencia.

## Criterios completados

- La víctima no puede completar recuperación con acceso activo.
- El cierre identifica a quién reportar.
- Concesión y revocación son visibles y separadas.
- Cada ronda requiere una autorización remota nueva.
- La experiencia simulada y el respaldo funcionan sin Internet.
- Coordinación puede terminar si Windows se desconecta.
- Reinicios sucesivos producen sesiones limpias.

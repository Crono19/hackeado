# HACKEADO — Evidencia técnica de Fases 9, 10 y 11

> Estado: implementadas y verificadas el 21 de octubre de 2026.  
> Alcance: engaño, decisiones, permisos y panel del atacante.  
> Seguridad: ninguna acción ejecuta comandos, lee archivos reales o activa cámara/micrófono.

## 1. Experiencia resultante

La historia ya conecta decisiones de víctima con estado visible del supuesto atacante:

1. Coordinación cambia de perfil a engaño.
2. Víctima recibe caso ficticio de soporte con urgencia y contador de 45 segundos.
3. Al abrirlo aparece conversación, remitente ampliable y tres señales inspeccionables.
4. Víctima elige solucionar, posponer o verificar.
5. Posponer/verificar activan final seguro; solucionar abre solicitudes de permisos.
6. Atacante solo puede solicitar permisos válidos para el momento y dependencias actuales.
7. Cada respuesta recalcula exposición y se replica inmediatamente.
8. Panel atacante muestra objetivo ficticio, permisos, naturaleza real/simulada, riesgo, acciones y cronología.

## 2. Fase 9 — Engaño y decisiones

### Contenido ficticio

- Técnica: `Mara Voss · Soporte Nivel 2`.
- Caso: `NV-2048-AX`.
- Remitente externo: `mara.voss@soporte-nova.help`.
- Dominio oficial ficticio: `nova.local`.
- Amenaza simulada: pérdida de acceso a entregas académicas.

### Señales de alerta

Víctima puede revisar remitente, diferencia de dominio y urgencia. Cada señal se registra una vez y suma diez puntos educativos. No se registra información personal.

### Decisiones

| Decisión         | Ruta                           | Efecto                                               |
| ---------------- | ------------------------------ | ---------------------------------------------------- |
| Solucionar ahora | Continúa a permisos            | No concede permisos automáticamente                  |
| Después          | Final seguro                   | Rechaza acceso inmediato                             |
| Verificar        | Final seguro con mayor puntaje | Recomienda contactar canal oficial por cuenta propia |

Backend rechaza decisiones fuera de `decision`. La ruta segura muestra explicación útil; no bloquea ni castiga al visitante.

## 3. Fase 10 — Permisos y riesgo

### Dependencias

- Pantalla debe solicitarse primero.
- Teclado, archivos, portapapeles, micrófono y cámara requieren pantalla concedida.
- Acceso permanente requiere también teclado concedido.
- Solo puede responderse un permiso en estado `requested`.
- Las respuestas solo son válidas durante fase `permissions`.

### Naturaleza

| Permiso           | Naturaleza                        |
| ----------------- | --------------------------------- |
| Pantalla          | Real mediante herramienta externa |
| Teclado y mouse   | Real mediante herramienta externa |
| Archivos          | Simulado                          |
| Portapapeles      | Simulado                          |
| Micrófono         | Simulado; no se solicita API real |
| Cámara            | Simulado; no se solicita API real |
| Acceso permanente | Simulado; no crea persistencia    |

Cada solicitud presenta razón declarada, impacto real y botones permitir/rechazar. Barra de asistencia muestra técnico, pantalla, control y tiempo. Mapa inferior conserva historial.

### Rutas por rechazo

- Rechazar pantalla: final seguro.
- Conceder pantalla y rechazar control: revelación moderada.
- Conceder pantalla y control: permite continuar hacia conexión y posible compromiso alto.

### Riesgo narrativo

Riesgo se recalcula desde permisos concedidos en cinco ejes: privacidad, control, cuentas, archivos y recuperabilidad. Valores se etiquetan como narrativos, no medición técnica.

## 4. Fase 11 — Centro atacante

### Cabecera

- Alias ficticio y Windows como objetivo preparado.
- Identificador corto de sesión.
- índice narrativo de exposición.
- fase y estado remoto.
- parada de acceso cuando existe conexión terminable.

### Mapa de permisos

Siete nodos muestran `idle`, `requested`, `granted` o `denied`. Cada nodo incluye descripción del impacto y franja inequívoca:

- `REAL · HERRAMIENTA EXTERNA`.
- `SIMULADO · SIN ACCESO`.

### Consola contextual

Catálogo compartido y validado por servidor:

- analizar reacción;
- solicitar cada permiso;
- marcar herramienta preparada;
- confirmar pantalla compartida;
- confirmar control concedido;
- terminar acceso.

Acciones sensibles requieren confirmación. Si no existe acción válida, consola queda bloqueada con mensaje de espera. Público y víctima no pueden emitir acciones de atacante.

### Cronología y consecuencias

Panel recibe últimos seis eventos, actor, resultado y naturaleza. Medidores cambian al responder permisos. Confirmación de acción aparece como ACK dentro de consola.

## 5. Seguridad aplicada

- Validación Zod de decisión, señal y acción.
- Autorización por token/rol en servidor.
- Lista cerrada de acciones.
- Reglas de fase y dependencias ejecutadas en backend.
- Deduplicación por `eventId`.
- Sin texto libre, cargas, comandos, WebRTC, `getUserMedia` o lectura del sistema.
- Herramienta remota permanece separada; aplicación solo registra confirmaciones manuales.

## 6. Archivos principales

```text
src/
├── client/views/attacker/AttackerPanel.tsx
├── client/views/victim/VictimExperience.tsx
├── server/sockets/gateway.ts
└── shared/
    ├── attacker-actions.ts
    ├── permissions.ts
    ├── risk.ts
    ├── story.ts
    ├── schemas.ts
    └── types.ts
```

## 7. Verificación

- `npm run check`: tipos, lint, pruebas y build.
- 71 pruebas automatizadas aprobadas.
- Flujo Socket.IO real con cuatro roles.
- Verificados: señales, decisión, autorización, dependencia, riesgo inmediato y ruta moderada.
- QA visual a 1440×1000 para conversación, permiso y consola atacante.
- `git diff --check` sin errores.

## 8. Matriz de aceptación

| Criterio                                            | Estado |
| --------------------------------------------------- | ------ |
| Cada decisión conduce a ruta prevista               | Cumple |
| Rechazo activa final seguro sin detener experiencia | Cumple |
| Permisos individuales con explicación sencilla      | Cumple |
| Dependencias y fase validadas por backend           | Cumple |
| Riesgo cambia y se difunde inmediatamente           | Cumple |
| Rechazo parcial produce ruta moderada               | Cumple |
| Panel atacante muestra solo acciones contextuales   | Cumple |
| Real y simulado se diferencian explícitamente       | Cumple |
| Acciones importantes requieren confirmación         | Cumple |
| Ninguna acción accede a información real            | Cumple |

# Evidencia técnica — Fases 12, 13 y 14

## Estado

Implementadas. Este bloque añade vista pública protegida, revelación colectiva, motor seguro de efectos simulados y resumen educativo determinista.

## Fase 12 — Vista pública y revelación

### Modo misterio

- El proyector presenta una sola idea: una decisión está cambiando el resultado.
- No muestra decisión, permisos, riesgo, estado remoto, cronología ni acciones simuladas antes de `reveal`.
- El servidor transforma el estado con `toPublicSession`; ocultar datos no depende solo de CSS.
- Código de emparejamiento, participantes, identificadores, latidos y estado técnico privado quedan fuera de la proyección pública.
- HTTP y Socket.IO aplican la misma política.

### Revelación

- Entrada visual sincronizada por fase, sin temporizadores locales de dirección.
- Titular legible desde proyector, índice narrativo de exposición y flujo víctima → datos ficticios → operador.
- Comparación simultánea entre lo observado por víctima y lo obtenido al otro lado.
- Mapa completo de siete permisos con estado y naturaleza `real` o `simulated`.
- Cronología limitada visualmente a seis eventos recientes.
- Escritorio ficticio, riesgo y lección final forman una explicación causal.

### Solo lectura

Rol `audience` no dispone de eventos de mutación. Intentos de controlar fase, reloj, permisos, acciones o simulaciones terminan en `role_forbidden`.

## Fase 13 — Motor de acciones simuladas

### Catálogo

| Acción              | Duración | Efecto visible       | Acceso real |
| ------------------- | -------: | -------------------- | ----------- |
| Tomar cursor        |    1.4 s | Cursor teatral       | Ninguno     |
| Abrir carpeta       |    1.8 s | Archivos precargados | Ninguno     |
| Abrir presupuesto   |    1.9 s | Hoja ficticia        | Ninguno     |
| Escribir mensaje    |    3.0 s | Escritura teatral    | Ninguno     |
| Copiar portapapeles |    1.6 s | Indicador simulado   | Ninguno     |
| Copiar archivos     |    2.8 s | Progreso ficticio    | Ninguno     |
| Micrófono           |    1.7 s | Indicador simulado   | Ninguno     |
| Cámara              |    1.7 s | Indicador simulado   | Ninguno     |
| Inicio externo      |    2.1 s | Alerta ficticia      | Ninguno     |

### Cola autoritativa

1. Operador elige acción disponible durante `controlled` o `reveal`.
2. Interfaz explica naturaleza y exige confirmación.
3. Zod exige identificador conocido y `confirmed: true`.
4. Servidor agrega elemento `queued`.
5. Reloj interno cambia a `running` y luego `completed` usando duración del catálogo.
6. Todos los paneles reciben progreso, efecto y cronología sincronizados.

Solo una acción corre a la vez. Repeticiones no autorizadas se rechazan. Pausa, cancelación manual, cierre remoto y parada de emergencia cambian toda acción pendiente a `cancelled`.

### Garantías de seguridad

- Sin `getUserMedia`.
- Sin `FileReader` ni carga de archivos.
- Sin lectura de portapapeles.
- Sin ejecución de procesos o comandos.
- Todo contenido vive en JSX, JSON ficticio y estado temporal.
- Modo `simulated` cubre flujo completo sin herramienta remota.

## Fase 14 — Cronología, riesgo y puntuación

### Cronología

- Eventos clasificados por actor: víctima, atacante, coordinación o sistema.
- Etiquetas visibles: real, simulado y educativo.
- Identificadores de evento y deduplicación de Socket.IO evitan repeticiones críticas.
- Inicio, finalización y cancelación de simulaciones quedan registrados.

### Riesgo narrativo

- Permisos concedidos modifican privacidad, control, cuentas, archivos y recuperabilidad.
- Efectos simulados completados agregan impacto explicativo.
- Valores limitados a 0–100.
- Interfaz declara que no constituye medición ni escaneo técnico.

### Puntuación

Reglas deterministas sobre 100 puntos:

- Examinar remitente: 10.
- Verificar por canal oficial: 20.
- Rechazar acceso permanente: 20.
- Detener sesión: 20.
- Proteger cuentas desde otro equipo: 10, disponible en recuperación.
- Cerrar sesiones: 10, disponible en recuperación.
- Reportar: 10, disponible en recuperación.

Puntuación enseña sin avergonzar. Resumen final incluye resultado, momento clave, acciones logradas, oportunidades restantes, tres recomendaciones y conteo de eventos por naturaleza.

## Archivos principales

- `src/client/views/audience/AudienceExperience.tsx`
- `src/client/components/SimulatedDesktop.tsx`
- `src/client/components/ScoreSummary.tsx`
- `src/shared/public-state.ts`
- `src/shared/simulation.ts`
- `src/shared/scoring.ts`
- `src/shared/risk.ts`
- `src/server/sockets/gateway.ts`

## Verificación

- Pruebas unitarias para filtrado público.
- Pruebas de cola: alta, ejecución, finalización, pausa y cancelación.
- Pruebas de puntuación determinista y resumen idempotente.
- Validación de esquema: confirmación obligatoria y rechazo de acciones arbitrarias.
- Verificación en tiempo real con cuatro roles, filtrado público, simulación y emergencia.
- Auditoría textual de APIs prohibidas.
- `npm run check` cubre tipos, ESLint, Vitest y builds de cliente/servidor.

## Criterios de aceptación

| Criterio                                      | Estado                                    |
| --------------------------------------------- | ----------------------------------------- |
| Proyector no revela giro antes de tiempo      | Cumplido en servidor y frontend           |
| Cambio al revelar es comprensible             | Cumplido con titular, flujo y comparación |
| Flujo funciona sin herramienta remota         | Cumplido mediante escritorio ficticio     |
| Emergencia cancela cola                       | Cumplido y probado                        |
| Ninguna acción usa sensores o archivos reales | Cumplido y auditado                       |
| Cronología diferencia actor y naturaleza      | Cumplido                                  |
| Riesgo y puntuación tienen reglas             | Cumplido                                  |
| Resumen final es generado por servidor        | Cumplido                                  |

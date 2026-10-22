# Manual de contingencias

## Regla principal

Falla técnica nunca justifica ampliar permisos, improvisar con datos reales ni ocultar el control a la víctima. Si algo no es verificable: detener, pasar a simulación y continuar historia.

## Matriz de respuesta

| Incidente                | Acción inmediata                          | Continuación                                     | Responsable           |
| ------------------------ | ----------------------------------------- | ------------------------------------------------ | --------------------- |
| Windows pierde red       | Pausar reloj; cerrar control remoto       | Coordinación activa simulación; público continúa | Coordinación          |
| Mac pierde red local     | Detener herramienta externa desde Windows | Usar video + tarjetas físicas                    | Víctima/operador      |
| Socket desconectado      | Pulsar **Reintentar enlace**              | Estado se restaura desde servidor                | Operador del panel    |
| Herramienta remota falla | Confirmar cierre visible                  | Motor de simulación                              | Operador              |
| Proyector falla          | Mantener revelación oral                  | Abrir respaldo en Mac/Windows                    | Público               |
| Audio falla              | Mostrar subtítulos; continuar sin audio   | Marcar audio pendiente                           | Coordinación          |
| Navegador se congela     | Recargar una vez                          | Token restaura estado                            | Responsable del panel |
| Tiempo insuficiente      | Activar **Cierre rápido**                 | Revelación + recuperación + pregunta             | Control de tiempo     |
| Servidor cae             | Detener todo acceso real                  | Video WebM + seis tarjetas                       | Coordinación          |
| Dato personal aparece    | Parada de emergencia; retirar proyección  | Cerrar apps, informar docente, no fotografiar    | Todo el grupo         |

## Plan B sin Internet

1. Mantener Mac y Windows en router local.
2. Ejecutar paquete offline; no necesita CDN, fuentes web ni nube.
3. Usar modo `simulated`.
4. Si tampoco hay red local, abrir `public/fallback/respaldo.html` o `public/fallback/hackeado-respaldo.webm` directamente.
5. Entregar las seis tarjetas físicas desordenadas.
6. Visitantes ordenan: detener, revocar, contraseñas, sesiones, 2FA, revisar/reportar.
7. Cerrar con pregunta: “¿Cuándo comenzó realmente?”

## Parada de emergencia

Usarla ante contenido no previsto, confusión, pérdida de control, dato real, participante incómodo o duda del docente. La parada:

- termina estado remoto;
- revoca permisos activos;
- cancela simulaciones;
- pausa reloj;
- muestra estado seguro en todos los paneles.

Después: verificar herramienta externa manualmente. La app no puede cerrarla por sí sola.

## Recuperación de servicio

1. Confirmar `ended` físicamente y en coordinación.
2. Verificar cuenta ficticia y ausencia de apps personales.
3. Ejecutar reset.
4. Generar nuevos accesos.
5. Probar una ronda simulada corta.
6. Reanudar público solo si responsable técnico confirma estado seguro.

## Recursos offline

- Reproductor interactivo: `public/fallback/respaldo.html`.
- Video: `public/fallback/hackeado-respaldo.webm`.
- Checklist impreso: `docs/14-checklist-imprimible.md`.
- Guion humano: `docs/13-guion-por-integrante.md`.

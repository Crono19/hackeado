# Fase 0 — Validación académica, ética y operativa

**Proyecto:** HACKEADO — Alguien está dentro  
**Versión:** 1.0  
**Fecha:** 20 de octubre de 2026  
**Regla central:** la aplicación coordina una demostración educativa; no es una herramienta de acceso remoto, espionaje ni explotación.

## 1. Matriz de acciones

| Acción                                               | Clasificación   | Implementación                                      | Límite verificable                                                   |
| ---------------------------------------------------- | --------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Mostrar mensajes de supuesto soporte                 | Simulada        | HTML/CSS con texto ficticio                         | No contacta servicios externos                                       |
| Solicitar permisos narrativos                        | Simulada        | Botones dentro de la app                            | No modifica permisos del sistema operativo                           |
| Mostrar archivos ficticios                           | Simulada        | Recursos incluidos en `public/fake-files`           | No lee el disco del visitante                                        |
| Mostrar cámara, micrófono o portapapeles “expuestos” | Simulada        | Animación y datos preparados                        | No usa MediaDevices ni Clipboard API                                 |
| Alterar el “escritorio” de demostración              | Simulada        | Estado visual React                                 | No cambia el escritorio real                                         |
| Mover el puntero y escribir en una cuenta preparada  | Real controlada | Herramienta legítima de soporte, externa a HACKEADO | Consentimiento visible; sesión temporal y revocable                  |
| Abrir un archivo señuelo preparado                   | Real controlada | Operador sobre cuenta ficticia                      | Solo archivos del laboratorio                                        |
| Confirmar conexión/desconexión                       | Real controlada | Coordinador marca el estado manualmente             | HACKEADO no crea la conexión remota                                  |
| Capturar contraseñas o pulsaciones                   | Prohibida       | No se implementa                                    | Sin keylogger ni formularios de credenciales reales                  |
| Activar cámara o micrófono reales                    | Prohibida       | No se implementa                                    | Sin permisos del navegador o del SO                                  |
| Copiar archivos reales                               | Prohibida       | No se implementa                                    | Sin subida, descarga o exploración del disco                         |
| Ejecutar comandos del sistema                        | Prohibida       | No se implementa                                    | El servidor no usa `child_process`, shell, PowerShell ni AppleScript |
| Instalar software oculto o persistencia              | Prohibida       | No se implementa                                    | Sin instaladores, servicios ni inicio automático                     |
| Usar exploits, troyanos, spyware o BeEF              | Prohibida       | No se implementa                                    | Fuera del repositorio y de la demostración                           |
| Guardar información personal                         | Prohibida       | No se implementa                                    | Sesiones efímeras; identidades ficticias                             |

## 2. Frontera técnica

```text
HACKEADO (React + Node)
  SÍ: narrativa, estado, cronología, decisiones, temporizador y efectos ficticios
  NO: control del sistema, comandos, captura de dispositivos, credenciales o archivos

Herramienta legítima de soporte remoto (separada)
  SÍ: pantalla + puntero/teclado durante una sesión visible y consentida
  NO: acceso desatendido, persistencia, transferencia de archivos o captura oculta
```

El servidor solo atiende HTTP y Socket.IO. No posee una ruta que reciba comandos, no importa módulos para ejecutar procesos y no debe añadirse una consola del sistema. El estado `controlled` significa **confirmación narrativa/manual**, no que el servidor haya tomado control del equipo.

## 3. Marca visual obligatoria

Todas las vistas organizativas muestran una franja persistente:

```text
DEMO//CONTROLADA · DATOS 100% FICTICIOS · SIN CAPTURA REAL
```

Código visual:

- Verde ácido — `REAL CONTROLADA`: acción visible de soporte remoto, con consentimiento.
- Cian — `SIMULADA`: representación dentro de HACKEADO.
- Rojo — `PROHIBIDA`: solo se menciona para explicar el límite; nunca se ejecuta.
- No depender solo del color: cada señal incluye texto e icono.

## 4. Wireframes de las cuatro vistas

### 4.1 Víctima — Windows

```text
┌ DEMO CONTROLADA ─────────────────────────────────────────┐
│ Escritorio ficticio                 estado: SIN CONEXIÓN │
│ ┌ Archivos ┐ ┌ Mensajería de soporte ─────────────────┐ │
│ │ fotos    │ │ “Detectamos un problema. ¿Permitir?”   │ │
│ │ notas    │ │ [RECHAZAR]              [PERMITIR]     │ │
│ └──────────┘ └─────────────────────────────────────────┘ │
│ Señal visible: puedes detener la asistencia en cualquier │
│ momento.                                [DETENER ACCESO] │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Atacante/operador — Mac

```text
┌ OPS//CONSOLE · DEMO CONTROLADA ──────────────────────────┐
│ SESIÓN 7K2Q   FASE: PERMISOS   RIESGO: 42/100           │
│ Permisos             Acciones narrativas                 │
│ pantalla  PERMITIDO  [mostrar archivo ficticio] SIMULADA │
│ control   SOLICITADO [alterar interfaz]         SIMULADA │
│ cámara    SIMULADO   [control legítimo]  REAL CONTROLADA │
│ Cronología en vivo                                      │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Público — Proyector

```text
┌ ALGUIEN ESTÁ DENTRO ─────────────────────────────────────┐
│               ¿QUÉ ACABA DE ACEPTAR?                    │
│ [PANTALLA] [CONTROL] [ARCHIVOS] [MICRÓFONO]              │
│                                                          │
│ Modo revelación: LO QUE VIO / LO QUE OCURRÍA DETRÁS      │
│ Regla: una decisión pequeña puede abrir una puerta grande│
└──────────────────────────────────────────────────────────┘
```

### 4.4 Coordinación — Mac/tablet

```text
┌ CONTROL//ROOM · 14:32 ───────────────────────────────────┐
│ clientes: 4/4   remoto: confirmado   modo: híbrido       │
│ [ANTERIOR] [SIGUIENTE FASE] [PAUSA] [PARADA EMERGENCIA]  │
│ temporizador 08:12 | permisos | salud técnica | eventos  │
│ [ACTIVAR RESPALDO SIMULADO]               [REINICIAR]    │
└──────────────────────────────────────────────────────────┘
```

## 5. Topología física

```text
                     red local aislada
┌──────────────────┐       │       ┌──────────────────────┐
│ Mac operador     │───────┼───────│ Windows víctima      │
│ Node + atacante  │       │       │ navegador + cuenta   │
│ + coordinación   │       │       │ ficticia             │
└────────┬─────────┘       │       └──────────────────────┘
         │ HDMI/AirPlay    │
┌────────▼─────────┐       │       ┌──────────────────────┐
│ Proyector        │       └───────│ móvil/tablet opcional│
│ vista pública    │               │ coordinación          │
└──────────────────┘               └──────────────────────┘
```

## 6. Equipo y confirmación

| Elemento                        | Estado del diseño           | Verificación física previa                          |
| ------------------------------- | --------------------------- | --------------------------------------------------- |
| Mac atacante/servidor           | Confirmado por el alcance   | Probar Node 24, cargador y salida de video          |
| Windows víctima                 | Confirmado por el alcance   | Crear usuario local `DemoVictima`, sin datos reales |
| Proyector o TV                  | Requerido                   | Confirmar resolución 1080p, cable y adaptador       |
| Red local                       | Requerida                   | Preferir router propio sin salida a Internet        |
| Herramienta legítima de soporte | Opcional en modo híbrido    | Aprobación docente y prueba de revocación           |
| Ratón/teclado                   | Requeridos                  | Batería/cable de respaldo                           |
| Video de respaldo               | Requerido para contingencia | Guardado localmente en Mac y USB                    |
| Regleta y cinta de piso         | Requeridas                  | Evitar cables sueltos y pérdida de energía          |

### Cuenta ficticia de Windows

- Usuario local: `DemoVictima`.
- Sin correo, nube, navegador sincronizado ni contraseñas guardadas.
- Fondo y archivos creados exclusivamente para la historia.
- Historial, descargas, portapapeles y papelera limpios antes de cada jornada.
- Restauración desde una carpeta maestra o snapshot entre rondas.

## 7. Guion de validación con docente

Duración sugerida: 8 minutos.

1. Mostrar esta matriz y declarar qué nunca se ejecutará.
2. Recorrer víctima → atacante → público → coordinación.
3. Demostrar que `controlled` exige pantalla, teclado y confirmación manual.
4. Pulsar parada de emergencia y mostrar desconexión.
5. Repetir el flujo en modo completamente simulado.
6. Mostrar que toda la información es ficticia.
7. Registrar correcciones solicitadas y obtener autorización antes de usar control remoto.

## 8. Acta de aprobación

La construcción de software queda validada por pruebas automatizadas. La autorización académica y el inventario físico requieren una acción humana y no pueden certificarse desde el repositorio.

| Campo                       | Registro                                         |
| --------------------------- | ------------------------------------------------ |
| Docente                     | ______________________________                   |
| Fecha                       | ______________________________                   |
| Modalidad aprobada          | ☐ Simulada ☐ Híbrida con soporte remoto legítimo |
| Herramienta remota aprobada | ______________________________                   |
| Cambios solicitados         | ______________________________                   |
| Resultado                   | ☐ Aprobada ☐ Aprobada con cambios ☐ Pendiente    |
| Firma                       | ______________________________                   |

**Estado actual:** pendiente de revisión y firma docente. No se habilitará control remoto real antes de esta aprobación.

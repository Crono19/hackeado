# HACKEADO 1.0.0-rc.1 — Cierre de Sprint 12

## Estado

Versión candidata completa en software. Validación Node/Chromium ejecutable en Mac. Compilación, publicación y pruebas C# ejecutables en Windows. Medición 1080p/30, latencia real, snapshot, diez rondas humanas y aprobación interna requieren laboratorio físico.

No se declara terminado un requisito físico sin evidencia firmada.

## Artefactos

| Artefacto            | Generación                                                 | Contenido                                                           |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Mac offline          | `npm run package:offline`                                  | servidor compilado, cliente, dependencias, docs, scripts y respaldo |
| Windows agent        | `./scripts/windows/package-victim-host.ps1`                | aplicación self-contained, configuración ejemplo, manual y SHA-256  |
| Evidencia automática | `npm run verify:release`                                   | calidad, diez rondas automáticas, E2E y auditoría de activos        |
| Evidencia LAN        | `HACKEADO_URL=https://IP:3000 npm run verify:live-network` | HTTPS, WSS y latencia de ACK                                        |

Binarios, secretos, certificados privados, logs y configuración local quedan fuera del repositorio.

## Congelación de versión

- Web/servidor: `1.0.0-rc.1`.
- Agente: `1.0.0-rc.1`.
- Protocolo de entrada: `1`.
- DevTools: desactivado en configuración de exposición.
- Consola `/debug`: desactivada por defecto en producción.
- Agente nativo: obligatorio en arranque `start:expo`.
- Transporte live: HTTPS/WSS obligatorio.

## Producción del paquete

### Mac

```bash
npm ci
npm run verify:release
npm run package:offline
shasum -a 256 release/HACKEADO-offline-1.0.0-rc.1-macos.tar.gz
```

### Windows

```powershell
./scripts/windows/package-victim-host.ps1
Get-FileHash release/windows-agent/HACKEADO-VictimHost-1.0.0-rc.1-win-x64.zip -Algorithm SHA256
```

Copiar `agent-config.example.json` como `agent-config.json` al lado del ejecutable y completar localmente. Nunca introducir secreto en ZIP.

## Ensayo cronometrado

| Bloque                |  Meta |
| --------------------- | ----: |
| Pitch + identidad     |  1:20 |
| Engaño + decisión     |  2:00 |
| Pantalla + control    |  2:00 |
| Control real          |  1:30 |
| Revelación + teoría   |  2:30 |
| Consecuencias         |  1:10 |
| Recuperación          |  2:30 |
| Prevención + pregunta |  1:30 |
| Margen/reset          |  0:30 |
| Total                 | 15:00 |

Ensayar rutas segura, moderada, comprometida y contingencia. Intercambiar operador, víctima técnica, coordinación y narrador hasta que todos ejecuten parada y recuperación.

## Registro de diez rondas físicas

|   # | Operador | Ruta | Duración | Vídeo/FPS | Latencia | Parada probada | Reset | Resultado |
| --: | -------- | ---- | -------: | --------- | -------: | -------------- | ----: | --------- |
|   1 |          |      |          |           |          | Víctima        |       |           |
|   2 |          |      |          |           |          | Atacante       |       |           |
|   3 |          |      |          |           |          | Coordinación   |       |           |
|   4 |          |      |          |           |          | Hotkey         |       |           |
|   5 |          |      |          |           |          | Víctima        |       |           |
|   6 |          |      |          |           |          | Atacante       |       |           |
|   7 |          |      |          |           |          | Coordinación   |       |           |
|   8 |          |      |          |           |          | Hotkey         |       |           |
|   9 |          |      |          |           |          | Víctima        |       |           |
|  10 |          |      |          |           |          | Emergencia     |       |           |

Aceptar solo si:

- diez rondas terminan sin input residual;
- cada ronda dura máximo 15 minutos;
- reset completo queda debajo de dos minutos;
- 1080p/30 es estable o 720p resulta legible;
- latencia permite clic y escritura controlables;
- las cuatro paradas funcionan;
- todo el grupo aprueba demostración.

## Acta física

| Campo                 | Valor     |
| --------------------- | --------- |
| Fecha/lugar           | Pendiente |
| Mac/IP                | Pendiente |
| VM/host/hipervisor    | Pendiente |
| Snapshot              | Pendiente |
| Router/cable respaldo | Pendiente |
| SHA-256 Mac           | Pendiente |
| SHA-256 Windows       | Pendiente |
| Diez rondas           | Pendiente |
| Aprobación interna    | Pendiente |
| Aprobación docente    | Pendiente |

Firmas: Coordinación __________ · Operador __________ · Seguridad __________ · Docente __________

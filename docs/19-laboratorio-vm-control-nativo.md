# HACKEADO — Preparación del laboratorio Windows

> Evidencia de Sprint 0 del plan `18-sprints-control-remoto-nativo.md`.

## Estado

- Artefactos de preparación: completos.
- Script de auditoría y preparación: completo.
- Configuración ejemplo del agente: completa.
- VM física: requiere ejecución y firma en el equipo Windows elegido.
- Aprobación docente del nuevo alcance: requiere firma externa.

El repositorio no puede demostrar por sí solo el estado de una VM externa. Por eso Sprint 0 separa artefactos reproducibles de evidencia física.

## Decisiones cerradas

- Víctima oficial: Windows 11.
- Usuario de demostración: `VictimaDemo`.
- Agente: aplicación visible, sin servicio y sin autoarranque.
- Mac: servidor y panel Atacante.
- Datos: exclusivamente ficticios.
- Control: sesión gráfica estándar; sin UAC ni elevación.
- Red: privada, sin puertos publicados a Internet.

## Preparación

Dentro de la VM, abrir PowerShell y ejecutar primero auditoría sin cambios:

```powershell
cd C:\HACKEADO-SOURCE\hackeado
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\windows\prepare-demo-vm.ps1
```

Revisar lista. Luego aplicar:

```powershell
.\scripts\windows\prepare-demo-vm.ps1 -Apply
```

Validar:

```powershell
.\scripts\windows\verify-demo-vm.ps1
```

## Checklist manual obligatorio

- [ ] Windows 11 actualizado.
- [ ] Sesión iniciada como `VictimaDemo`.
- [ ] `VictimaDemo` no pertenece a Administradores.
- [ ] No existe cuenta personal de Microsoft.
- [ ] OneDrive, Dropbox y Google Drive cerrados.
- [ ] Navegadores sin perfiles personales.
- [ ] Gestores de contraseñas cerrados o ausentes.
- [ ] Carpetas compartidas host–guest desactivadas.
- [ ] Portapapeles compartido del hipervisor desactivado.
- [ ] Drag-and-drop host–guest desactivado.
- [ ] USB passthrough innecesario desactivado.
- [ ] Red privada configurada.
- [ ] No existen reglas de port forwarding hacia Internet.
- [ ] Resolución 1920 × 1080.
- [ ] Escala 100% o 125%.
- [ ] `C:\HACKEADO-DEMO` contiene solo datos ficticios.
- [ ] Snapshot limpio creado.
- [ ] Copia secundaria de VM disponible.
- [ ] Restauración del snapshot probada.
- [ ] Docente informó y aprobó alcance.

## Configuración local

Desde la raíz `C:\HACKEADO-SOURCE\hackeado`, copiar `config/windows-agent.example.json` a:

```text
C:\HACKEADO-SOURCE\hackeado\config\windows-agent.local.json
```

Cambiar:

- URL del servidor Mac.
- Identificador del dispositivo.
- Clave aleatoria de al menos 32 caracteres.

El archivo local está excluido por `.gitignore`.

## Evidencia para cerrar Sprint 0

Guardar fuera del repositorio:

1. Captura de `winver`.
2. Captura de tipo de cuenta estándar.
3. Salida completa de `verify-demo-vm.ps1`.
4. Captura de ajustes del hipervisor.
5. Nombre y fecha de la instantánea.
6. Resultado de restauración.
7. Aprobación del docente.

## Acta

| Campo               | Valor     |
| ------------------- | --------- |
| Hipervisor          | Pendiente |
| Equipo anfitrión    | Pendiente |
| Modo de red         | Pendiente |
| Nombre del snapshot | Pendiente |
| Fecha de validación | Pendiente |
| Responsable         | Pendiente |
| Docente aprobó      | Pendiente |

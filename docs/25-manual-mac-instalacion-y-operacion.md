# Manual completo de Mac — HACKEADO servidor y cabina Atacante

## Propósito

Este manual prepara una Mac como servidor central, cabina Atacante y centro de Coordinación de HACKEADO. Empieza desde la comprobación del sistema y termina con una ronda real contra Victim Host en Windows.

La Mac aloja:

- servidor HTTPS y WebSocket seguro;
- señalización WebRTC;
- estado autoritativo de la experiencia;
- panel Atacante;
- panel Coordinación;
- vista Público para el proyector;
- preflight, pruebas y paquete offline.

## Resultado esperado

Al terminar tendrás:

- Node.js 24 y npm operativos;
- dependencias exactas instaladas;
- certificado TLS válido para la IP privada de la Mac;
- secreto temporal compartido con un único agente Windows autorizado;
- servidor accesible por HTTPS desde Windows;
- paneles sincronizados;
- video WebRTC y control nativo consentido;
- paquete offline y evidencia automática de diez rondas.

## Límites obligatorios

- Usa una red privada controlada.
- No publiques el puerto `3000` a Internet.
- No configures port forwarding en el router.
- No subas `.env`, certificados, claves o paquetes compilados a Git.
- No compartas `rootCA-key.pem`.
- Utiliza únicamente datos ficticios en Windows.
- Mantén siempre disponible la parada total.
- El modo real se usa solo contra el Windows autorizado.

---

# Parte 1 — Preparar macOS

## Paso 1. Conectar alimentación y red

1. Conecta la Mac a corriente.
2. Conéctala al router privado que usarán Windows y el proyector.
3. Si es posible, usa Ethernet para la Mac.
4. Si usas Wi-Fi, evita cambiar de red durante el ensayo.
5. No utilices una VPN durante la prueba local.

La IP incluida en el certificado debe permanecer estable. La mejor opción es reservar la IP de la Mac desde DHCP en el router.

## Paso 2. Crear un usuario de exposición — recomendado

Para evitar notificaciones y archivos personales:

1. Abre **Configuración del Sistema**.
2. Entra a **Usuarios y grupos**.
3. Crea un usuario estándar llamado `HackeadoExpo`.
4. No conectes iCloud, Mail, Mensajes o cuentas personales.
5. Utiliza esta cuenta durante los ensayos y la exposición.

Si continuarás usando tu cuenta habitual:

- cierra Mail, Mensajes, WhatsApp, Slack y aplicaciones personales;
- activa **No molestar**;
- limpia el escritorio;
- cierra pestañas personales;
- desactiva vistas previas de notificaciones.

## Paso 3. Evitar reposo durante una ronda

En una terminal separada puedes ejecutar:

```bash
caffeinate -dimsu
```

Mantén esa terminal abierta durante la exposición. Para detenerlo pulsa `Control + C`.

---

# Parte 2 — Abrir el proyecto

## Paso 4. Abrir Terminal

Puedes abrirla desde:

```text
Aplicaciones → Utilidades → Terminal
```

## Paso 5. Entrar al repositorio

```bash
cd /Users/pablo/Documents/GitHub/hackeado
```

Comprueba la ruta:

```bash
pwd
```

Debe devolver:

```text
/Users/pablo/Documents/GitHub/hackeado
```

Comprueba archivos esenciales:

```bash
test -f package.json && echo "package.json OK"
test -f .nvmrc && echo ".nvmrc OK"
test -f scripts/start-expo.sh && echo "start-expo OK"
```

---

# Parte 3 — Instalar Node.js 24

El proyecto declara Node 24 en `.nvmrc` y en `package.json`. La versión oficial actual puede descargarse desde la [página oficial de Node.js](https://nodejs.org/en/download).

## Paso 6. Comprobar versiones

```bash
node --version
npm --version
```

El resultado de Node debe comenzar con:

```text
v24.
```

## Paso 7A. Si ya utilizas NVM

Desde la raíz del proyecto:

```bash
nvm install
nvm use
node --version
```

El archivo `.nvmrc` contiene `24`, por lo que NVM seleccionará esa rama.

## Paso 7B. Si no utilizas NVM

1. Entra a la [descarga oficial de Node.js](https://nodejs.org/en/download).
2. Selecciona Node.js 24 LTS.
3. Descarga el instalador de macOS correspondiente a Apple Silicon o Intel.
4. Ejecuta el paquete `.pkg`.
5. Cierra y vuelve a abrir Terminal.
6. Ejecuta:

   ```bash
   node --version
   npm --version
   ```

No continúes si Node no muestra `v24.x.x`.

## Paso 8. Si `node` no se reconoce después de instalarlo

Comprueba:

```bash
which node
echo "$PATH"
```

Después cierra Terminal completamente y abre una nueva ventana. Si usas NVM, ejecuta otra vez:

```bash
nvm use
```

---

# Parte 4 — Instalar dependencias y validar el repositorio

## Paso 9. Instalar dependencias exactas

```bash
npm ci
```

Se usa `npm ci` porque respeta las versiones registradas en `package-lock.json`.

## Paso 10. Ejecutar el preflight completo

```bash
npm run verify:release
```

Este comando ejecuta:

1. comprobación de tipos;
2. ESLint;
3. pruebas unitarias e integración;
4. build de cliente y servidor;
5. servidor aislado;
6. diez rondas automáticas;
7. E2E Chromium de desktop y móvil;
8. auditoría de activos y configuración.

El resultado correcto termina con:

```text
HACKEADO RC // PREFLIGHT PASS
```

No pases al modo real si el preflight termina en error.

---

# Parte 5 — Identificar y estabilizar la IP

## Paso 11. Identificar la interfaz de red

```bash
networksetup -listallhardwareports
```

Busca el dispositivo asociado a Wi-Fi o Ethernet. Habitualmente Wi-Fi es `en0`, pero debes verificarlo.

## Paso 12. Consultar la IP

Para `en0`:

```bash
ipconfig getifaddr en0
```

Ejemplo:

```text
192.168.1.50
```

En este manual se utilizará:

```text
IP_DE_LA_MAC=192.168.1.50
```

No escribas literalmente `IP_DE_LA_MAC` en `.env`: coloca la dirección real.

## Paso 13. Confirmar que es una IP privada

Las formas habituales son:

- `10.x.x.x`;
- `172.16.x.x` a `172.31.x.x`;
- `192.168.x.x`.

No uses una IP pública ni configures exposición a Internet.

## Paso 14. Evitar cambios de IP

Recomendado:

1. abre la administración del router privado;
2. busca **DHCP Reservation**, **Static Lease** o equivalente;
3. reserva la IP para la dirección MAC de la Mac;
4. desconecta y reconecta;
5. confirma con `ipconfig getifaddr`.

Si la IP cambia después de generar el certificado, debes repetir las Partes 7, 8 y 9 de este manual y actualizar Windows.

---

# Parte 6 — Instalar Homebrew y mkcert

## Paso 15. Comprobar Homebrew

```bash
brew --version
```

Si no existe, instálalo siguiendo las instrucciones actuales de la [documentación oficial de Homebrew](https://docs.brew.sh/Installation). Al finalizar, ejecuta las instrucciones `brew shellenv` que muestre el instalador y abre una terminal nueva.

## Paso 16. Instalar mkcert

```bash
brew install mkcert
```

La instalación mediante Homebrew es el método documentado por el [proyecto oficial de mkcert](https://github.com/FiloSottile/mkcert).

Comprueba:

```bash
mkcert -version
```

## Paso 17. Instalar la autoridad local en la Mac

```bash
mkcert -install
```

macOS puede pedir la contraseña del usuario para modificar el llavero.

---

# Parte 7 — Generar el certificado HTTPS

## Paso 18. Crear el directorio local

Desde la raíz del proyecto:

```bash
mkdir -p certs
```

## Paso 19. Generar certificado para la IP actual

Sustituye `192.168.1.50` por la IP real:

```bash
mkcert \
  -cert-file certs/hackeado-demo.crt \
  -key-file certs/hackeado-demo.key \
  192.168.1.50 localhost 127.0.0.1
```

Comprueba los archivos:

```bash
ls -lh certs/hackeado-demo.crt certs/hackeado-demo.key
```

Estos archivos son locales y no deben versionarse.

## Paso 20. Encontrar la autoridad raíz

```bash
mkcert -CAROOT
```

En esta Mac devuelve:

```text
/Users/pablo/Library/Application Support/mkcert
```

## Paso 21. Copiar únicamente el certificado público

```bash
cp "$(mkcert -CAROOT)/rootCA.pem" "$HOME/Desktop/HACKEADO-rootCA.pem"
```

Comprueba:

```bash
ls -lh "$HOME/Desktop/HACKEADO-rootCA.pem"
```

Copia `HACKEADO-rootCA.pem` a Windows siguiendo el manual de Windows.

> `rootCA-key.pem` permite emitir certificados confiables y no debe compartirse. El propio proyecto mkcert advierte que esa clave otorga capacidad de interceptar tráfico confiado por los equipos donde se instale la CA.

---

# Parte 8 — Crear el secreto del agente

## Paso 22. Generar una clave aleatoria

```bash
openssl rand -hex 32
```

Ejemplo de formato:

```text
3f9348f981a9c28d702fa2a593d47e5913a0b88933cde2f286948065ab871e26
```

No reutilices el ejemplo. Guarda temporalmente la clave generada.

Debe colocarse exactamente en:

- `DEMO_AGENT_KEY` del `.env` de la Mac;
- `agentKey` de `agent-config.json` en Windows.

No la envíes por correo ni la muestres al público.

---

# Parte 9 — Configurar `.env`

## Paso 23. Crear la configuración

Desde la raíz del proyecto:

```bash
cp .env.expo.example .env
```

Abre el archivo:

```bash
nano .env
```

## Paso 24. Completar valores

Usando `192.168.1.50` como ejemplo:

```dotenv
HOST=0.0.0.0
PORT=3000
CLIENT_ORIGIN=https://192.168.1.50:3000
SESSION_TTL_MINUTES=30

VITE_SERVER_URL=
VITE_ENABLE_DEBUG_UI=false
ENABLE_DEBUG_UI=false

DEMO_DEVICE_ID=hackeado-windows-vm
DEMO_AGENT_KEY=COLOCA_AQUI_LA_CLAVE_GENERADA
CONTROL_LEASE_SECONDS=15
AGENT_HEARTBEAT_MS=3000
REQUIRE_NATIVE_AGENT=true

TLS_CERT_PATH=certs/hackeado-demo.crt
TLS_KEY_PATH=certs/hackeado-demo.key
```

En Nano:

1. pulsa `Control + O`;
2. pulsa Enter;
3. pulsa `Control + X`.

## Paso 25. Comprobar sin imprimir el secreto

```bash
test -f .env && echo ".env OK"
test -f certs/hackeado-demo.crt && echo "certificado OK"
test -f certs/hackeado-demo.key && echo "clave TLS OK"
```

No uses `cat .env` durante una presentación o grabación.

## Paso 26. Configurar Windows con los mismos valores

En `agent-config.json` de Windows:

```json
{
  "serverUrl": "https://192.168.1.50:3000",
  "deviceId": "hackeado-windows-vm",
  "agentKey": "LA_MISMA_CLAVE_DE_DEMO_AGENT_KEY",
  "displayName": "VM Windows 11 — VictimaDemo",
  "emergencyHotkey": "Ctrl+Shift+F12",
  "allowDevTools": false
}
```

La IP, `deviceId` y clave deben coincidir exactamente.

---

# Parte 10 — Compilar y arrancar el servidor

## Paso 27. Crear el build

```bash
npm run build
```

Debe compilar:

- `dist/client`;
- `dist/server`.

## Paso 28. Iniciar modo exposición

```bash
npm run start:expo
```

La consola comprobará automáticamente:

- presencia de `.env`;
- dependencias instaladas;
- build disponible;
- certificado y clave TLS;
- origen HTTPS;
- clave del agente no vacía ni de ejemplo;
- agente nativo obligatorio.

El resultado esperado incluye:

```text
HACKEADO // EXPO RC ARMED
en0: https://192.168.1.50:3000
Native agent required · TLS active · debug UI disabled by default
HACKEADO server running on https://0.0.0.0:3000
```

No cierres esa terminal.

## Paso 29. Autorizar firewall de macOS

Si macOS pregunta si Node puede aceptar conexiones entrantes, pulsa **Permitir**.

Si Windows no puede conectar:

1. abre **Configuración del Sistema**;
2. entra a **Red → Firewall**;
3. abre **Opciones**;
4. confirma que Node tenga conexiones entrantes permitidas;
5. no actives **Bloquear todas las conexiones entrantes** durante la demostración.

Apple documenta el control por aplicación en su [guía oficial del firewall de macOS](https://support.apple.com/en-ie/guide/mac-help/mh34041/mac).

## Paso 30. Probar salud desde la Mac

Abre otra terminal:

```bash
curl https://192.168.1.50:3000/api/health
```

Debe aparecer una respuesta con:

```json
{
  "status": "ok",
  "service": "hackeado-server",
  "version": "1.0.0-rc.1",
  "release": "EXPO RC"
}
```

---

# Parte 11 — Validar la red live

## Paso 31. Probar HTTPS y WSS

Con el servidor activo, abre otra terminal:

```bash
cd /Users/pablo/Documents/GitHub/hackeado
HACKEADO_URL=https://192.168.1.50:3000 npm run verify:live-network
```

Resultado esperado:

```text
LIVE NETWORK // PASS
HTTPS ...ms · WSS connect ...ms · ACK ...ms
```

Si el ACK supera `150 ms`, el script mostrará una advertencia. Prueba el control físico antes de aceptar esa red para la exposición.

## Paso 32. Probar desde Windows

En Windows:

```powershell
Test-NetConnection 192.168.1.50 -Port 3000
Invoke-WebRequest https://192.168.1.50:3000/api/health
```

No continúes hasta que Windows conecte sin advertencia TLS.

---

# Parte 12 — Preparar los paneles de la Mac

## Paso 33. Elegir navegador

Usa preferiblemente Chrome o Edge. La suite E2E actual se ejecuta con Chromium.

Evita mezclar hosts. Abre todas las vistas con la misma dirección exacta:

```text
https://192.168.1.50:3000/coordinacion
https://192.168.1.50:3000/atacante
https://192.168.1.50:3000/publico
```

No abras unas pestañas con `localhost` y otras con la IP.

## Paso 34. Distribuir pantallas

Configuración recomendada:

- pantalla principal de la Mac: Atacante;
- ventana secundaria pequeña: Coordinación;
- proyector o segundo monitor: Público;
- Windows o VM: Víctima.

Si solo tienes una pantalla en la Mac:

1. coloca Atacante a la izquierda;
2. Coordinación a la derecha;
3. envía Público al proyector como ventana separada;
4. usa `Control + Tab` solamente durante preparación, no durante la acción de control.

## Paso 35. Preparar navegador

1. Cierra pestañas personales.
2. Desactiva extensiones que modifiquen páginas.
3. Ajusta zoom a 100 %.
4. No abras DevTools durante la exposición.
5. Comprueba que el proyector no duplica accidentalmente secretos o Coordinación.

---

# Parte 13 — Crear y conectar una sesión

## Paso 36. Arrancar Windows primero

Antes de crear la sesión:

1. abre Victim Host en Windows;
2. confirma `BRIDGE://READY`;
3. deja visible el formulario de código.

## Paso 37. Crear sesión live

En Coordinación:

1. selecciona **REMOTO REAL**;
2. pulsa **Crear sesión segura**;
3. conserva visible el código de seis dígitos;
4. no pulses todavía **Iniciar sesión**.

## Paso 38. Solicitar roles

1. En Windows introduce el código y pulsa **Solicitar acceso**.
2. En Atacante introduce el mismo código y pulsa **Solicitar acceso**.
3. En Público introduce el mismo código y pulsa **Solicitar acceso**.

## Paso 39. Aprobar roles

En Coordinación aprueba:

1. Víctima;
2. Atacante;
3. Público.

Espera a ver:

```text
Coordinación: EN LÍNEA
Víctima: EN LÍNEA
Atacante: EN LÍNEA
Público: EN LÍNEA
Agente Windows: online
```

Si el agente sigue `offline`, no inicies la ronda.

---

# Parte 14 — Operar la demostración desde la Mac

## Paso 40. Iniciar sesión

En Coordinación pulsa:

```text
▶ Iniciar sesión
```

Coordinación observa, controla tiempo y mantiene la parada. No dirige manualmente escenas.

## Paso 41. Esperar decisión de la Víctima

Windows debe completar:

```text
Elegir identidad
→ Entrar al escritorio
→ Revisar mensaje
→ Solucionar ahora
```

En Atacante verás cambiar la fase y aparecer acciones permitidas.

## Paso 42. Solicitar pantalla

En Atacante:

1. abre **ACCIONES DE ESCENA** si está contraído;
2. pulsa **Solicitar pantalla**;
3. espera el ACK;
4. no pulses repetidamente.

Windows debe permitir y elegir pantalla completa.

## Paso 43. Confirmar video

Atacante debe mostrar:

```text
SOLO VISTA
ESCRITORIO EN VIVO
```

Comprueba la telemetría:

- resolución ideal `1920×1080`;
- objetivo cercano a `30 FPS`;
- paquetes perdidos bajos;
- RTT estable;
- estado de calidad `OPTIMAL` o `ADAPTED`.

Si aparece `DEGRADED`, continúa solo si texto y cursor siguen siendo legibles. Si no, usa Ethernet, acerca equipos al router o baja carga de la red.

## Paso 44. Solicitar control

En el pie del visor Atacante:

1. pulsa **Solicitar control**;
2. espera que Windows acepte;
3. observa la cuenta regresiva **Armando en 3…**;
4. cuando esté habilitado, pulsa **Activar control**;
5. haz clic dentro del video para capturar teclado.

El estado debe mostrar:

```text
CONTROL ACTIVO
```

## Paso 45. Ejecutar el guion permitido

Acciones recomendadas:

1. mover cursor;
2. abrir Inicio;
3. abrir Bloc de notas;
4. escribir un mensaje educativo;
5. abrir Explorador;
6. navegar a `C:\HACKEADO-DEMO`;
7. abrir un archivo ficticio;
8. renombrar un archivo ficticio;
9. cambiar ventana con Alt+Tab.

No intentes:

- abrir Terminal, PowerShell o CMD en Windows;
- aceptar UAC;
- acceder a cuentas o contraseñas;
- abrir rutas con información real;
- transferir archivos;
- instalar software;
- ocultar el overlay de control.

## Paso 46. Liberar teclado local de la Mac

El visor muestra el atajo local de liberación. Úsalo si el teclado queda capturado por el video. También puedes hacer clic fuera del visor.

## Paso 47. Ejecutar Revelación

En Atacante pulsa:

```text
Revelación
```

El sistema debe:

1. revocar el lease de entrada;
2. liberar teclas y botones presionados;
3. terminar el medio WebRTC;
4. cambiar a la explicación educativa.

En Coordinación confirma:

```text
Vídeo WebRTC: ended
Entrada remota: revoked
```

## Paso 48. Acompañar recuperación

Windows pulsa **Empezar recuperación** y completa el reto. Público puede ayudar a ordenar los pasos.

Coordinación permanece como failsafe y no debe cambiar escenas manualmente.

---

# Parte 15 — Paradas desde la Mac

## Paso 49. Liberación normal desde Atacante

Pulsa:

```text
Liberar control
```

Esto termina entrada sin depender de la Víctima.

## Paso 50. Parada total desde Atacante

Pulsa:

```text
PARADA TOTAL
```

Úsala cuando control, video o estado no coincidan con el guion.

## Paso 51. Parada total desde Coordinación

1. pulsa **PARADA TOTAL**;
2. confirma **Confirmar parada total**.

Debe revocar entrada, terminar video y pausar el reloj.

## Paso 52. Parada del servidor

Como último recurso, en la terminal donde corre `start:expo` pulsa:

```text
Control + C
```

Victim Host tiene watchdog y debe liberar entrada al perder el servidor.

Después de cualquier parada verifica físicamente que Windows recuperó mouse y teclado.

---

# Parte 16 — Finalizar y reiniciar una ronda

## Paso 53. Confirmar estado seguro

Antes de reiniciar:

```text
Agente Windows: online u offline controlado
Vídeo WebRTC: ended
Entrada remota: revoked
```

## Paso 54. Reiniciar desde Coordinación

1. pulsa **↺ Reiniciar**;
2. confirma **Reiniciar y rotar accesos**;
3. comprueba que el código cambió;
4. vuelve a conectar roles.

El botón está bloqueado mientras exista una sesión remota activa.

## Paso 55. Restaurar Windows

Pide al operador Windows:

1. cerrar Victim Host;
2. restaurar archivos o snapshot;
3. iniciar otra vez como `VictimaDemo`;
4. abrir Victim Host.

Meta de reset completo: menos de dos minutos.

---

# Parte 17 — Crear el paquete offline de Mac

## Paso 56. Generar paquete

Desde el repositorio:

```bash
npm run package:offline
```

Se generarán:

```text
release/HACKEADO-offline-1.0.0-rc.1-macos.tar.gz
release/HACKEADO-offline-1.0.0-rc.1-macos.tar.gz.sha256
```

El paquete contiene:

- cliente y servidor compilados;
- dependencias de producción;
- documentación;
- scripts;
- escenarios;
- configuración ejemplo;
- respaldo audiovisual.

No contiene `.env`, certificados privados ni secretos.

## Paso 57. Verificar hash

```bash
cd release
shasum -a 256 -c HACKEADO-offline-1.0.0-rc.1-macos.tar.gz.sha256
cd ..
```

Resultado esperado:

```text
HACKEADO-offline-1.0.0-rc.1-macos.tar.gz: OK
```

## Paso 58. Probar el paquete offline

En una carpeta temporal de ensayo:

```bash
mkdir -p /tmp/hackeado-offline-test
tar -xzf release/HACKEADO-offline-1.0.0-rc.1-macos.tar.gz -C /tmp/hackeado-offline-test
cd /tmp/hackeado-offline-test/HACKEADO
```

Antes de arrancarlo debes crear `.env` y proporcionar certificados locales válidos. No copies secretos dentro del archivo comprimido.

---

# Parte 18 — Rutina corta para cada ensayo

Después de completar la instalación inicial:

## Terminal 1 — evitar reposo

```bash
caffeinate -dimsu
```

## Terminal 2 — servidor

```bash
cd /Users/pablo/Documents/GitHub/hackeado
nvm use 2>/dev/null || true
npm run start:expo
```

## Terminal 3 — validación previa

```bash
cd /Users/pablo/Documents/GitHub/hackeado
HACKEADO_URL=https://IP-DE-LA-MAC:3000 npm run verify:live-network
```

## Navegador

```text
https://IP-DE-LA-MAC:3000/coordinacion
https://IP-DE-LA-MAC:3000/atacante
https://IP-DE-LA-MAC:3000/publico
```

Después:

1. confirmar Victim Host abierto;
2. crear sesión REMOTO REAL;
3. conectar y aprobar roles;
4. confirmar agente `online`;
5. iniciar sesión;
6. solicitar pantalla;
7. solicitar control;
8. ejecutar guion;
9. Revelación;
10. recuperación;
11. reset.

---

# Parte 19 — Cierre diario

## Paso 59. Detener todo

1. Ejecuta parada total.
2. Confirma que Windows recuperó control.
3. Cierra Victim Host.
4. Pulsa `Control + C` en `start:expo`.
5. Pulsa `Control + C` en `caffeinate`.
6. Cierra paneles del navegador.

## Paso 60. Retirar material sensible

Después de la exposición, mueve fuera del equipo de presentación o elimina de forma controlada:

- `.env`;
- `certs/hackeado-demo.key`;
- copias de `agent-config.json`;
- logs operativos;
- copias temporales del certificado en Escritorio.

No elimines archivos sin respaldo si todavía habrá más ensayos. Conserva secretos en un medio seguro y no versionado.

## Paso 61. Restaurar el laboratorio

1. Restaura snapshot Windows.
2. Retira el certificado de la VM cuando termine definitivamente la actividad.
3. Apaga el router privado.
4. Registra fallos, latencia y resultado.

---

# Parte 20 — Diagnóstico de errores en Mac

## `node` no se reconoce

Instala Node 24 o activa NVM:

```bash
nvm install
nvm use
```

## Versión incorrecta de Node

```bash
cat .nvmrc
nvm use
node --version
```

Debe usar la rama 24.

## `npm ci` falla

Comprueba:

```bash
node --version
npm --version
npm cache verify
```

No borres `package-lock.json`. Revisa conexión y vuelve a ejecutar `npm ci`.

## `expo_config_missing_*`

Falta una variable requerida en `.env`. Compara con `.env.expo.example`.

## `expo_tls_file_missing`

Las rutas de:

```dotenv
TLS_CERT_PATH=
TLS_KEY_PATH=
```

no existen o no se ejecutó el comando desde la raíz del proyecto.

## `expo_agent_key_weak_or_placeholder`

Genera una clave real:

```bash
openssl rand -hex 32
```

Sustituye completamente el valor de ejemplo.

## `expo_origins_must_use_https`

`CLIENT_ORIGIN` debe ser exactamente:

```dotenv
CLIENT_ORIGIN=https://IP-DE-LA-MAC:3000
```

## `EADDRINUSE` o puerto 3000 ocupado

Identifica el proceso:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Si corresponde a una instancia anterior de HACKEADO, vuelve a su terminal y pulsa `Control + C`. No mates procesos desconocidos.

## `curl` muestra error de certificado

1. confirma `mkcert -install`;
2. confirma que usas la IP incluida al generar el certificado;
3. regenera el certificado si cambió la IP;
4. reinicia navegador y servidor.

## Windows no conecta al puerto 3000

1. confirma `npm run start:expo` activo;
2. revisa la IP;
3. permite Node en el firewall de macOS;
4. confirma que la red no tenga aislamiento de clientes;
5. comprueba que Mac y Windows usan la misma subred.

## `verify:live-network` falla por HTTPS

Comprueba que la variable incluya protocolo y puerto:

```bash
HACKEADO_URL=https://192.168.1.50:3000 npm run verify:live-network
```

## `verify:live-network` falla por WSS

Revisa:

- `CLIENT_ORIGIN`;
- firewall;
- proxy o VPN;
- certificado;
- que navegador y verificador usen la misma IP.

## Agente Windows `offline`

Compara sin mostrar públicamente:

- `DEMO_DEVICE_ID` con `deviceId`;
- `DEMO_AGENT_KEY` con `agentKey`;
- `CLIENT_ORIGIN` con `serverUrl`;
- IP y puerto;
- certificado confiado en Windows.

El agente se registra después de que la Víctima entra a la sesión aprobada dentro de Victim Host.

## Atacante no recibe video

Verifica este orden:

```text
Víctima aprobada
→ Solucionar ahora
→ Atacante solicita pantalla
→ Víctima permite
→ Víctima pulsa Elegir pantalla completa
→ selecciona monitor completo
```

## Video visible pero control ausente

```text
Atacante solicita control
→ Víctima permite por esta sesión
→ termina cuenta regresiva
→ Atacante activa control
→ clic dentro del video
```

## `ERROR // action_rejected`

No fuerces el botón. Alguna acción está fuera de fase. Sigue:

```text
Solucionar ahora
→ Solicitar pantalla
→ Permitir pantalla
→ Compartir monitor
→ Solicitar control
→ Permitir control
→ Activar control
→ Revelación
```

## No permite reiniciar

Primero pulsa:

- **Revelación**;
- **Liberar control**; o
- **PARADA TOTAL**.

Espera `media: ended` e `input: revoked`.

## Pestañas conservan una sesión anterior

1. pulsa **Salir localmente** en cada panel;
2. recarga;
3. crea una sesión nueva;
4. vuelve a ingresar el código.

No reutilices tokens de una ronda reiniciada.

---

# Checklist final de Mac

- [ ] Mac conectada a corriente.
- [ ] Red privada activa.
- [ ] IP reservada y confirmada.
- [ ] Node 24 activo.
- [ ] `npm ci` completado.
- [ ] `npm run verify:release` aprobado.
- [ ] mkcert instalado.
- [ ] CA local instalada en macOS.
- [ ] Certificado incluye IP actual.
- [ ] `rootCA.pem` copiado a Windows.
- [ ] `rootCA-key.pem` nunca compartido.
- [ ] `.env` completo y no versionado.
- [ ] Clave de agente idéntica en Mac y Windows.
- [ ] `npm run start:expo` activo.
- [ ] Node permitido en firewall privado.
- [ ] Health responde por HTTPS.
- [ ] `verify:live-network` aprobado.
- [ ] Coordinación abierta.
- [ ] Atacante abierto.
- [ ] Público en proyector.
- [ ] Agente Windows `online`.
- [ ] Video WebRTC legible.
- [ ] Control requiere doble consentimiento.
- [ ] Parada Atacante probada.
- [ ] Parada Coordinación probada.
- [ ] Parada Windows probada.
- [ ] Paquete offline y SHA-256 disponibles.
- [ ] Operadores conocen el orden de botones.

## Documentos relacionados

- [Manual general de operación](11-manual-de-operacion.md)
- [Manual de contingencias](12-manual-de-contingencias.md)
- [Checklist imprimible](14-checklist-imprimible.md)
- [Especificación de control remoto nativo](17-especificacion-control-remoto-nativo.md)
- [Cierre de Release Candidate](23-release-candidate-sprint-12.md)
- [Manual completo de Windows](24-manual-windows-instalacion-y-ejecucion.md)

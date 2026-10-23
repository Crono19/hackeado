# HACKEADO — Manual completo de presentación

## 1. Propósito del manual

Este documento define cómo preparar, presentar, operar y cerrar la estación **HACKEADO — “Alguien está dentro”**. Está diseñado para que los ocho integrantes puedan ejecutar la experiencia completa, cubrir todos los requisitos de la universidad y reaccionar ante decisiones inesperadas o fallas técnicas.

Debe utilizarse junto con:

- `01-especificacion-maestra-hackeado.md`, que describe la aplicación.
- `02-plan-de-desarrollo-por-fases.md`, que organiza su construcción.

Este manual prioriza la experiencia del visitante. La tecnología es un recurso narrativo; la finalidad es demostrar el riesgo, explicar qué ocurre y enseñar a prevenir y reaccionar.

## 2. Identidad de la estación

**Título oficial:** Alguien está dentro  
**Subtítulo:** Tu computadora ya no está bajo tu control  
**Tema:** Acceso remoto, spyware y permisos peligrosos  
**Nombre de la experiencia:** La sesión fantasma  
**Frase central:** “No siempre tienen que romper tu seguridad. A veces basta con que les abras la puerta.”

### Identidad visual

- Inicio: azul, blanco y verde; ambiente cotidiano y confiable.
- Advertencia: amarillo; solicitudes de permisos y señales de duda.
- Compromiso: rojo y fondo oscuro; pérdida de control.
- Recuperación: cian y verde; acciones concretas y sensación de salida.

### Símbolo narrativo

Cada permiso es una **llave digital**. El atacante no obtiene todo de inmediato: recibe una llave cada vez que la víctima concede un permiso.

## 3. Resultado educativo esperado

Al salir, cada visitante debe poder responder:

1. La amenaza consistía en conceder acceso remoto o permisos excesivos a una persona o programa no verificado.
2. La víctima vio un mensaje de soporte creíble, urgencia y solicitudes de permisos.
3. Detrás del mensaje, otra persona pudo observar o controlar el dispositivo.
4. La consecuencia podía ser pérdida de privacidad, modificación de archivos, robo de cuentas o suplantación.
5. Las señales incluían contacto no solicitado, urgencia, remitente dudoso y permisos innecesarios.
6. Se evitaba verificando por un canal oficial y rechazando el acceso.
7. Al detectarlo, debía detener la sesión, desconectar, proteger cuentas, revisar el equipo y reportar.

El mensaje de salida debe ser práctico, no simplemente alarmante:

> Si algo pide controlar tu dispositivo, detente, verifica quién lo solicita y entiende exactamente qué estás autorizando.

## 4. Concepto narrativo

El visitante interpreta a **Alex Rivera**, estudiante ficticio. Alex recibe un mensaje de “Campus One — Soporte técnico” que afirma haber detectado un problema urgente en su cuenta académica. Para “resolverlo”, un supuesto técnico solicita observar y controlar la computadora.

El visitante toma decisiones. Si concede acceso, un integrante controla realmente la VM Windows desde un Mac mediante `HACKEADO Victim Host`, aplicación propia, visible y con autorización separada. Todos los documentos son ficticios. Riesgos como cámara, micrófono, portapapeles o robo de sesión se representan solamente mediante la aplicación.

Después, el escenario se congela y el público descubre el panel del atacante: permisos, cronología, acciones y consecuencias. Finalmente, los visitantes deben recuperar el control en el orden correcto.

### Arco dramático

```text
Normalidad → Mensaje urgente → Decisión → Pérdida de control
          → Revelación → Comprensión → Recuperación → Prevención
```

## 5. Pitch de entrada

### Pitch de 20 segundos para visitantes

> “Bienvenidos a ‘Alguien está dentro’. Durante los próximos minutos, esta computadora será de ustedes. Recibirán un problema cotidiano y deberán decidir en quién confiar. Lo que elijan cambiará lo que otra persona podrá ver y hacer. No hay respuestas preparadas: observen, decidan y, si algo sale mal, recuperen el control.”

### Pitch de 60 segundos para el docente

> “Nuestra estación demuestra cómo una solicitud de soporte aparentemente normal puede convertirse en acceso remoto peligroso. Utilizamos una aplicación propia con cuatro paneles sincronizados y un agente Windows visible. Mouse y teclado funcionan realmente dentro de una VM ficticia, mediante consentimiento separado, lease temporal y parada local; no existe acceso desatendido. Cámara, micrófono, contraseñas y extracción son simulaciones. Los visitantes deciden, observan ambos lados y recuperan el control. Contamos con modo simulado, vídeo y dinámica física como contingencia.”

### Frase gancho opcional

Antes del pitch, el narrador puede preguntar:

> “Si una persona mueve el cursor de tu computadora, ¿en qué momento empezó realmente el ataque?”

No se responde todavía. La pregunta vuelve al final.

## 6. Distribución física de la estación

### Zonas

1. **Zona de víctima:** computadora Windows y silla del visitante.
2. **Zona de atacante:** Mac, operador y panel privado, parcialmente ocultos.
3. **Zona pública:** proyector visible para todo el equipo visitante.
4. **Zona de recuperación:** mesa o panel con tarjetas de respuesta.
5. **Zona de espera:** marca de entrada y pitch inicial.

### Distribución sugerida

```text
Entrada
   ↓
┌─────────────────┐        ┌─────────────────────────┐
│ Público         │        │ Proyector               │
│ de pie/semicírc.│        │ Misterio / Revelación   │
└────────┬────────┘        └─────────────────────────┘
         │
┌────────▼────────┐        divisor visual       ┌─────────────────┐
│ Víctima Windows │  ║════════════════════════║ │ Atacante Mac   │
│ + visitante     │                             │ + operador      │
└─────────────────┘                             └─────────────────┘
         │
┌────────▼────────┐
│ Recuperación    │
│ tarjetas/botón  │
└─────────────────┘
```

### Reglas de montaje

- El visitante debe ver Windows y el proyector sin girarse demasiado.
- El panel del atacante debe permanecer oculto hasta la revelación.
- Los cables deben estar fijados al suelo.
- El botón de emergencia físico o visual debe ser accesible al coordinador.
- El equipo debe poder acercarse al panel de recuperación sin bloquear la salida.

## 7. Equipo y materiales

### Tecnología

- Mac del operador y cargador.
- Computadora Windows preparada y cargador.
- Proyector o pantalla externa.
- Cable HDMI y adaptador para el Mac.
- Router autorizado o red local confirmada.
- Regleta y extensiones.
- Altavoz opcional.
- Mouse externo para Windows.
- Copia local de la aplicación.
- Paquete verificado de `HACKEADO Victim Host`.
- Video de respaldo guardado localmente.

### Material físico

- Cartel con el nombre de la estación.
- Carteles “TU PANTALLA” y “EL OTRO LADO”.
- Siete llaves de cartón: pantalla, control, archivos, portapapeles, micrófono, cámara y acceso permanente.
- Tarjetas de señales de alerta.
- Tarjetas de recuperación.
- Tarjetas con consecuencias.
- Botón rojo físico decorativo o pulsador conectado, si está disponible.
- Cinta para fijar cables.
- Cronómetro secundario.
- Lista de comprobación impresa.
- Guion abreviado para cada integrante.
- Papel y marcadores.

### Material ficticio en Windows

- Cuenta local “Alex Rivera”.
- Carpeta de tareas.
- Fotos generadas o de banco autorizado.
- Presupuesto ficticio.
- Conversaciones ficticias.
- Documento “Contraseñas antiguas” con datos obviamente inventados.
- Portal académico local ficticio.
- Notificación de inicio de sesión ficticia.

## 8. Personajes y responsabilidades

La asignación inicial recomendada es la siguiente:

| Integrante | Responsabilidad principal | Responsabilidad secundaria |
|---|---|---|
| Pablo Andrés Mazariegos Hernández | Coordinador general y narrador | Presentación al docente y control de fases |
| Juan Diego Marroquin Escobar | Personaje del falso soporte | Representación de ingeniería social |
| Roberto Alejandro Calderón Martínez | Facilitador de la víctima | Ayuda con decisiones y permisos |
| Luis Hervert Damian Martinez | Operador del Mac y control remoto | Acciones reales y confirmación de desconexión |
| Roger Leonardo Monterroso Recinos | Explicación “detrás del ataque” | Cronología y permisos |
| Josué Fernando Orozco Robledo | Consecuencias y dinámica de tarjetas | Puntuación |
| Karla Elizabeth López Avila | Prevención, reacción y reporte | Cierre educativo |
| Allan Francisco Moises Chaclán Guinea | Tiempo, materiales y contingencias | Restablecimiento técnico |

### Regla de rotación

Todos deben ensayar al menos una vez como narrador, operador y responsable de recuperación. Si falta alguien, cualquier integrante debe poder cubrir su función.

### Comunicación interna silenciosa

- Mano abierta: pausar.
- Dos dedos: quedan dos minutos.
- Puño cerrado: pasar a contingencia.
- Pulgar arriba: control remoto confirmado.
- Mano cruzando el cuello: terminar la sesión remota inmediatamente.

## 9. Reglas internas y límites de seguridad

1. Solo se utiliza el equipo Windows preparado por el grupo.
2. Nunca se solicita a un visitante que entregue su teléfono o computadora.
3. Nunca se escriben credenciales reales.
4. El visitante puede detenerse o no participar sin presión.
5. La conexión real requiere aceptación visible en Windows.
6. No se utiliza acceso desatendido.
7. No se habilita transferencia real de archivos, portapapeles, audio ni elevación administrativa.
8. No se activan cámara o micrófono reales.
9. No se desactiva antivirus, firewall ni protección del sistema.
10. Cada ronda utiliza una autorización temporal nueva.
11. El control remoto debe terminar antes de reiniciar la aplicación.
12. Todo lo expuesto es ficticio.
13. Al final se explica qué fue real y qué fue simulado.

Si una condición de seguridad no puede confirmarse, se utiliza inmediatamente el modo simulado.

## 10. Preparación previa al evento

### Una o dos semanas antes

- Obtener aprobación del docente sobre la propuesta y herramienta remota.
- Completar los tres archivos de planificación.
- Terminar la aplicación y congelar funciones nuevas.
- Preparar información ficticia.
- Confirmar el lugar, electricidad, red y proyector.
- Asignar responsabilidades.
- Ensayar todas las rutas.
- Preparar la alternativa sin red.

### Dos o tres días antes

- Actualizar equipos y luego desactivar actualizaciones automáticas durante el evento.
- Probar cables y adaptadores.
- Verificar resolución del proyector.
- Probar volumen en un espacio similar.
- Ejecutar diez rondas consecutivas.
- Cronometrar cada escena.
- Imprimir tarjetas y listas.
- Grabar el video de respaldo.

### Día anterior

- Cargar equipos.
- Copiar la versión final en ambos equipos y almacenamiento de respaldo.
- Confirmar que no existan cuentas personales abiertas.
- Restaurar el usuario ficticio de Windows.
- Empacar todos los materiales por categorías.
- No introducir cambios de código salvo correcciones críticas.

## 11. Preparación antes de cada ronda

El responsable técnico ejecuta esta lista:

1. Confirmar que la sesión remota anterior terminó.
2. Restaurar los archivos ficticios.
3. Cerrar documentos y ventanas.
4. Volver al fondo inicial.
5. Crear una nueva sesión en la aplicación.
6. Confirmar víctima conectada.
7. Confirmar atacante conectado.
8. Confirmar vista pública conectada.
9. Confirmar panel de coordinación conectado.
10. Comprobar sonido.
11. Colocar las tarjetas en orden inicial.
12. Restablecer llaves físicas.
13. Colocar el temporizador en 15:00.
14. Confirmar que el botón de emergencia está disponible.
15. Hacer contacto visual con el coordinador y dar pulgar arriba.

## 12. Guion maestro de 15 minutos

| Tiempo | Escena | Responsable | Resultado |
|---|---|---|---|
| 0:00–0:40 | Gancho y pitch | Pablo | Atención y contexto |
| 0:40–1:20 | Elegir víctima/personaje | Roberto | Visitante involucrado |
| 1:20–3:10 | Mensaje y decisión | Juan Diego/Roberto | Primera decisión |
| 3:10–4:20 | Permisos y conexión | Roberto/Luis | Acceso concedido o ruta alternativa |
| 4:20–5:50 | Pérdida de control | Luis | Momento de impacto |
| 5:50–7:20 | Revelación | Roger | Comprender el otro lado |
| 7:20–8:30 | Teoría sencilla | Roger | Definir amenaza y funcionamiento |
| 8:30–9:40 | Consecuencias | Josué | Relacionar decisión y daño |
| 9:40–12:10 | Recuperar el control | Josué/Karla | Respuesta práctica |
| 12:10–13:45 | Prevención y reporte | Karla | Medidas aplicables |
| 13:45–14:30 | Pregunta final | Pablo | Comprobar comprensión |
| 14:30–15:00 | Cierre y reinicio | Todo el grupo | Salida ordenada |

El coordinador puede recortar la fase de control o consecuencias, pero nunca eliminar prevención, reacción o pregunta final.

## 13. Desarrollo detallado de cada escena

### Escena 1 — Gancho

**Visual:** proyector con título y una computadora aparentemente normal.  
**Narrador:**

> “Imaginen que tienen que entregar un proyecto hoy y, de repente, soporte les avisa que su cuenta será bloqueada. Tienen poco tiempo. ¿Confiarían?”

Se presenta el pitch y se invita a una persona a usar Windows.

### Escena 2 — Personaje

Roberto explica:

> “No usaremos ningún dato tuyo. Durante esta historia eres Alex Rivera y todo lo que verás es ficticio.”

El visitante selecciona un avatar. El público recibe la misión: observar señales sospechosas sin gritar inmediatamente la respuesta.

### Escena 3 — Mensaje

Juan Diego interpreta al supuesto soporte, presencialmente o mediante audio/mensajes:

> “Hola, Alex. Detectamos actividad extraña. Si no ejecutamos una reparación ahora, perderás acceso a la plataforma y a tu entrega.”

El visitante examina el mensaje y elige solucionar, posponer o verificar.

### Escena 4 — Permisos

Las solicitudes aparecen una por una. Cada aceptación entrega físicamente una llave al supuesto atacante. El narrador no juzga; pregunta:

> “¿Te parece razonable que soporte necesite este permiso? Puedes aceptar, rechazar o pedir más información.”

Si se concede control, se establece la sesión legítima. Si se rechaza, se utiliza la ruta segura descrita más adelante.

### Escena 5 — Pérdida de control

Luis realiza la secuencia previamente ensayada:

1. Mueve el cursor.
2. Abre “Tareas del semestre”.
3. Abre el proyecto final.
4. Escribe una frase.
5. Abre una conversación ficticia.
6. Activa una consecuencia simulada.
7. Escribe: “Me permitiste entrar”.

Roberto permite que el visitante intente mover o cerrar algo, sin convertirlo en una lucha larga por el mouse.

### Escena 6 — Congelación y revelación

Pablo dice:

> “Pausa. Hasta aquí vimos lo que observó Alex. Ahora veamos qué estaba ocurriendo del otro lado.”

Allan activa la vista pública. Roger explica la cronología y el mapa de permisos.

### Escena 7 — Teoría

Roger utiliza la analogía de las llaves digitales. Máximo 70 segundos.

### Escena 8 — Consecuencias

Josué entrega tarjetas al público para asociar permisos con consecuencias. Se corrigen respuestas y se evita exagerar capacidades que no correspondan al permiso concedido.

### Escena 9 — Recuperación

El público ordena tarjetas. La víctima pulsa el control real para dejar de compartir. Luis confirma que perdió acceso y muestra sus manos lejos del teclado. La aplicación cambia a verde.

### Escena 10 — Prevención y cierre

Karla resume señales, prevención y reporte. Pablo formula la pregunta final y recupera la frase del inicio.

## 14. Rutas según la decisión del visitante

### Ruta A — Rechaza o verifica

No debe castigarse la buena decisión.

1. La aplicación muestra “Ataque evitado”.
2. El grupo felicita la conducta concreta, no a la persona en general.
3. Pablo dice:

   > “Tomaste la decisión correcta. Para que todos veamos el riesgo, mostraremos una línea temporal alternativa con nuestro equipo de demostración.”

4. Un integrante del grupo autoriza la conexión sobre Windows.
5. Se utiliza exclusivamente el modo simulado o el vídeo de respaldo; no se contradice la decisión segura del visitante.
6. El visitante conserva los puntos por haber evitado el acceso.

### Ruta B — Comparte pantalla, pero rechaza control

1. Se muestra lo que podría observarse.
2. El atacante no mueve el mouse.
3. Se explica que visualizar también puede exponer información.
4. Se ejecutan consecuencias simuladas limitadas.

### Ruta C — Concede control

Se ejecuta la secuencia completa de control real y revelación.

### Ruta D — No quiere participar

- Se respeta inmediatamente.
- Un integrante actúa como víctima.
- La persona puede participar desde el público o simplemente observar.

## 15. Explicación teórica en palabras sencillas

### Acceso remoto

> “Es una función que permite que alguien vea o controle una computadora desde otro lugar. Es útil cuando la persona es legítima y tú solicitaste ayuda; es peligrosa cuando no sabes quién está al otro lado.”

### Spyware

> “Es software que recopila información sobre una persona o dispositivo sin que esta comprenda o autorice claramente lo que ocurre.”

### Permiso

> “Es una llave digital. Autoriza a una aplicación o persona a utilizar una función, como la pantalla, los archivos, el micrófono o la cámara.”

### Ingeniería social

> “Es manipular a una persona para que ella misma entregue información o acceso. Utiliza confianza, miedo, autoridad, curiosidad o urgencia.”

### Explicación general del funcionamiento

1. La persona recibe una solicitud que parece confiable.
2. Se la presiona para decidir rápido.
3. Instala una herramienta o concede acceso.
4. La otra persona obtiene las capacidades autorizadas.
5. Puede observar, modificar información o intentar ampliar el acceso.

No es necesario explicar protocolos, puertos, exploits ni procedimientos ofensivos.

## 16. Lo que observa la persona atacada

La víctima ve:

- Un mensaje con apariencia oficial.
- Un problema creíble relacionado con sus estudios.
- Urgencia y amenaza de bloqueo.
- Un supuesto número de caso.
- Solicitudes de permisos.
- Una barra que indica que su pantalla está compartida.
- El cursor moviéndose sin su intención.
- Ventanas y archivos abriéndose.
- Texto apareciendo en su documento.
- Alertas de actividad de cuentas.

Lo que hace que parezca confiable:

- Diseño visual profesional.
- Uso del nombre del personaje.
- Lenguaje parecido al soporte real.
- Problema relacionado con una entrega.
- Promesa de solución rápida.

Señales de peligro visibles:

- La víctima no pidió soporte.
- El remitente tiene un dominio extraño.
- Amenaza consecuencias inmediatas.
- Pide instalar o abrir algo.
- Solicita control total.
- Solicita permisos que no se relacionan con el problema.
- Intenta impedir que la víctima verifique por otro canal.

## 17. Lo que sucede detrás del ataque

El panel del atacante debe permitir explicar:

- Cuándo llegó el mensaje.
- Qué decisión tomó la víctima.
- Qué permisos concedió.
- Cuándo empezó la visualización.
- Cuándo comenzó el control.
- Qué archivos ficticios se abrieron.
- Qué consecuencias fueron simuladas.
- Cuándo se detuvo la sesión.

Frase sugerida de Roger:

> “Desde la pantalla de Alex parecía una reparación. Desde este lado era una lista de capacidades. Cada permiso aceptado abrió una posibilidad distinta. No todos los permisos permiten lo mismo, pero juntos pueden entregar gran parte de la vida digital de una persona.”

Debe señalarse claramente:

- El movimiento del cursor fue real.
- Los documentos eran ficticios.
- Cámara, micrófono, contraseñas y extracción fueron simulados.
- El acceso existió únicamente durante la sesión autorizada.

## 18. Información expuesta y consecuencias

### Información que podría quedar expuesta

- Documentos académicos o laborales.
- Fotografías y videos.
- Conversaciones.
- Contactos.
- Historial de navegación.
- Cuentas que ya estaban abiertas.
- Información financiera visible.
- Códigos mostrados en pantalla.
- Contenido copiado al portapapeles, si se autorizó esa función.
- Sonido o imagen, si se concedieron permisos específicos.

### Consecuencias personales

- Pérdida de privacidad.
- Vergüenza o daño emocional.
- Extorsión.
- Suplantación de identidad.
- Mensajes enviados en nombre de la víctima.
- Pérdida de acceso a cuentas.

### Consecuencias académicas

- Eliminación o modificación de tareas.
- Acceso a información institucional.
- Uso indebido de la cuenta universitaria.
- Envío de contenido desde la identidad del estudiante.

### Consecuencias económicas

- Compras no autorizadas.
- Fraude.
- Robo de credenciales de servicios financieros.
- Solicitudes de dinero a contactos.

### Actividad con tarjetas

Josué coloca tarjetas de permisos y consecuencias. El público debe unirlas. Debe aclararse que una capacidad depende de los permisos y del contexto: compartir pantalla no equivale automáticamente a controlar la cámara o conocer todas las contraseñas.

## 19. Señales de alerta

Los visitantes deben identificar como mínimo cinco:

1. Contacto de soporte no solicitado.
2. Urgencia o cuenta regresiva.
3. Amenaza de bloqueo o pérdida.
4. Dirección o dominio ligeramente diferente.
5. Solicitud de instalar software desconocido.
6. Solicitud de control total.
7. Permisos que no tienen relación con el problema.
8. Petición de mantener el acceso.
9. Solicitud de desactivar medidas de seguridad.
10. Negativa a permitir verificar por otro canal.
11. Errores de redacción o inconsistencias visuales.
12. Técnico que pide contraseñas o códigos de verificación.

### Técnica de enseñanza

No leer la lista completa. Pedir primero al público que encuentre señales en la pantalla y colocar una marca sobre cada una. Luego completar únicamente las que falten.

## 20. Cómo prevenirlo

### Antes de aceptar ayuda

- Preguntarse si se solicitó soporte originalmente.
- Verificar identidad por un canal oficial independiente.
- Buscar el número del área de soporte en el sitio oficial, no en el mensaje recibido.
- Leer cada permiso.
- Preguntar por qué se necesita.
- Rechazar control permanente.
- No compartir contraseñas ni códigos de verificación.

### Al instalar aplicaciones

- Descargar únicamente desde el sitio oficial o tienda autorizada.
- Confirmar nombre del desarrollador.
- Evitar versiones modificadas, cracks o activadores.
- Revisar reputación y propósito.
- Desmarcar programas adicionales.
- Mantener sistema y aplicaciones actualizados.

### En una sesión legítima

- Permanecer frente al dispositivo.
- Observar las acciones del técnico.
- Compartir solamente la aplicación necesaria cuando sea posible.
- No abrir banca, correo personal ni gestores de contraseñas.
- Rechazar transferencia de archivos si no es necesaria.
- Terminar la sesión al finalizar.
- Confirmar que la herramienta quedó cerrada.

### Hábitos de protección

- Utilizar contraseñas únicas.
- Activar verificación en dos pasos.
- Bloquear el dispositivo al alejarse.
- Revisar periódicamente aplicaciones y permisos.
- Mantener copias de seguridad.
- Conocer el canal oficial de soporte de la institución.

### Decisión que habría evitado el incidente

> Detenerse y verificar la solicitud de soporte por un canal oficial antes de conceder cualquier permiso.

## 21. Cómo reaccionar después de detectarlo

Presentar esta secuencia en orden comprensible:

### 1. Detener el acceso

- Pulsar “Dejar de compartir”, “Cancelar control” o equivalente.
- Cerrar la herramienta de asistencia.

### 2. Aislar el dispositivo si el control continúa

- Desconectar Wi-Fi o cable de red.
- No continuar abriendo cuentas sensibles.

### 3. Pedir ayuda

- Informar al área de soporte, docente, responsable o administrador.
- Explicar qué se aceptó y qué se observó.

### 4. Proteger cuentas desde otro dispositivo seguro

- Cambiar contraseñas importantes.
- Cerrar sesiones abiertas.
- Activar o revisar verificación en dos pasos.
- Revocar dispositivos o aplicaciones desconocidas.

### 5. Revisar el equipo

- Desinstalar software sospechoso con ayuda autorizada.
- Revisar permisos de pantalla, accesibilidad, cámara y micrófono.
- Actualizar sistema y herramientas de seguridad.
- Ejecutar una revisión con herramientas confiables.

### 6. Revisar consecuencias

- Buscar cambios en archivos.
- Revisar actividad de correo, redes y cuentas financieras.
- Avisar a contactos si pudieron recibir mensajes falsos.
- Conservar evidencia básica antes de borrar mensajes relevantes.

### 7. Reportar

- Entregar hora aproximada, mensaje recibido, aplicación utilizada y acciones observadas.
- No ocultar el incidente por vergüenza.

La estación no debe prometer que estos pasos garantizan eliminar cualquier amenaza. Si hay sospecha de compromiso real, debe intervenir personal capacitado.

## 22. A quién informar o pedir ayuda

Según el contexto:

- Área de soporte o seguridad de la universidad.
- Docente o coordinador académico.
- Responsable de tecnología de la organización.
- Padre, madre o adulto de confianza, si corresponde.
- Proveedor de la cuenta afectada.
- Banco, si existe riesgo financiero.
- Autoridades o canal institucional de denuncia, si hubo fraude, extorsión o amenaza.

### Modelo breve de reporte

> “A las 10:15 recibí un mensaje de soporte que no había solicitado. Permití compartir y controlar mi pantalla durante aproximadamente dos minutos. Vi que abrieron una carpeta y una cuenta. Ya terminé la sesión y desconecté el equipo. Necesito ayuda para revisar permisos, sesiones y posibles cambios.”

Este formato evita frases vagas como “creo que me hackearon” y entrega información útil.

## 23. Dinámicas de participación

### Dinámica 1 — Decide

La víctima elige cómo responder al mensaje y a cada permiso.

### Dinámica 2 — Detective de señales

El público identifica señales de alerta. Puede levantar tarjetas rojas o colocar imanes junto a la pantalla proyectada.

### Dinámica 3 — Llaves digitales

Cada permiso aceptado entrega una llave física al atacante. Durante la revelación se explica qué abría cada llave.

### Dinámica 4 — Permiso vs. consecuencia

Los visitantes unen tarjetas. Ejemplo: “control de teclado” con “escribir o modificar”, no automáticamente con “escuchar micrófono”.

### Dinámica 5 — Recuperar el control

El grupo ordena los pasos de respuesta y la víctima ejecuta la desconexión real.

### Dinámica 6 — Semáforo final

El narrador presenta situaciones rápidas. El público responde:

- Verde: razonable.
- Amarillo: detenerse y revisar.
- Rojo: rechazar y reportar.

Ejemplos:

- “Llamaste al soporte oficial y te pide compartir una ventana concreta”: amarillo.
- “Un desconocido te escribe y exige control total”: rojo.
- “La aplicación de videollamadas solicita micrófono durante una llamada”: verde, si se esperaba.

## 24. Pregunta final y cierre

### Pregunta obligatoria

> “¿En qué momento dejó de estar realmente bajo control de Alex?”

Respuesta esperada:

> “Cuando aceptó una solicitud no verificada y concedió permisos, no cuando el cursor empezó a moverse.”

### Comprobación de siete puntos

Pablo realiza preguntas rápidas al grupo:

1. ¿Qué amenaza vimos?
2. ¿Qué observó Alex?
3. ¿Qué pasaba detrás?
4. ¿Qué consecuencia podía producirse?
5. ¿Qué señal de alerta detectaron?
6. ¿Cómo podía evitarse?
7. ¿Qué debía hacer después?

### Cierre de 20 segundos

> “Una herramienta de acceso remoto no es mala por sí misma; puede resolver problemas reales. El riesgo aparece cuando no verificamos a la persona, no leemos los permisos o dejamos el acceso abierto. La próxima vez que alguien les pida controlar su dispositivo: deténganse, verifiquen y decidan qué llave están entregando.”

## 25. Guion verbal por integrante

### Pablo — Coordinación y narración

- Pronuncia el pitch.
- Mantiene la historia enfocada.
- Congela la escena.
- Formula la pregunta final.
- Decide si se activa cierre rápido.

Frases clave:

> “No busquen palabras técnicas; observen decisiones.”

> “Pausa. Ahora veamos el otro lado.”

### Juan Diego — Falso soporte

- Mantiene un tono amable y profesional.
- Utiliza urgencia sin gritar.
- Evita caricaturizar al atacante.

Frases:

> “Solo necesitamos completar una verificación rápida.”

> “Si sales ahora, el proceso podría quedar incompleto.”

### Roberto — Facilitador de víctima

- Explica que todo es ficticio.
- No guía hacia una respuesta específica.
- Ayuda únicamente con la interfaz.

Frase:

> “Tú decides. Puedes aceptar, rechazar o investigar antes.”

### Luis — Operador

- Realiza la secuencia ensayada.
- No improvisa acciones fuera de la lista.
- Termina inmediatamente al recibir señal.
- Confirma en voz alta: “Sesión terminada”.

### Roger — Detrás del ataque

- Explica mapa de permisos y cronología.
- Distingue posibilidad de hecho real.

Frase:

> “Esto fue lo que ocurrió; esto otro es lo que podría ocurrir si el permiso existiera.”

### Josué — Consecuencias

- Dirige tarjetas.
- Corrige exageraciones.
- Conecta permiso con daño.

### Karla — Prevención y reacción

- Dirige recuperación.
- Resume acciones cotidianas.
- Explica reporte.

Frase:

> “La primera reacción no es entrar en pánico; es cortar el acceso y pedir ayuda.”

### Allan — Tiempo y contingencias

- Controla temporizador y materiales.
- Activa escenas.
- Restablece la estación.
- Indica silenciosamente el tiempo restante.

## 26. Operación de la aplicación durante la presentación

### Orden de pantallas

1. Mac: panel de coordinación.
2. Mac, ventana secundaria: panel del atacante.
3. Proyector: panel público.
4. Windows: panel de víctima.
5. Herramienta remota abierta, pero sin conexión al comenzar.

### Operación por escena

| Escena | Acción en coordinación | Acción del atacante | Estado público |
|---|---|---|---|
| Entrada | Crear/iniciar sesión | Esperar | Título |
| Engaño | Iniciar historia | Observar | Misterio |
| Permisos | Confirmar respuestas | Preparar conexión | Indicadores parciales |
| Control | Confirmar control real | Ejecutar secuencia | Suspenso |
| Revelación | Activar revelación | Detener acciones | Cronología/permisos |
| Recuperación | Iniciar reto | Esperar desconexión | Lista de pasos |
| Cierre | Mostrar resultado | Confirmar fin | Mensaje final |
| Reinicio | Restablecer | Cerrar sesión | Bienvenida |

### Regla de confirmación

La aplicación muestra “control terminado” únicamente después de revocar lease y liberar entrada; Luis confirma además que Mac ya no responde sobre Windows.

### Parada de emergencia

Si ocurre cualquier acción no esperada:

1. Luis termina control remoto.
2. Allan pulsa “Detener todo”.
3. Roberto aleja al visitante de la interacción.
4. Pablo informa: “La demostración fue pausada; continuaremos de forma simulada”.
5. No se intenta resolver el fallo frente al público durante más de 20 segundos.

## 27. Planes de contingencia

### Nivel 1 — Falla menor

Ejemplos: un sonido no funciona o una animación se atrasa.

- Continuar verbalmente.
- No reiniciar toda la estación.
- Allan registra el problema después.

### Nivel 2 — Falla del control remoto

- Activar modo simulado.
- Luis representa el panel del atacante.
- La aplicación reproduce cursor, archivos y escritura simulados.
- Roger aclara al final que esta ronda utilizó simulación completa.

### Nivel 3 — Falla de red

- Utilizar modo ensayo local en el Mac o archivos autónomos.
- Windows puede mostrar la historia sin sincronización.
- Coordinar escenas mediante señales internas.

### Nivel 4 — Falla de proyector

- Girar el Mac hacia el grupo durante la revelación.
- Utilizar mapa de permisos y cronología impresos.

### Nivel 5 — Falla total de equipos

Ejecutar versión física:

1. Juan Diego entrega el mensaje impreso.
2. El visitante concede llaves de cartón.
3. Luis recibe copias de documentos ficticios.
4. Roger construye la cronología con tarjetas.
5. El público ordena la recuperación.

### Visitante toma una decisión inesperada

- Nunca contradecirlo para forzar la historia.
- Utilizar la ruta más cercana.
- Si evita el ataque, presentar línea temporal alternativa.

### Visitante intenta usar datos reales

- Detener el ingreso.
- Recordar que debe utilizarse el personaje ficticio.
- Borrar cualquier dato accidental inmediatamente.

## 28. Manejo del tiempo

### Hitos

- Minuto 3: decisión principal tomada.
- Minuto 5: control o alternativa en ejecución.
- Minuto 7: revelación iniciada.
- Minuto 10: recuperación iniciada.
- Minuto 13: prevención.
- Minuto 14: pregunta final.

### Qué recortar

1. Reducir acciones reales de siete a tres.
2. Utilizar solo cuatro consecuencias.
3. Hacer una sola ronda del semáforo.

### Qué nunca recortar

- Explicar qué ocurrió detrás.
- Mostrar cómo detenerlo.
- Prevención.
- Reporte.
- Pregunta final.

### Cierre rápido

Si llegan al minuto 11 sin recuperación:

1. Congelar acciones.
2. Mostrar resumen automático.
3. Pedir tres pasos críticos: detener, proteger cuentas, reportar.
4. Dar cinco señales de alerta.
5. Formular la pregunta final.

## 29. Atención y trato a los visitantes

- Hablar con ellos, no sobre ellos.
- Evitar burlas si aceptan todos los permisos.
- No decir “eso era obvio”.
- Explicar que la presión y la autoridad afectan incluso a personas con experiencia.
- Felicitar conductas específicas: “verificaste el remitente”.
- Mantener lenguaje sencillo.
- Definir todo término técnico inmediatamente.
- Invitar a participar sin obligar.
- Permitir preguntas al final si el tiempo lo permite.
- No utilizar miedo como único recurso.

La meta es que el visitante salga con confianza para actuar mejor, no sintiéndose ingenuo.

## 30. Ensayos

### Ensayo 1 — Lectura de mesa

- Leer todo el guion.
- Ajustar lenguaje.
- Confirmar responsabilidades.

### Ensayo 2 — Aplicación sin control remoto

- Probar los tres finales.
- Probar señales internas.
- Medir duración.

### Ensayo 3 — Control real

- Ejecutar únicamente con integrantes.
- Confirmar permisos y desconexión.
- Revisar qué ve el público.

### Ensayo 4 — Contingencias

- Desconectar Internet intencionalmente.
- Cerrar una pestaña.
- Simular falla del proyector.
- Ejecutar versión física.

### Ensayo 5 — Público de prueba

- Invitar a personas que no conozcan el proyecto.
- No explicar antes.
- Preguntar qué entendieron.
- Registrar confusiones.

### Ensayo 6 — Diez rondas

- Ejecutar diez reinicios seguidos.
- Medir tiempo entre grupos.
- Corregir desgaste operativo.

### Ensayo general

- Utilizar lugar, luz, sonido, equipos y posiciones reales.
- Vestimenta final.
- Guion sin lectura visible.
- Evaluación interna con la rúbrica universitaria.

## 31. Evaluación y mejora

### Preguntas rápidas para visitantes

1. ¿Qué parte te sorprendió más?
2. ¿Qué señal de alerta recordarás?
3. ¿Qué harías primero si te ocurre?

### Registro interno después de cada bloque

- ¿Se entendió la diferencia entre observar y controlar?
- ¿El público participó?
- ¿La revelación ocurrió a tiempo?
- ¿Hubo confusión entre real y simulado?
- ¿Funcionó la recuperación?
- ¿Qué pregunta se repitió?

### Criterios de la evaluación de visitantes

El equipo debe optimizar explícitamente:

- Claridad: frases breves y analogía de llaves.
- Creatividad: doble perspectiva y transformación visual.
- Participación: decisiones, tarjetas y recuperación.
- Comprensión: cronología y comparación.
- Consecuencias: relación directa con permisos.
- Prevención: acciones aplicables.
- Organización: responsabilidades visibles y reinicio rápido.
- Impacto: control real, revelación y botón de desconexión.

## 32. Matriz de cumplimiento de requisitos universitarios

| Requisito | Cómo se cumple | Evidencia durante la estación |
|---|---|---|
| Título | “Alguien está dentro” | Cartel, bienvenida y cierre |
| Tema | Acceso remoto, spyware y permisos | Teoría y demostración |
| Objetivo | Comprender riesgo y reacción | Pitch y resultado final |
| Situación | Falso soporte académico | Mensaje interactivo |
| Participación | Decisiones, permisos, tarjetas | Víctima y público activos |
| Explicación teórica | Definiciones sencillas | Analogía de llaves |
| Lo que observa la víctima | Mensajes, permisos y cursor | Windows |
| Detrás del ataque | Permisos, cronología y acciones | Panel del atacante/proyector |
| Consecuencias | Personales, académicas y económicas | Tarjetas y medidores |
| Señales de alerta | Doce señales contextualizadas | Detective de señales |
| Medidas preventivas | Verificar, limitar, actualizar | Resumen de Karla |
| Reacción | Detener, aislar, proteger, revisar | Reto de recuperación |
| Reporte | Canales y modelo de reporte | Cierre educativo |
| Pregunta final | Momento en que comenzó el acceso | Pregunta de Pablo |
| Responsabilidades | Ocho funciones asignadas | Tabla y rotación |
| Equipo/materiales | Tecnología y recursos físicos | Inventario |
| Alternativa técnica | Simulación, video y versión física | Plan de contingencia |
| Información ficticia | Cuenta y archivos preparados | Marca de demostración |
| Ensayo | Seis tipos de ensayo | Registro de pruebas |
| Máximo 15 minutos | Guion cronometrado | Panel de coordinación |
| Revisión docente | Presentación previa | Fase de aprobación |
| Uso seguro | Consentimiento y acciones limitadas | Reglas internas |

### Resultado esperado: siete respuestas

| Pregunta de la universidad | Respuesta que debe llevarse el visitante |
|---|---|
| ¿En qué consistía? | Acceso concedido a alguien no verificado. |
| ¿Qué observó? | Mensaje, permisos y control de pantalla. |
| ¿Qué sucedía detrás? | Otra persona recibía capacidades autorizadas. |
| ¿Qué consecuencia? | Exposición, modificación o robo de cuentas. |
| ¿Qué alerta? | Urgencia, contacto no solicitado y permisos excesivos. |
| ¿Cómo evitarlo? | Verificar por canal oficial y rechazar acceso innecesario. |
| ¿Qué hacer después? | Detener, proteger, revisar y reportar. |

## 33. Listas de comprobación

### Lista de apertura del día

- [ ] Aprobación y límites confirmados.
- [ ] Equipos cargados y conectados.
- [ ] Cuenta Windows ficticia.
- [ ] Sin cuentas personales abiertas.
- [ ] Aplicación funcionando.
- [ ] Herramienta remota configurada sin acceso desatendido.
- [ ] Proyector y sonido probados.
- [ ] Red probada.
- [ ] Modo simulado probado.
- [ ] Video disponible offline.
- [ ] Tarjetas completas.
- [ ] Cables asegurados.
- [ ] Guiones disponibles.

### Lista entre rondas

- [ ] Sesión remota terminada.
- [ ] Aplicación reiniciada.
- [ ] Archivos ficticios restaurados.
- [ ] Cronología borrada.
- [ ] Nuevo código generado.
- [ ] Cuatro paneles conectados.
- [ ] Tarjetas y llaves restauradas.
- [ ] Temporizador en 15:00.

### Lista de cierre del día

- [ ] Servidor cerrado.
- [ ] Sesiones remotas cerradas.
- [ ] Acceso remoto deshabilitado o desinstalado si corresponde.
- [ ] Material guardado.
- [ ] Equipos restaurados.
- [ ] Problemas y comentarios registrados.

## 34. Resumen imprimible para el equipo

### Mensaje central

> No siempre rompen la seguridad: a veces convencen a la víctima para que entregue las llaves.

### Orden de presentación

1. Gancho.
2. Personaje ficticio.
3. Mensaje de soporte.
4. Decisión.
5. Permisos.
6. Control.
7. Revelación.
8. Teoría.
9. Consecuencias.
10. Recuperación.
11. Prevención y reporte.
12. Pregunta final.

### Cinco señales esenciales

1. No solicitaste soporte.
2. Te presionan con urgencia.
3. El remitente no coincide.
4. Piden control o permisos excesivos.
5. Impiden verificar por otro canal.

### Cinco respuestas esenciales

1. Detener el acceso.
2. Desconectar si continúa.
3. Avisar y pedir ayuda.
4. Proteger cuentas desde otro dispositivo.
5. Revisar y reportar.

### Ante una falla

> Detener, pasar a modo simulado y continuar la historia. No solucionar durante más de 20 segundos frente al público.

### Frase final

> “Detente, verifica y piensa qué llave estás entregando.”


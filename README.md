# HACKEADO — Alguien está dentro

Aplicación educativa multisistema para una estación interactiva sobre acceso remoto, spyware y permisos peligrosos. El Mac ejecuta el servidor y los paneles de coordinación/atacante; Windows funciona como equipo víctima; un proyector muestra la vista pública.

> La aplicación no implementa acceso remoto oculto ni captura datos reales. El control real se realizará, cuando corresponda, mediante una herramienta legítima y consentida de soporte remoto. Las consecuencias sensibles son simuladas.

## Estado

Base inicial del repositorio. Incluye:

- React + TypeScript + Vite.
- Node.js + Express.
- Socket.IO para comunicación en tiempo real.
- Cuatro rutas iniciales: víctima, atacante, público y coordinación.
- Validación con Zod.
- Vitest para pruebas unitarias.
- ESLint y Prettier.
- Documentación funcional en `docs/`.

## Requisitos

- Node.js 24 LTS.
- npm 11 o compatible.
- macOS, Windows o Linux para desarrollo.

Este proyecto no utiliza Python, por lo que no necesita `.venv`. El equivalente para fijar el entorno de Node es `.nvmrc`; la configuración local se guarda en `.env`, tomando `.env.example` como plantilla.

## Inicio rápido

```bash
npm install
cp .env.example .env
npm run dev
```

Servicios de desarrollo:

- Interfaz: `http://localhost:5174`
- API y Socket.IO: `http://localhost:3000`

Para abrir la interfaz desde Windows en la misma red, se utilizará la IP local del Mac:

```text
http://IP-DEL-MAC:5174/victima
```

## Rutas iniciales

| Ruta | Uso |
|---|---|
| `/` | Inicio y estado de la base |
| `/victima` | Panel de víctima en Windows |
| `/atacante` | Panel del operador en Mac |
| `/publico` | Vista para el proyector |
| `/coordinacion` | Control general de la experiencia |

## Scripts

| Comando | Función |
|---|---|
| `npm run dev` | Inicia servidor y cliente en modo desarrollo |
| `npm run dev:client` | Inicia solamente Vite |
| `npm run dev:server` | Inicia solamente Express/Socket.IO |
| `npm run build` | Compila cliente y servidor |
| `npm run start` | Ejecuta la compilación del servidor |
| `npm run typecheck` | Comprueba tipos de frontend y backend |
| `npm run test` | Ejecuta pruebas unitarias |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea el repositorio con Prettier |
| `npm run check` | Ejecuta tipos, lint, pruebas y build |

## Arquitectura inicial

```text
Navegadores React
víctima | atacante | público | coordinación
                 │
                 │ HTTP + Socket.IO
                 ▼
Servidor Node.js + Express
salud | sesiones futuras | estado temporal futuro
```

El servidor será la fuente de verdad. En fases posteriores administrará sesiones temporales, roles, máquina de estados, cronología, permisos narrativos y recuperación.

## Árbol del proyecto

```text
hackeado/
├── docs/                  Especificación, fases y presentación
├── public/                Recursos estáticos ficticios
├── scenarios/             Escenarios narrativos en JSON
├── scripts/               Utilidades de operación
├── src/
│   ├── client/            Aplicación React y vistas
│   ├── server/            API y Socket.IO
│   └── shared/            Tipos y contratos compartidos
├── tests/                 Pruebas unitarias e integración
├── .env.example
├── .nvmrc
├── package.json
└── vite.config.ts
```

## Configuración

Variables disponibles en `.env.example`:

- `HOST`: interfaz de red del servidor.
- `PORT`: puerto del backend.
- `CLIENT_ORIGIN`: origen permitido durante desarrollo.
- `SESSION_TTL_MINUTES`: vida futura de las sesiones.
- `VITE_SERVER_URL`: URL opcional del servidor para el cliente.

No deben almacenarse credenciales ni secretos reales.

## Documentación

- [Especificación maestra](docs/01-especificacion-maestra-hackeado.md)
- [Plan de desarrollo](docs/02-plan-de-desarrollo-por-fases.md)
- [Manual de presentación](docs/03-manual-presentacion-hackeado.md)

## Límites de seguridad

- Información exclusivamente ficticia.
- Sin keylogging, spyware, exploits o persistencia.
- Sin captura real de cámara, micrófono o contraseñas.
- Sin transferencia real de archivos.
- Control remoto separado, visible, temporal y revocable.
- Modo simulado como respaldo operativo.



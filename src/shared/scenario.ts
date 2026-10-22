import { fictionalProfiles, type DemoScenario } from './types.js';

export const defaultScenario: DemoScenario = deepFreeze({
  id: 'support-scam-default',
  name: 'La sesión fantasma',
  description: 'Solicitud ficticia de soporte académico con permisos progresivos.',
  organization: 'Instituto Nova',
  profiles: fictionalProfiles,
  desktopItems: [
    {
      id: 'tasks',
      name: 'Tareas',
      kind: 'app',
      icon: '✓',
      summary: 'Tres entregas académicas pendientes',
      content: 'Proyecto audiovisual · Ensayo de ética · Laboratorio de redes',
    },
    {
      id: 'messages',
      name: 'Mensajes',
      kind: 'app',
      icon: '⌁',
      summary: 'Conversaciones ficticias del campus',
      content: 'Grupo Proyecto: “Nos vemos a las 4”\nBiblioteca: “Tu reserva está lista”',
    },
    {
      id: 'portal',
      name: 'Portal Nova',
      kind: 'app',
      icon: 'N',
      summary: 'Portal académico de demostración',
      content: 'Cursos activos: 5 · Avisos: 2 · Próxima entrega: viernes',
    },
    {
      id: 'photos',
      name: 'Fotos',
      kind: 'folder',
      icon: '◫',
      summary: '12 imágenes generadas para la demostración',
      content: 'viaje_lago_demo.jpg · mascota_pixel.png · equipo_clase.jpg',
    },
    {
      id: 'budget',
      name: 'Presupuesto octubre',
      kind: 'file',
      icon: '$',
      summary: 'Hoja financiera completamente ficticia',
      content: 'Transporte Q240 · Alimentación Q520 · Materiales Q175',
    },
    {
      id: 'identity',
      name: 'Datos de inscripción',
      kind: 'file',
      icon: 'ID',
      summary: 'Documento educativo sin datos reales',
      content: 'Carné: NOVA-2048 · Programa: Diseño Digital · Ciclo: 02',
    },
    {
      id: 'report',
      name: 'Reporte final',
      kind: 'file',
      icon: '↗',
      summary: 'Documento académico ficticio',
      content: 'Versión 7 · 18 páginas · Última edición: hoy, 09:42',
    },
    {
      id: 'vault',
      name: 'Accesos_demo',
      kind: 'file',
      icon: '••',
      summary: 'Lista señuelo; no contiene credenciales',
      content: 'Todos los valores visibles son ficticios y no funcionan fuera de esta experiencia.',
    },
  ],
  notifications: [
    {
      id: 'class',
      source: 'Aula Nova',
      title: 'Cambio de salón',
      body: 'La actividad de hoy será en el laboratorio 3.',
      urgency: 'normal',
    },
    {
      id: 'backup',
      source: 'Sistema',
      title: 'Copia local completada',
      body: 'Tus archivos ficticios están disponibles sin conexión.',
      urgency: 'normal',
    },
    {
      id: 'support',
      source: 'Soporte Nova',
      title: 'Acción requerida',
      body: 'Detectamos un supuesto problema con tu cuenta. Verifica el acceso.',
      urgency: 'warning',
    },
  ],
  support: {
    technician: 'Mara Voss · Soporte Nivel 2',
    caseNumber: 'NV-2048-AX',
    sender: 'mara.voss@soporte-nova.help',
    officialDomain: 'nova.local',
    openingMessage:
      'Hola. Detectamos una desincronización crítica en tu cuenta académica. Puedo corregirla antes del bloqueo programado.',
    followupMessage:
      'Necesito revisar tu pantalla durante unos minutos. Si el contador llega a cero, podrías perder acceso a tus entregas de hoy.',
    countdownSeconds: 45,
  },
});

export function getScenario(id: string): DemoScenario | undefined {
  return id === defaultScenario.id ? structuredClone(defaultScenario) : undefined;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

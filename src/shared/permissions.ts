import { calculateRisk } from './risk.js';
import { finalizeSession } from './scoring.js';
import type { DemoSession, DemonstrationNature, PermissionKey, PermissionStatus } from './types.js';

export const permissionDefinitions: Record<
  PermissionKey,
  {
    label: string;
    shortLabel: string;
    icon: string;
    nature: DemonstrationNature;
    statedReason: string;
    actualImpact: string;
  }
> = {
  screen: {
    label: 'Ver tu pantalla',
    shortLabel: 'Pantalla',
    icon: '▣',
    nature: 'real',
    statedReason: '“Necesito identificar el error visual.”',
    actualImpact: 'Puede observar mensajes, pestañas y cualquier dato visible.',
  },
  keyboard: {
    label: 'Controlar teclado y mouse',
    shortLabel: 'Control',
    icon: '⌁',
    nature: 'real',
    statedReason: '“Así lo corrijo más rápido por ti.”',
    actualImpact: 'Puede abrir, escribir, borrar o modificar como si estuviera frente al equipo.',
  },
  files: {
    label: 'Explorar archivos',
    shortLabel: 'Archivos',
    icon: '▤',
    nature: 'simulated',
    statedReason: '“Buscaré el archivo que causa la falla.”',
    actualImpact:
      'Expone trabajos, fotos y documentos. Aquí solo se representa con archivos ficticios.',
  },
  clipboard: {
    label: 'Leer portapapeles',
    shortLabel: 'Portapapeles',
    icon: '□',
    nature: 'simulated',
    statedReason: '“Copiaré el código de reparación.”',
    actualImpact: 'El portapapeles puede contener enlaces, mensajes o datos copiados.',
  },
  microphone: {
    label: 'Usar micrófono',
    shortLabel: 'Micrófono',
    icon: '◖',
    nature: 'simulated',
    statedReason: '“Necesito comprobar el audio del sistema.”',
    actualImpact: 'Podría escuchar el entorno. Esta demostración nunca activa micrófono real.',
  },
  camera: {
    label: 'Usar cámara',
    shortLabel: 'Cámara',
    icon: '●',
    nature: 'simulated',
    statedReason: '“Validaré tu identidad estudiantil.”',
    actualImpact: 'Podría observar a la persona y su entorno. Aquí siempre es simulado.',
  },
  unattended: {
    label: 'Recordar este acceso',
    shortLabel: 'Permanente',
    icon: '∞',
    nature: 'simulated',
    statedReason: '“Evitará repetir el proceso mañana.”',
    actualImpact:
      'Intentaría permitir regreso posterior. La aplicación nunca crea persistencia real.',
  },
};

export function canRequestPermission(session: DemoSession, key: PermissionKey): boolean {
  if (session.phase !== 'permissions') return false;
  const permission = session.permissions.find((item) => item.key === key);
  if (!permission || permission.status !== 'idle') return false;
  if (key === 'screen') return true;
  const screenGranted = hasStatus(session, 'screen', 'granted');
  if (!screenGranted) return false;
  if (key === 'unattended') return hasStatus(session, 'keyboard', 'granted');
  return true;
}

export function requestPermission(
  session: DemoSession,
  key: PermissionKey,
  now = Date.now(),
): DemoSession {
  if (session.phase !== 'permissions') throw new Error('permission_out_of_phase');
  if (!canRequestPermission(session, key)) throw new Error('permission_dependency');
  const definition = permissionDefinitions[key];
  return {
    ...session,
    permissions: session.permissions.map((permission) =>
      permission.key === key
        ? { ...permission, status: 'requested', requestedAt: now }
        : permission,
    ),
    timeline: [
      ...session.timeline,
      {
        id: `event-${session.revision + 1}`,
        at: now,
        actor: 'attacker',
        kind: 'permission',
        nature: definition.nature,
        message: `Solicitó permiso: ${definition.shortLabel}`,
      },
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

export function answerPermission(
  session: DemoSession,
  key: PermissionKey,
  status: Extract<PermissionStatus, 'granted' | 'denied'>,
  now = Date.now(),
): DemoSession {
  if (session.phase !== 'permissions') throw new Error('permission_out_of_phase');
  if (!hasStatus(session, key, 'requested')) throw new Error('permission_not_requested');
  const definition = permissionDefinitions[key];
  let next: DemoSession = {
    ...session,
    permissions: session.permissions.map((permission) =>
      permission.key === key ? { ...permission, status, respondedAt: now } : permission,
    ),
    timeline: [
      ...session.timeline,
      {
        id: `event-${session.revision + 1}`,
        at: now,
        actor: 'victim',
        kind: 'permission',
        nature: definition.nature,
        message: `${status === 'granted' ? 'Permitió' : 'Rechazó'}: ${definition.shortLabel}`,
      },
    ],
    score: session.score + (status === 'denied' ? (key === 'unattended' ? 20 : 5) : 0),
    revision: session.revision + 1,
    updatedAt: now,
  };
  next = { ...next, risk: calculateRisk(next) };
  if (key === 'screen' && status === 'denied') {
    next = safePermissionExit(next, now, 'Rechazó compartir pantalla; acceso bloqueado');
  } else if (key === 'keyboard' && status === 'denied') {
    next = {
      ...next,
      previousPhase: 'permissions',
      phase: 'reveal',
      outcome: 'moderate',
      timeline: [
        ...next.timeline,
        {
          id: `event-${next.revision + 1}`,
          at: now,
          actor: 'system',
          kind: 'phase',
          nature: 'educational',
          message: 'Ruta moderada: pantalla visible, control rechazado',
        },
      ],
      revision: next.revision + 1,
    };
  }
  return next;
}

function safePermissionExit(session: DemoSession, now: number, message: string): DemoSession {
  return finalizeSession(
    {
      ...session,
      previousPhase: 'permissions',
      phase: 'result',
      outcome: 'safe',
      status: 'complete',
      score: session.score + 15,
      timeline: [
        ...session.timeline,
        {
          id: `event-${session.revision + 1}`,
          at: now,
          actor: 'system',
          kind: 'phase',
          nature: 'educational',
          message,
        },
      ],
      revision: session.revision + 1,
    },
    now,
  );
}

function hasStatus(session: DemoSession, key: PermissionKey, status: PermissionStatus): boolean {
  return session.permissions.some(
    (permission) => permission.key === key && permission.status === status,
  );
}

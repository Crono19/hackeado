import { canRequestPermission, requestPermission } from './permissions.js';
import { updateRemoteStatus } from './session.js';
import { cancelSimulationQueue } from './simulation.js';
import type {
  AttackerActionDefinition,
  AttackerActionId,
  DemoSession,
  PermissionKey,
} from './types.js';

export const attackerActions: AttackerActionDefinition[] = [
  {
    id: 'scan_case',
    label: 'Analizar reacción',
    description: 'Registra que operador observó apertura y señales revisadas.',
    nature: 'educational',
    highImpact: false,
    allowedPhases: ['bait', 'decision'],
  },
  permissionAction('request_screen', 'screen', 'Solicitar pantalla'),
  permissionAction('request_keyboard', 'keyboard', 'Solicitar control', true),
  permissionAction('request_clipboard', 'clipboard', 'Solicitar portapapeles'),
  permissionAction('request_files', 'files', 'Solicitar archivos', true),
  permissionAction('request_microphone', 'microphone', 'Simular micrófono', true),
  permissionAction('request_camera', 'camera', 'Simular cámara', true),
  permissionAction('request_unattended', 'unattended', 'Simular acceso permanente', true),
  {
    id: 'mark_remote_ready',
    label: 'Canal WebRTC preparado',
    description: 'Confirma que la víctima puede iniciar la captura visible.',
    nature: 'real',
    highImpact: false,
    allowedPhases: ['connecting'],
  },
  {
    id: 'confirm_screen',
    label: 'Confirmar pantalla compartida',
    description: 'Marca que el video WebRTC llegó de forma visible al panel atacante.',
    nature: 'real',
    highImpact: true,
    allowedPhases: ['connecting'],
  },
  {
    id: 'confirm_control',
    label: 'Confirmar control concedido',
    description: 'Habilita mouse y teclado únicamente dentro del escritorio web de HACKEADO.',
    nature: 'real',
    highImpact: true,
    allowedPhases: ['connecting'],
  },
  {
    id: 'end_remote',
    label: 'Terminar acceso',
    description: 'Confirma cierre manual y bloquea acciones posteriores.',
    nature: 'real',
    highImpact: true,
    allowedPhases: ['connecting', 'controlled', 'reveal', 'containment', 'recovery'],
  },
];

const permissionByAction: Partial<Record<AttackerActionId, PermissionKey>> = {
  request_screen: 'screen',
  request_keyboard: 'keyboard',
  request_clipboard: 'clipboard',
  request_files: 'files',
  request_microphone: 'microphone',
  request_camera: 'camera',
  request_unattended: 'unattended',
};

export function getAvailableAttackerActions(session: DemoSession): AttackerActionDefinition[] {
  return attackerActions.filter((action) => {
    if (!action.allowedPhases.includes(session.phase)) return false;
    const permission = permissionByAction[action.id];
    if (permission) return canRequestPermission(session, permission);
    if (action.id === 'scan_case') {
      return !session.timeline.some((event) => event.message === action.label);
    }
    if (action.id === 'mark_remote_ready') return session.remote.status === 'idle';
    if (action.id === 'confirm_screen') return session.remote.status === 'ready';
    if (action.id === 'confirm_control') {
      return (
        session.remote.status === 'screen' &&
        granted(session, 'screen') &&
        granted(session, 'keyboard')
      );
    }
    if (action.id === 'end_remote') {
      return !['idle', 'ending', 'ended'].includes(session.remote.status);
    }
    return false;
  });
}

export function executeAttackerAction(
  session: DemoSession,
  actionId: AttackerActionId,
  now = Date.now(),
): DemoSession {
  const action = getAvailableAttackerActions(session).find(
    (candidate) => candidate.id === actionId,
  );
  if (!action) throw new Error('attacker_action_not_allowed');
  const permission = permissionByAction[actionId];
  if (permission) return requestPermission(session, permission, now);

  let next = session;
  if (actionId === 'mark_remote_ready') next = updateRemoteStatus(session, 'ready', now);
  if (actionId === 'confirm_screen') next = updateRemoteStatus(session, 'screen', now);
  if (actionId === 'confirm_control') next = updateRemoteStatus(session, 'control', now);
  if (actionId === 'end_remote') {
    next = cancelSimulationQueue(
      updateRemoteStatus(session, 'ending', now),
      'cierre remoto solicitado',
      now,
    );
  }
  return appendAction(next, action, now);
}

function permissionAction(
  id: AttackerActionId,
  key: PermissionKey,
  label: string,
  highImpact = false,
): AttackerActionDefinition {
  return {
    id,
    label,
    description: `Envía solicitud individual de ${key}; no activa capacidad del sistema.`,
    nature: key === 'screen' || key === 'keyboard' ? 'real' : 'simulated',
    highImpact,
    allowedPhases: ['permissions'],
  };
}

function appendAction(
  session: DemoSession,
  action: AttackerActionDefinition,
  now: number,
): DemoSession {
  return {
    ...session,
    timeline: [
      ...session.timeline,
      {
        id: `event-${session.revision + 1}`,
        at: now,
        actor: 'attacker',
        kind: 'action',
        nature: action.nature,
        message: action.label,
      },
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

function granted(session: DemoSession, key: PermissionKey): boolean {
  return session.permissions.some(
    (permission) => permission.key === key && permission.status === 'granted',
  );
}

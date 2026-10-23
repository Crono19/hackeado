import { calculateRisk } from './risk.js';
import { finalizeSession } from './scoring.js';
import { updateRemoteStatus } from './session.js';
import { cancelSimulationQueue } from './simulation.js';
import type { DemoSession, RecoveryStepKey, TimelineEvent } from './types.js';

export const recoveryOrder: RecoveryStepKey[] = [
  'disconnect_remote',
  'revoke_permissions',
  'secure_accounts',
  'close_sessions',
  'enable_mfa',
  'review_report',
];

export const recoveryDefinitions: Record<
  RecoveryStepKey,
  { index: string; label: string; detail: string; why: string; icon: string }
> = {
  disconnect_remote: {
    index: '01',
    label: 'Detener acceso remoto',
    detail: 'Finaliza la sesión visible antes de investigar.',
    why: 'Corta el control activo y evita nuevas acciones.',
    icon: '■',
  },
  revoke_permissions: {
    index: '02',
    label: 'Revocar permisos',
    detail: 'Retira pantalla, control y autorizaciones concedidas.',
    why: 'Cerrar la ventana no siempre elimina autorizaciones.',
    icon: '⊘',
  },
  secure_accounts: {
    index: '03',
    label: 'Cambiar contraseñas',
    detail: 'Usa otro dispositivo limpio y confiable.',
    why: 'El equipo afectado podría seguir exponiendo cambios.',
    icon: '⌁',
  },
  close_sessions: {
    index: '04',
    label: 'Cerrar sesiones abiertas',
    detail: 'Expulsa accesos activos desde panel de seguridad.',
    why: 'Cambiar contraseña no siempre cierra sesiones existentes.',
    icon: '×',
  },
  enable_mfa: {
    index: '05',
    label: 'Activar verificación en dos pasos',
    detail: 'Añade segunda prueba de identidad.',
    why: 'Reduce daño si una contraseña quedó expuesta.',
    icon: '02',
  },
  review_report: {
    index: '06',
    label: 'Revisar y reportar',
    detail: 'Documenta hechos e informa a docente, encargado o TI.',
    why: 'Permite contener otros equipos y recibir ayuda correcta.',
    icon: '↗',
  },
};

export function validateRecoveryOrder(
  session: DemoSession,
  order: RecoveryStepKey[],
  now = Date.now(),
): DemoSession {
  assertRecoveryPhase(session);
  if (new Set(order).size !== recoveryOrder.length) throw new Error('recovery_order_duplicate');
  const mismatchIndex = recoveryOrder.findIndex((step, index) => step !== order[index]);
  const correct = mismatchIndex === -1;
  return {
    ...session,
    recovery: {
      ...session.recovery,
      status: correct ? 'active' : 'ordering',
      orderValidated: correct,
      attempts: [
        ...session.recovery.attempts,
        { at: now, correct, mismatchIndex: correct ? undefined : mismatchIndex },
      ],
    },
    timeline: [
      ...session.timeline,
      event(
        session,
        now,
        correct
          ? 'Orden de recuperación validado'
          : `Intento de recuperación: revisar paso ${(mismatchIndex ?? 0) + 1}`,
      ),
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

export function requestRemoteStop(session: DemoSession, now = Date.now()): DemoSession {
  if (!['controlled', 'reveal', 'containment', 'recovery'].includes(session.phase)) {
    throw new Error('remote_stop_out_of_phase');
  }
  if (session.remote.status === 'ended') return session;
  let next = cancelSimulationQueue(session, 'víctima solicitó detener acceso', now);
  if (next.mode !== 'live' || next.remote.status === 'idle') {
    next = forceSimulatedEnd(next, now);
  } else if (next.remote.status !== 'ending') {
    next = updateRemoteStatus(next, 'ending', now);
  }
  return {
    ...next,
    recovery: { ...next.recovery, stopRequestedAt: now },
    timeline: [...next.timeline, event(next, now, 'Víctima solicitó detener acceso remoto')],
    revision: next.revision + 1,
    updatedAt: now,
  };
}

export function completeRecoveryStep(
  session: DemoSession,
  step: RecoveryStepKey,
  now = Date.now(),
): DemoSession {
  assertRecoveryPhase(session);
  if (!session.recovery.orderValidated) throw new Error('recovery_order_not_validated');
  const expected = recoveryOrder[session.recovery.completedSteps.length];
  if (step !== expected) throw new Error('recovery_step_out_of_order');
  if (step === 'disconnect_remote' && session.remote.status !== 'ended') {
    throw new Error('remote_must_be_ended');
  }
  let next: DemoSession = {
    ...session,
    recovery: {
      ...session.recovery,
      completedSteps: [...session.recovery.completedSteps, step],
    },
    timeline: [
      ...session.timeline,
      event(session, now, `Recuperación completada: ${recoveryDefinitions[step].label}`),
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
  if (step === 'revoke_permissions') {
    next = {
      ...next,
      permissions: next.permissions.map((permission) => ({
        ...permission,
        status:
          permission.status === 'granted' || permission.status === 'requested'
            ? 'denied'
            : permission.status,
        respondedAt:
          permission.status === 'granted' || permission.status === 'requested'
            ? now
            : permission.respondedAt,
      })),
    };
    next = { ...next, risk: calculateRisk(next) };
  }
  return next;
}

export function completeRecovery(session: DemoSession, now = Date.now()): DemoSession {
  assertRecoveryPhase(session);
  if (session.remote.status !== 'ended') throw new Error('remote_must_be_ended');
  if (!recoveryOrder.every((step) => session.recovery.completedSteps.includes(step))) {
    throw new Error('recovery_incomplete');
  }
  const next: DemoSession = {
    ...session,
    previousPhase: session.phase,
    phase: 'result',
    status: 'complete',
    recovery: { ...session.recovery, status: 'complete', completedAt: now },
    timeline: [...session.timeline, event(session, now, 'Control recuperado y reporte preparado')],
    revision: session.revision + 1,
    updatedAt: now,
  };
  return finalizeSession(next, now);
}

export function recoveryProgress(session: DemoSession): number {
  return Math.round((session.recovery.completedSteps.length / recoveryOrder.length) * 100);
}

function assertRecoveryPhase(session: DemoSession) {
  if (session.phase !== 'recovery') throw new Error('recovery_out_of_phase');
}

function forceSimulatedEnd(session: DemoSession, now: number): DemoSession {
  return {
    ...session,
    remote: {
      ...session.remote,
      status: 'ended',
      input: {
        ...session.remote.input,
        status: 'revoked',
        leaseId: undefined,
        expiresAt: undefined,
      },
      media: { ...session.remote.media, status: 'ended', endedAt: now },
      stopReason: 'victim',
      endedAt: now,
    },
    revision: session.revision + 1,
    updatedAt: now,
  };
}

function event(session: DemoSession, at: number, message: string): TimelineEvent {
  return {
    id: `event-recovery-${session.revision + 1}`,
    at,
    actor: 'victim',
    kind: 'action',
    nature: 'educational',
    message,
  };
}

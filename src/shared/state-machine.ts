import { createInitialSession, permissionIsGranted } from './session.js';
import { finalizeSession } from './scoring.js';
import { cancelSimulationQueue } from './simulation.js';
import {
  experiencePhases,
  type DemoSession,
  type ExperienceOutcome,
  type ExperiencePhase,
  type SessionStatus,
  type TimelineEvent,
} from './types.js';

export const phaseLabels: Record<ExperiencePhase, string> = {
  preparation: 'Preparación',
  waiting: 'En espera',
  profile: 'Perfil de víctima',
  bait: 'Engaño',
  decision: 'Decisión',
  permissions: 'Permisos',
  connecting: 'Conexión',
  controlled: 'Bajo control',
  reveal: 'Revelación',
  containment: 'Contención',
  recovery: 'Recuperación',
  result: 'Resultado',
  emergency: 'Parada de emergencia',
  reset: 'Reinicio',
};

export const phaseTransitions: Record<ExperiencePhase, readonly ExperiencePhase[]> = {
  preparation: ['waiting'],
  waiting: ['profile'],
  profile: ['bait'],
  bait: ['decision'],
  decision: ['permissions', 'result'],
  permissions: ['connecting', 'reveal'],
  connecting: ['controlled', 'reveal'],
  controlled: ['reveal'],
  reveal: ['containment'],
  containment: ['recovery'],
  recovery: ['result'],
  result: ['reset'],
  emergency: ['reset'],
  reset: ['preparation'],
};

export const emergencyEligiblePhases: readonly ExperiencePhase[] = experiencePhases.filter(
  (phase) => phase !== 'preparation' && phase !== 'emergency' && phase !== 'reset',
);

export interface TransitionOptions {
  outcome?: ExperienceOutcome;
  now?: number;
  reason?: string;
}

export class TransitionError extends Error {
  constructor(
    public readonly from: ExperiencePhase,
    public readonly to: ExperiencePhase,
    message: string,
  ) {
    super(message);
    this.name = 'TransitionError';
  }
}

export function isTransitionAllowed(from: ExperiencePhase, to: ExperiencePhase): boolean {
  return phaseTransitions[from].includes(to);
}

export function getAllowedTransitions(session: DemoSession): ExperiencePhase[] {
  return phaseTransitions[session.phase].filter(
    (target) =>
      target !== 'result' ||
      (session.recovery.status === 'complete' && session.remote.status === 'ended'),
  );
}

export function transitionSession(
  session: DemoSession,
  target: ExperiencePhase,
  options: TransitionOptions = {},
): DemoSession {
  if (!isTransitionAllowed(session.phase, target)) {
    throw new TransitionError(
      session.phase,
      target,
      `Invalid transition: ${session.phase} -> ${target}`,
    );
  }
  assertTransitionInvariants(session, target, options.outcome);
  const now = options.now ?? Date.now();
  const next: DemoSession = {
    ...session,
    previousPhase: session.phase,
    phase: target,
    outcome: resolveOutcome(session, target, options.outcome),
    status: resolveStatus(target),
    story:
      target === 'bait'
        ? {
            ...session.story,
            baitStartedAt: now,
            baitDeadlineAt: now + 45_000,
          }
        : session.story,
    recovery:
      target === 'recovery'
        ? { ...session.recovery, status: 'ordering', orderValidated: false }
        : session.recovery,
    timeline: [...session.timeline, createTimelineEvent(session, target, now, options.reason)],
    revision: session.revision + 1,
    updatedAt: now,
  };
  return target === 'result' ? finalizeSession(next, now) : next;
}

export function emergencyStopSession(session: DemoSession, now = Date.now()): DemoSession {
  if (!emergencyEligiblePhases.includes(session.phase)) {
    throw new TransitionError(
      session.phase,
      'emergency',
      `Emergency stop unavailable from ${session.phase}`,
    );
  }
  const cancelled = cancelSimulationQueue(session, 'parada de emergencia', now);
  return {
    ...cancelled,
    previousPhase: session.phase,
    phase: 'emergency',
    status: 'emergency',
    remote: {
      ...session.remote,
      status: 'ended',
      endedAt: now,
    },
    permissions: cancelled.permissions.map((permission) => ({
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
    timer: { ...cancelled.timer, status: 'paused', pausedAt: now },
    timeline: [
      ...cancelled.timeline,
      {
        id: `event-${cancelled.revision + 1}`,
        at: now,
        actor: 'system',
        kind: 'system',
        nature: 'educational',
        message: `Parada de emergencia activada desde ${phaseLabels[session.phase]}`,
      },
    ],
    revision: cancelled.revision + 1,
    updatedAt: now,
  };
}

export function resetSession(session: DemoSession, now = Date.now()): DemoSession {
  const clean = createInitialSession({
    id: session.id,
    pairingCode: session.pairingCode,
    scenarioId: session.scenarioId,
    mode: session.mode,
    now,
    ttlMs: Math.max(session.expiresAt - session.createdAt, 1),
  });
  return {
    ...clean,
    phase: 'reset',
    previousPhase: session.phase,
    status: 'resetting',
    revision: session.revision + 1,
    timeline: [
      {
        id: `event-${session.revision + 1}`,
        at: now,
        actor: 'system',
        kind: 'system',
        nature: 'educational',
        message: `Sesión restablecida desde ${phaseLabels[session.phase]}`,
      },
    ],
  };
}

function assertTransitionInvariants(
  session: DemoSession,
  target: ExperiencePhase,
  requestedOutcome?: ExperienceOutcome,
) {
  if (target === 'connecting' && !permissionIsGranted(session, 'screen')) {
    throw new TransitionError(session.phase, target, 'Screen permission must be granted first');
  }
  if (target === 'controlled') {
    const accessReady =
      permissionIsGranted(session, 'screen') && permissionIsGranted(session, 'keyboard');
    if (!accessReady || session.remote.status !== 'control') {
      throw new TransitionError(
        session.phase,
        target,
        'Controlled phase requires screen, keyboard, and confirmed remote control',
      );
    }
  }
  if (session.phase === 'decision' && target === 'result' && requestedOutcome !== 'safe') {
    throw new TransitionError(session.phase, target, 'Safe path must end with safe outcome');
  }
  if (
    (session.phase === 'permissions' || session.phase === 'connecting') &&
    target === 'reveal' &&
    requestedOutcome !== 'moderate'
  ) {
    throw new TransitionError(session.phase, target, 'Early reveal requires moderate outcome');
  }
  if (target === 'result' && session.phase === 'recovery' && session.outcome === 'pending') {
    throw new TransitionError(session.phase, target, 'Result requires a resolved outcome');
  }
  if (
    target === 'result' &&
    session.phase === 'recovery' &&
    (session.recovery.status !== 'complete' || session.remote.status !== 'ended')
  ) {
    throw new TransitionError(
      session.phase,
      target,
      'Result requires completed recovery and ended remote session',
    );
  }
}

function resolveOutcome(
  session: DemoSession,
  target: ExperiencePhase,
  requested?: ExperienceOutcome,
) {
  if (requested && requested !== 'pending') return requested;
  if (target === 'controlled') return 'compromised';
  return session.outcome;
}

function resolveStatus(target: ExperiencePhase): SessionStatus {
  if (target === 'result') return 'complete';
  if (target === 'emergency') return 'emergency';
  if (target === 'reset') return 'resetting';
  return 'active';
}

function createTimelineEvent(
  session: DemoSession,
  target: ExperiencePhase,
  now: number,
  reason?: string,
): TimelineEvent {
  return {
    id: `event-${session.revision + 1}`,
    at: now,
    actor: 'system',
    kind: 'phase',
    nature: 'educational',
    message: reason ?? `${phaseLabels[session.phase]} → ${phaseLabels[target]}`,
  };
}

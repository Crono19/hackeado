import { cancelSimulationQueue } from './simulation.js';
import { finalizeSession } from './scoring.js';
import { endRemoteMedia } from './remote-state.js';
import { transitionSession } from './state-machine.js';
import { startTimer } from './timer.js';
import type { DemoSession } from './types.js';

export function startExperience(session: DemoSession, now = Date.now()): DemoSession {
  if (session.phase !== 'preparation') throw new Error('session_already_started');
  return startTimer(
    transitionSession(session, 'waiting', { now, reason: 'Coordinación abrió la ronda' }),
    now,
  );
}

export function advanceAfterProfile(session: DemoSession, now = Date.now()): DemoSession {
  if (session.phase !== 'profile') throw new Error('profile_transition_invalid');
  return transitionSession(session, 'bait', {
    now,
    reason: 'Perfil ficticio listo; mensaje de soporte recibido',
  });
}

export function advanceAfterScreenConsent(session: DemoSession, now = Date.now()): DemoSession {
  const screenGranted = session.permissions.some(
    (permission) => permission.key === 'screen' && permission.status === 'granted',
  );
  const inputGranted = session.permissions.some(
    (permission) => permission.key === 'keyboard' && permission.status === 'granted',
  );
  const consentReady = session.mode !== 'live' && screenGranted && inputGranted;
  if (session.phase !== 'permissions' || !consentReady) return session;
  return transitionSession(session, 'connecting', {
    now,
    reason: 'Víctima permitió pantalla y control; conexión simulada iniciada automáticamente',
  });
}

export function advanceAfterCapture(session: DemoSession, now = Date.now()): DemoSession {
  if (
    session.mode !== 'live' ||
    session.phase !== 'permissions' ||
    session.remote.media.status !== 'negotiating'
  )
    return session;
  return transitionSession(session, 'connecting', {
    now,
    reason: 'Captura del escritorio activa; conexión nativa iniciada automáticamente',
  });
}

export function advanceAfterSimulatedControl(session: DemoSession, now = Date.now()): DemoSession {
  if (
    session.mode === 'live' ||
    session.phase !== 'connecting' ||
    session.remote.status !== 'control'
  )
    return session;
  return transitionSession(session, 'controlled', {
    now,
    outcome: 'compromised',
    reason: 'Control simulado confirmado por Atacante',
  });
}

export function advanceAfterControlStop(session: DemoSession, now = Date.now()): DemoSession {
  if (session.phase === 'controlled') {
    return transitionSession(session, 'reveal', {
      now,
      reason: 'Control detenido; se revela alcance del incidente',
    });
  }
  return session;
}

export function beginVictimRecovery(session: DemoSession, now = Date.now()): DemoSession {
  if (session.phase !== 'reveal') throw new Error('recovery_not_ready');
  const stopped =
    session.remote.status === 'ended' ? session : endRemoteMedia(session, 'victim', now);
  const contained = transitionSession(stopped, 'containment', {
    now,
    reason: 'Víctima inició contención',
  });
  return transitionSession(contained, 'recovery', {
    now,
    reason: 'Acceso detenido; recuperación habilitada',
  });
}

export function activateFallbackMode(session: DemoSession, now = Date.now()): DemoSession {
  let next = cancelSimulationQueue(session, 'respaldo audiovisual activado', now);
  if (!['idle', 'ended'].includes(next.remote.status))
    next = endRemoteMedia(next, 'coordinator', now);
  if (next.phase === 'controlled') {
    next = transitionSession(next, 'reveal', {
      now,
      reason: 'Fallo técnico: continúa respaldo audiovisual',
    });
  } else if (next.phase === 'permissions' || next.phase === 'connecting') {
    next = transitionSession(next, 'reveal', {
      now,
      outcome: 'moderate',
      reason: 'Fallo técnico: acceso real cancelado; continúa respaldo',
    });
  }
  return {
    ...next,
    mode: 'simulated',
    technical: { ...next.technical, fallbackActive: true },
    timeline: [
      ...next.timeline,
      {
        id: `event-fallback-${next.revision + 1}`,
        at: now,
        actor: 'coordinator',
        kind: 'system',
        nature: 'educational',
        message: 'Contingencia activada: reproducción local segura',
      },
    ],
    revision: next.revision + 1,
    updatedAt: now,
  };
}

export function finishExperience(session: DemoSession, now = Date.now()): DemoSession {
  if (session.phase === 'result') return session;
  let next = cancelSimulationQueue(session, 'sesión finalizada por coordinación', now);
  if (!['idle', 'ended'].includes(next.remote.status))
    next = endRemoteMedia(next, 'coordinator', now);
  const outcome =
    next.outcome === 'pending'
      ? next.story.decision?.route === 'continue'
        ? 'moderate'
        : 'safe'
      : next.outcome;
  const result: DemoSession = {
    ...next,
    previousPhase: next.phase,
    phase: 'result',
    outcome,
    status: 'complete',
    permissions: next.permissions.map((permission) =>
      permission.status === 'granted' || permission.status === 'requested'
        ? { ...permission, status: 'denied', respondedAt: now }
        : permission,
    ),
    timer: { ...next.timer, status: 'paused', pausedAt: now },
    timeline: [
      ...next.timeline,
      {
        id: `event-finish-${next.revision + 1}`,
        at: now,
        actor: 'coordinator',
        kind: 'system',
        nature: 'educational',
        message: 'Coordinación finalizó la ronda en estado seguro',
      },
    ],
    revision: next.revision + 1,
    updatedAt: now,
  };
  return finalizeSession(result, now);
}

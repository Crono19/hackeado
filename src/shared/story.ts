import { transitionSession } from './state-machine.js';
import { finalizeSession } from './scoring.js';
import type { DecisionChoice, DemoSession, StorySignalKey } from './types.js';

export function openSupportCase(session: DemoSession, now = Date.now()): DemoSession {
  if (session.phase !== 'bait') throw new Error('support_out_of_phase');
  const next = transitionSession(session, 'decision', {
    now,
    reason: 'La víctima abrió la solicitud de soporte',
  });
  return {
    ...next,
    story: { ...next.story, supportOpenedAt: now },
  };
}

export function examineSignal(
  session: DemoSession,
  signal: StorySignalKey,
  now = Date.now(),
): DemoSession {
  if (!['bait', 'decision'].includes(session.phase)) throw new Error('signal_out_of_phase');
  if (session.story.examinedSignals.includes(signal)) return session;
  return {
    ...session,
    story: {
      ...session.story,
      examinedSignals: [...session.story.examinedSignals, signal],
    },
    score: session.score + 10,
    timeline: [
      ...session.timeline,
      {
        id: `event-${session.revision + 1}`,
        at: now,
        actor: 'victim',
        kind: 'decision',
        nature: 'educational',
        message: `Examinó señal de alerta: ${signal}`,
      },
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

export function submitDecision(
  session: DemoSession,
  choice: DecisionChoice,
  now = Date.now(),
): DemoSession {
  if (session.phase !== 'decision') throw new Error('decision_out_of_phase');
  const safe = choice !== 'solve';
  const target = safe ? 'result' : 'permissions';
  const next = transitionSession(session, target, {
    now,
    outcome: safe ? 'safe' : undefined,
    reason:
      choice === 'solve'
        ? 'Aceptó continuar con soporte'
        : choice === 'verify'
          ? 'Verificó mediante canal oficial'
          : 'Pospuso y rechazó acceso inmediato',
  });
  const result: DemoSession = {
    ...next,
    story: {
      ...next.story,
      decision: { choice, route: safe ? 'safe' : 'continue', submittedAt: now },
    },
    score: next.score + (choice === 'verify' ? 20 : choice === 'postpone' ? 10 : 0),
    timeline: [
      ...next.timeline,
      {
        id: `event-${next.revision + 1}`,
        at: now,
        actor: 'victim',
        kind: 'decision',
        nature: 'educational',
        message: `Decisión registrada: ${choice}`,
      },
    ],
    revision: next.revision + 1,
  };
  return safe ? finalizeSession(result, now) : result;
}

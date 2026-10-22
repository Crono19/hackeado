import type { DemoSession, TimerState } from './types.js';

export const timerMilestones = [3, 6, 10, 14, 15] as const;

export function startTimer(session: DemoSession, now = Date.now()): DemoSession {
  if (session.timer.status === 'running') return session;
  const restarting = session.timer.status === 'finished';
  return withTimer(
    session,
    {
      ...session.timer,
      remainingSeconds: restarting ? session.timer.durationSeconds : session.timer.remainingSeconds,
      status: 'running',
      startedAt: restarting ? now : (session.timer.startedAt ?? now),
      lastTickAt: now,
      pausedAt: undefined,
      reachedMilestones: restarting ? [] : session.timer.reachedMilestones,
      quickClose: restarting ? false : session.timer.quickClose,
    },
    now,
    'Cronómetro iniciado',
  );
}

export function pauseTimer(session: DemoSession, now = Date.now()): DemoSession {
  const ticked = tickTimer(session, now).session;
  if (ticked.timer.status !== 'running') return ticked;
  return withTimer(
    ticked,
    { ...ticked.timer, status: 'paused', pausedAt: now, lastTickAt: now },
    now,
    'Experiencia pausada',
  );
}

export function resumeTimer(session: DemoSession, now = Date.now()): DemoSession {
  if (session.timer.status !== 'paused') return session;
  return withTimer(
    session,
    { ...session.timer, status: 'running', pausedAt: undefined, lastTickAt: now },
    now,
    'Experiencia reanudada',
  );
}

export function tickTimer(
  session: DemoSession,
  now = Date.now(),
): { session: DemoSession; milestones: number[] } {
  if (session.timer.status !== 'running') return { session, milestones: [] };
  const last = session.timer.lastTickAt ?? session.timer.startedAt ?? now;
  const elapsedSeconds = Math.max(0, Math.floor((now - last) / 1000));
  if (elapsedSeconds === 0) return { session, milestones: [] };
  const elapsedExperienceSeconds = elapsedSeconds * session.timer.speed;
  const remainingSeconds = Math.max(0, session.timer.remainingSeconds - elapsedExperienceSeconds);
  const elapsedMinutes = (session.timer.durationSeconds - remainingSeconds) / 60;
  const milestones = timerMilestones.filter(
    (minute) => elapsedMinutes >= minute && !session.timer.reachedMilestones.includes(minute),
  );
  const timer: TimerState = {
    ...session.timer,
    remainingSeconds,
    status: remainingSeconds === 0 ? 'finished' : 'running',
    lastTickAt: last + elapsedSeconds * 1000,
    reachedMilestones: [...session.timer.reachedMilestones, ...milestones],
  };
  return {
    session: { ...session, timer, revision: session.revision + 1, updatedAt: now },
    milestones,
  };
}

export function activateQuickClose(session: DemoSession, now = Date.now()): DemoSession {
  const remainingSeconds = Math.min(session.timer.remainingSeconds, 120);
  return withTimer(
    session,
    {
      ...session.timer,
      remainingSeconds,
      quickClose: true,
      status: remainingSeconds ? 'running' : 'finished',
      lastTickAt: now,
    },
    now,
    'Cierre rápido activado: salto a la revelación educativa',
    session.phase === 'reveal' ||
      session.phase === 'containment' ||
      session.phase === 'recovery' ||
      session.phase === 'result'
      ? undefined
      : 'reveal',
  );
}

function withTimer(
  session: DemoSession,
  timer: TimerState,
  now: number,
  message: string,
  phase?: DemoSession['phase'],
): DemoSession {
  return {
    ...session,
    previousPhase: phase ? session.phase : session.previousPhase,
    phase: phase ?? session.phase,
    timer,
    timeline: [
      ...session.timeline,
      {
        id: `event-${session.revision + 1}`,
        at: now,
        actor: 'system',
        kind: 'system',
        nature: 'educational',
        message,
      },
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

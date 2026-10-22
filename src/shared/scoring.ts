import type { DemoSession, ScoreFeedbackItem, SessionSummary } from './types.js';

export function buildScoreFeedback(session: DemoSession): ScoreFeedbackItem[] {
  const status = (key: string) => session.permissions.find((item) => item.key === key)?.status;
  return [
    item(
      'inspect',
      'Examinar remitente',
      10,
      session.story.examinedSignals.includes('sender'),
      'Revisar quién escribe descubre identidades inconsistentes.',
    ),
    item(
      'verify',
      'Verificar por canal oficial',
      20,
      session.story.decision?.choice === 'verify',
      'Contactar a soporte por un canal conocido corta el engaño.',
    ),
    item(
      'persistence',
      'Rechazar acceso permanente',
      20,
      status('unattended') === 'denied',
      'Impedir acceso recordado evita regresos posteriores.',
    ),
    item(
      'stop',
      'Detener la sesión',
      20,
      session.remote.status === 'ended' || session.status === 'emergency',
      'Cerrar el acceso recupera control inmediato.',
    ),
    item(
      'protect',
      'Proteger cuentas desde otro dispositivo',
      10,
      session.recovery.completedSteps.includes('secure_accounts'),
      'Cambiar desde equipo seguro protege credenciales expuestas.',
    ),
    item(
      'sessions',
      'Cerrar sesiones abiertas',
      10,
      session.recovery.completedSteps.includes('close_sessions'),
      'Expulsar sesiones activas corta accesos que ya estaban abiertos.',
    ),
    item(
      'report',
      'Reportar el incidente',
      10,
      session.recovery.completedSteps.includes('review_report'),
      'Informar a docente, encargado o TI ayuda a contener el incidente.',
    ),
  ];
}

export function calculateScore(session: DemoSession): number {
  return buildScoreFeedback(session)
    .filter((item) => item.achieved)
    .reduce((total, item) => total + item.points, 0);
}

export function finalizeSession(session: DemoSession, now = Date.now()): DemoSession {
  const outcome = session.outcome === 'pending' ? 'compromised' : session.outcome;
  const feedback = buildScoreFeedback(session);
  const summary: SessionSummary = {
    generatedAt: now,
    outcome,
    score: feedback.filter((item) => item.achieved).reduce((sum, item) => sum + item.points, 0),
    maxScore: feedback.reduce((sum, item) => sum + item.points, 0),
    headline: {
      safe: 'Verificaste antes de entregar acceso.',
      moderate: 'Pudieron observar, pero no tomar control.',
      compromised: 'Permisos acumulados entregaron el dispositivo.',
    }[outcome],
    keyMoment:
      session.story.decision?.choice === 'verify'
        ? 'El ataque se detuvo al usar un canal oficial.'
        : session.story.decision?.choice === 'postpone'
          ? 'El ataque se detuvo al no actuar bajo presión.'
          : 'El punto de quiebre fue aceptar soporte sin verificar.',
    feedback,
    prevention: [
      'Verifica identidad usando un canal oficial independiente.',
      'Lee cada permiso y concede solo lo indispensable.',
      'Detén acceso, desconecta y reporta ante cualquier duda.',
    ],
    eventCounts: {
      real: session.timeline.filter((event) => event.nature === 'real').length,
      simulated: session.timeline.filter((event) => event.nature === 'simulated').length,
      educational: session.timeline.filter((event) => event.nature === 'educational').length,
    },
  };
  return { ...session, outcome, score: summary.score, summary, updatedAt: now };
}

function item(
  id: string,
  label: string,
  points: number,
  achieved: boolean,
  explanation: string,
): ScoreFeedbackItem {
  return { id, label, points, achieved, explanation };
}

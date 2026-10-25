import { useState } from 'react';
import { socketEvents } from '../../shared/events';
import { recoveryDefinitions, recoveryOrder, recoveryProgress } from '../../shared/recovery';
import type { DemoSession, SocketAck } from '../../shared/types';
import { Button, StatusBadge } from './ui';

type Command = <T>(event: string, payload?: Record<string, unknown>) => Promise<SocketAck<T>>;

export function RecoveryChallenge({
  session,
  command,
  readOnly = false,
}: {
  session: DemoSession;
  command?: Command;
  readOnly?: boolean;
}) {
  const [feedback, setFeedback] = useState('');
  const progress = recoveryProgress(session);
  const nextStep = recoveryOrder[session.recovery.completedSteps.length];

  async function send<T>(event: string, payload?: Record<string, unknown>) {
    if (!command) return;
    const result = await command<T>(event, payload);
    setFeedback(result.ok ? '' : `BLOQUEADO // ${explainError(result.error)}`);
  }

  return (
    <section className={`recovery-protocol ${readOnly ? 'is-read-only' : ''}`} aria-live="polite">
      <header className="recovery-protocol__hero">
        <div>
          <p className="eyebrow">LOCKDOWN://RECOVERY_PROTOCOL</p>
          <h2>
            PROTOCOLO
            <br />
            <span>EN 6 PASOS.</span>
          </h2>
          <p>
            La respuesta correcta ya está ordenada. Avanza y comprende por qué importa cada paso.
          </p>
        </div>
        <div className="recovery-gauge">
          <small>CONTROL RECUPERADO</small>
          <strong>{progress}</strong>
          <span>%</span>
          <div>
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <div className="recovery-steps" role="list" aria-label="Protocolo ordenado de recuperación">
        {recoveryOrder.map((step, index) => {
          const definition = recoveryDefinitions[step];
          const complete = session.recovery.completedSteps.includes(step);
          const active = nextStep === step;
          return (
            <article
              key={step}
              role="listitem"
              className={`${complete ? 'is-complete' : ''} ${active ? 'is-active' : ''}`}
            >
              <span>{definition.index}</span>
              <i>{complete ? '✓' : definition.icon}</i>
              <div>
                <strong>{definition.label}</strong>
                <small>{definition.why}</small>
              </div>
              {active &&
              !readOnly &&
              step === 'disconnect_remote' &&
              session.remote.status !== 'ended' ? (
                <Button
                  variant="danger"
                  disabled={session.remote.status === 'ending'}
                  onClick={() => void send(socketEvents.remoteStopRequest)}
                >
                  {session.remote.status === 'ending'
                    ? 'Esperando confirmación…'
                    : '■ Detener acceso ahora'}
                </Button>
              ) : active && !readOnly ? (
                <Button onClick={() => void send(socketEvents.recoveryStep, { step })}>
                  {index === recoveryOrder.length - 1 ? 'Completar' : 'Siguiente'} <span>→</span>
                </Button>
              ) : (
                <StatusBadge tone={complete ? 'ok' : active ? 'warning' : 'neutral'}>
                  {complete ? 'HECHO' : active ? 'AHORA' : 'SIGUE'}
                </StatusBadge>
              )}
            </article>
          );
        })}
      </div>

      {feedback && <output className="recovery-feedback">{feedback}</output>}

      <footer className="recovery-contacts">
        <span>REPORTA A</span>
        <strong>Docente · encargado del laboratorio · equipo de TI</strong>
        <small>No ocultes el incidente. Reportar permite proteger a otras personas.</small>
      </footer>
    </section>
  );
}

function explainError(error?: string) {
  const messages: Record<string, string> = {
    remote_must_be_ended: 'primero debe terminar y confirmarse sesión remota',
    recovery_step_out_of_order: 'completa paso activo antes de avanzar',
    recovery_incomplete: 'faltan acciones de recuperación',
  };
  return messages[error ?? ''] ?? error ?? 'acción rechazada';
}

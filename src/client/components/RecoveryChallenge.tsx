import { useState } from 'react';
import { socketEvents } from '../../shared/events';
import { recoveryDefinitions, recoveryOrder, recoveryProgress } from '../../shared/recovery';
import type { DemoSession, RecoveryStepKey, SocketAck } from '../../shared/types';
import { Button, StatusBadge } from './ui';

type Command = <T>(event: string, payload?: Record<string, unknown>) => Promise<SocketAck<T>>;

const shuffledStart: RecoveryStepKey[] = [
  'secure_accounts',
  'review_report',
  'disconnect_remote',
  'enable_mfa',
  'revoke_permissions',
  'close_sessions',
];

export function RecoveryChallenge({
  session,
  command,
  readOnly = false,
}: {
  session: DemoSession;
  command?: Command;
  readOnly?: boolean;
}) {
  const [order, setOrder] = useState<RecoveryStepKey[]>(shuffledStart);
  const [dragging, setDragging] = useState<RecoveryStepKey | null>(null);
  const [feedback, setFeedback] = useState('');
  const progress = recoveryProgress(session);
  const nextStep = recoveryOrder[session.recovery.completedSteps.length];
  const lastAttempt = session.recovery.attempts.at(-1);

  const visibleFeedback = feedback
    ? feedback
    : lastAttempt
      ? lastAttempt.correct
        ? 'SECUENCIA VALIDADA // Ejecuta protocolo.'
        : `ORDEN INCORRECTO // Revisa posición ${(lastAttempt.mismatchIndex ?? 0) + 1}.`
      : 'Ordena respuesta desde contención inmediata hasta reporte.';

  function move(step: RecoveryStepKey, delta: number) {
    setOrder((current) => {
      const from = current.indexOf(step);
      const to = Math.max(0, Math.min(current.length - 1, from + delta));
      if (from === to) return current;
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, step);
      return next;
    });
  }

  function drop(target: RecoveryStepKey) {
    if (!dragging || dragging === target) return;
    setOrder((current) => {
      const next = current.filter((step) => step !== dragging);
      next.splice(current.indexOf(target), 0, dragging);
      return next;
    });
    setDragging(null);
  }

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
            RECUPERA
            <br />
            <span>EL CONTROL.</span>
          </h2>
          <p>Detectar no basta. Contén, protege y reporta en orden.</p>
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

      {!session.recovery.orderValidated && !readOnly ? (
        <>
          <div className="recovery-sort" role="list" aria-label="Orden de recuperación">
            {order.map((step, index) => {
              const definition = recoveryDefinitions[step];
              return (
                <article
                  key={step}
                  role="listitem"
                  draggable
                  onDragStart={() => setDragging(step)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => drop(step)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <i>{definition.icon}</i>
                  <div>
                    <strong>{definition.label}</strong>
                    <small>{definition.detail}</small>
                  </div>
                  <nav aria-label={`Mover ${definition.label}`}>
                    <button type="button" onClick={() => move(step, -1)} aria-label="Mover arriba">
                      ↑
                    </button>
                    <button type="button" onClick={() => move(step, 1)} aria-label="Mover abajo">
                      ↓
                    </button>
                  </nav>
                </article>
              );
            })}
          </div>
          <div className="recovery-submit">
            <output>{visibleFeedback}</output>
            <Button onClick={() => void send(socketEvents.recoveryOrder, { order })}>
              Validar secuencia <span>→</span>
            </Button>
          </div>
        </>
      ) : (
        <div className="recovery-steps">
          {recoveryOrder.map((step) => {
            const definition = recoveryDefinitions[step];
            const complete = session.recovery.completedSteps.includes(step);
            const active = nextStep === step;
            return (
              <article
                key={step}
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
                    Confirmar paso
                  </Button>
                ) : (
                  <StatusBadge tone={complete ? 'ok' : active ? 'warning' : 'neutral'}>
                    {complete ? 'HECHO' : active ? 'AHORA' : 'DESPUÉS'}
                  </StatusBadge>
                )}
              </article>
            );
          })}
        </div>
      )}

      {progress === 100 && !readOnly && (
        <div className="recovery-finish">
          <div>
            <small>PROTOCOLO COMPLETO</small>
            <strong>Control listo para recuperarse.</strong>
          </div>
          <Button onClick={() => void send(socketEvents.recoveryComplete)}>
            RECUPERAR CONTROL
          </Button>
        </div>
      )}

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

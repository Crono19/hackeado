import { useState } from 'react';
import { createInitialSession, updatePermission, updateRemoteStatus } from '../../shared/session';
import {
  emergencyEligiblePhases,
  emergencyStopSession,
  getAllowedTransitions,
  phaseLabels,
  resetSession,
  transitionSession,
} from '../../shared/state-machine';
import { experiencePhases, type DemoSession, type ExperiencePhase } from '../../shared/types';

const initialDebugSession = () =>
  createInitialSession({
    id: 'debug-session',
    pairingCode: '031337',
    mode: 'rehearsal',
  });

export function StateMachineDebug() {
  const [session, setSession] = useState<DemoSession>(initialDebugSession);
  const [error, setError] = useState<string | null>(null);

  function moveTo(target: ExperiencePhase) {
    try {
      const outcome =
        session.phase === 'decision' && target === 'result'
          ? 'safe'
          : (session.phase === 'permissions' || session.phase === 'connecting') &&
              target === 'reveal'
            ? 'moderate'
            : undefined;
      setSession(transitionSession(session, target, { outcome }));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Transición rechazada');
    }
  }

  function updateAccess(kind: 'screen' | 'keyboard') {
    setSession(updatePermission(session, kind, 'granted'));
    setError(null);
  }

  function emergencyStop() {
    try {
      setSession(emergencyStopSession(session));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Parada no disponible');
    }
  }

  return (
    <section className="debug-console" aria-labelledby="debug-title">
      <div className="debug-header">
        <div>
          <p className="eyebrow">SYS://DOMAIN_CORE · READ/WRITE LAB</p>
          <h1 id="debug-title" data-text="State machine">
            State machine
          </h1>
        </div>
        <div className="live-stamp">
          <span aria-hidden="true" /> LIVE SPEC
        </div>
      </div>

      <div className="phase-rail" aria-label="Fases de experiencia">
        {experiencePhases.map((phase, index) => (
          <div
            className={`phase-node ${session.phase === phase ? 'phase-node--active' : ''}`}
            key={phase}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{phaseLabels[phase]}</strong>
          </div>
        ))}
      </div>

      <div className="debug-grid">
        <article className="debug-module debug-module--primary">
          <header className="module-heading">
            <span>01</span>
            <h2>Estado autoritativo</h2>
          </header>
          <div className="telemetry-grid">
            <Telemetry label="Fase" value={phaseLabels[session.phase]} accent />
            <Telemetry label="Resultado" value={session.outcome} />
            <Telemetry label="Estado" value={session.status} />
            <Telemetry
              label="Revisión"
              value={`#${session.revision.toString().padStart(3, '0')}`}
            />
            <Telemetry label="Código" value={session.pairingCode} />
            <Telemetry label="Control remoto" value={session.remote.status} />
          </div>

          <div className="control-block">
            <p className="control-label">Transiciones autorizadas</p>
            <div className="button-row">
              {getAllowedTransitions(session).map((target) => (
                <button className="console-button" key={target} onClick={() => moveTo(target)}>
                  {phaseLabels[target]} <span>→</span>
                </button>
              ))}
              {getAllowedTransitions(session).length === 0 && (
                <span className="empty-state">Sin salida directa</span>
              )}
            </div>
          </div>

          <div className="control-block">
            <p className="control-label">Preparar ruta comprometida</p>
            <div className="button-row">
              <button
                className="console-button console-button--quiet"
                onClick={() => updateAccess('screen')}
              >
                Conceder pantalla
              </button>
              <button
                className="console-button console-button--quiet"
                onClick={() => updateAccess('keyboard')}
              >
                Conceder teclado
              </button>
              <button
                className="console-button console-button--quiet"
                onClick={() => setSession(updateRemoteStatus(session, 'control'))}
              >
                Confirmar control
              </button>
            </div>
          </div>

          <div className="button-row button-row--danger">
            <button
              className="console-button console-button--danger"
              disabled={!emergencyEligiblePhases.includes(session.phase)}
              onClick={emergencyStop}
            >
              Detener emergencia
            </button>
            <button
              className="console-button console-button--reset"
              onClick={() => setSession(resetSession(session))}
            >
              Reset total
            </button>
          </div>

          <p
            className={`console-message ${error ? 'console-message--error' : ''}`}
            aria-live="polite"
          >
            {error ?? 'Motor listo. Toda mutación pasa por reglas de dominio.'}
          </p>
        </article>

        <article className="debug-module">
          <header className="module-heading">
            <span>02</span>
            <h2>Permisos</h2>
          </header>
          <div className="permission-stack">
            {session.permissions.map((permission) => (
              <div className="permission-line" key={permission.key}>
                <span className={`nature-tag nature-tag--${permission.nature}`}>
                  {permission.nature}
                </span>
                <strong>{permission.key}</strong>
                <span className={`permission-state permission-state--${permission.status}`}>
                  {permission.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="debug-module">
          <header className="module-heading">
            <span>03</span>
            <h2>Registro inmutable</h2>
          </header>
          <ol className="event-log">
            {session.timeline
              .slice(-7)
              .reverse()
              .map((event) => (
                <li key={event.id}>
                  <span>{event.id}</span>
                  <p>{event.message}</p>
                </li>
              ))}
            {session.timeline.length === 0 && (
              <li className="empty-state">Esperando primera transición…</li>
            )}
          </ol>
        </article>
      </div>

      <a className="back-link" href="/">
        ← Volver al mapa de paneles
      </a>
    </section>
  );
}

function Telemetry({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`telemetry ${accent ? 'telemetry--accent' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

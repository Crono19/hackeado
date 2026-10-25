import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getAvailableAttackerActions } from '../../../shared/attacker-actions';
import { socketEvents } from '../../../shared/events';
import { permissionDefinitions } from '../../../shared/permissions';
import { exposureIndex } from '../../../shared/risk';
import { availableSimulationActions, simulationActions } from '../../../shared/simulation';
import { phaseLabels } from '../../../shared/state-machine';
import type {
  AttackerActionDefinition,
  DemoSession,
  SimulationActionDefinition,
  SocketAck,
} from '../../../shared/types';
import { Countdown } from '../../components/Countdown';
import { RiskMeter } from '../../components/RiskMeter';
import { Timeline } from '../../components/Timeline';
import { Button, Modal, Panel, StatusBadge } from '../../components/ui';
import { AttackerWebRtcMonitor } from '../../components/WebRtcSession';
import { FallbackPlayback } from '../../components/FallbackPlayback';
import { AwarenessFinale } from '../../components/AwarenessFinale';

type Command = <T>(event: string, payload?: Record<string, unknown>) => Promise<SocketAck<T>>;

export function AttackerPanel({
  session,
  command,
  getSocket,
}: {
  session: DemoSession;
  command: Command;
  getSocket: () => Socket | null;
}) {
  const [pending, setPending] = useState<AttackerActionDefinition | null>(null);
  const [simPending, setSimPending] = useState<SimulationActionDefinition | null>(null);
  const [feedback, setFeedback] = useState('Consola sincronizada. Sin acción pendiente.');
  const actions = getAvailableAttackerActions(session);
  const exposure = exposureIndex(session.risk);
  const stopAction = actions.find((action) => action.id === 'end_remote');
  const simulations = availableSimulationActions(session);
  const pendingSimulations = session.simulation.queue.filter((item) =>
    ['queued', 'running'].includes(item.status),
  );

  if (session.phase === 'result') return <AwarenessFinale />;

  async function execute(action: AttackerActionDefinition) {
    const result = await command<DemoSession>(socketEvents.attackerAction, { action: action.id });
    setFeedback(
      result.ok
        ? `ACK // ${action.label.toUpperCase()} // ${action.nature.toUpperCase()}`
        : `RECHAZADO // ${explainAttackerError(result.error)}`,
    );
    setPending(null);
  }

  async function enqueueSimulation(action: SimulationActionDefinition) {
    const result = await command<DemoSession>(socketEvents.simulationEnqueue, {
      action: action.id,
      confirmed: true,
    });
    setFeedback(
      result.ok
        ? `COLA // ${action.label.toUpperCase()} // SIMULADO`
        : `RECHAZADO // ${explainAttackerError(result.error)}`,
    );
    setSimPending(null);
  }

  return (
    <section className="intrusion-console" aria-label="Centro de control narrativo del atacante">
      <header className="attacker-target">
        <div className="attacker-target__identity">
          <span>TARGET://FICTIONAL_ID</span>
          <h2>{session.victimProfile?.alias ?? 'OBJETIVO EN ESPERA'}</h2>
          <p>WINDOWS · INSTITUTO NOVA · SESIÓN {session.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="attacker-target__risk">
          <small>EXPOSURE INDEX</small>
          <strong>{String(exposure).padStart(2, '0')}</strong>
          <span>/100 NARRATIVO</span>
        </div>
        <div className="attacker-target__status">
          <StatusBadge tone={session.remote.status === 'control' ? 'danger' : 'warning'}>
            {session.remote.status}
          </StatusBadge>
          <strong>{phaseLabels[session.phase]}</strong>
          {stopAction && (
            <Button variant="danger" onClick={() => setPending(stopAction)}>
              ■ Terminar acceso
            </Button>
          )}
        </div>
      </header>

      <div className="attacker-telemetry" aria-label="Telemetría de sesión">
        <span>
          <i /> SOCKET ACTIVO
        </span>
        <span>MODE::{session.mode.toUpperCase()}</span>
        <span>REMOTE::{session.remote.status.toUpperCase()}</span>
        <span>DECISION::{session.story.decision?.choice.toUpperCase() ?? 'PENDING'}</span>
        <span>REV::{String(session.revision).padStart(3, '0')}</span>
      </div>

      {session.technical.fallbackActive ? (
        <FallbackPlayback />
      ) : (
        <AttackerWebRtcMonitor session={session} getSocket={getSocket} />
      )}

      <div className="attacker-dock">
        <details open>
          <summary>
            ACCIONES DE ESCENA <b>{actions.length}</b>
          </summary>
          <Panel className="action-console" label="OPS://AUTHORIZED_ONLY">
            <div className="action-stack">
              {actions
                .filter((action) => action.id !== 'end_remote')
                .map((action, index) => (
                  <button
                    type="button"
                    key={action.id}
                    onClick={() => (action.highImpact ? setPending(action) : void execute(action))}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{action.label}</strong>
                      <small>{action.description}</small>
                    </div>
                    <b className={`nature-pill nature-pill--${action.nature}`}>{action.nature}</b>
                    <i>→</i>
                  </button>
                ))}
              {actions.filter((action) => action.id !== 'end_remote').length === 0 && (
                <div className="action-empty">
                  <i /> Esperando cambio de escena.
                </div>
              )}
            </div>
            <output className="operator-ack" aria-live="polite">
              {feedback}
            </output>
          </Panel>
        </details>

        <details>
          <summary>
            IMPACTO SIMULADO <b>{pendingSimulations.length}</b>
          </summary>
          <Panel className="simulation-console" label="SIM://FICTION_ONLY">
            <div className="simulation-progress">
              <span>EXPOSICIÓN NARRATIVA</span>
              <div>
                <i style={{ width: `${session.simulation.exposedPercent}%` }} />
              </div>
              <strong>{session.simulation.exposedPercent}%</strong>
            </div>
            <div className="simulation-action-grid">
              {simulations.map((action) => (
                <button type="button" key={action.id} onClick={() => setSimPending(action)}>
                  <span>SIM</span>
                  <strong>{action.label}</strong>
                  <small>{action.durationMs / 1000}s</small>
                </button>
              ))}
            </div>
            {pendingSimulations.length > 0 && (
              <div className="simulation-queue">
                {pendingSimulations.map((item) => (
                  <span key={item.id} className={`is-${item.status}`}>
                    <i /> {simulationActions[item.actionId].label} · {item.status}
                  </span>
                ))}
                <Button variant="ghost" onClick={() => command(socketEvents.simulationCancel)}>
                  Cancelar cola
                </Button>
              </div>
            )}
          </Panel>
        </details>

        <details>
          <summary>
            INTELIGENCIA DE SESIÓN <b>{session.timeline.length}</b>
          </summary>
          <div className="attacker-intel-grid">
            <Panel className="attacker-permissions" label="ACCESS://SURFACE">
              <div className="attacker-permission-grid">
                {session.permissions.map((permission, index) => {
                  const definition = permissionDefinitions[permission.key];
                  return (
                    <article
                      key={permission.key}
                      className={`permission-node permission-node--${permission.status}`}
                    >
                      <header>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <i>{definition.icon}</i>
                        <StatusBadge
                          tone={
                            permission.status === 'granted'
                              ? 'danger'
                              : permission.status === 'denied'
                                ? 'ok'
                                : permission.status === 'requested'
                                  ? 'warning'
                                  : 'neutral'
                          }
                        >
                          {permission.status}
                        </StatusBadge>
                      </header>
                      <strong>{definition.shortLabel}</strong>
                      <p>{definition.actualImpact}</p>
                    </article>
                  );
                })}
              </div>
            </Panel>
            <Panel className="attacker-risk" label="IMPACT://NARRATIVE">
              <RiskMeter risk={session.risk} />
            </Panel>
            <Panel className="attacker-clock" label="SESSION://WINDOW">
              <Countdown seconds={session.timer.remainingSeconds} label="Tiempo restante" />
              <dl>
                <div>
                  <dt>Pantalla</dt>
                  <dd>{permissionStatus(session, 'screen')}</dd>
                </div>
                <div>
                  <dt>Control</dt>
                  <dd>{permissionStatus(session, 'keyboard')}</dd>
                </div>
              </dl>
            </Panel>
            <Panel className="attacker-trace" label="TRACE://LIVE">
              <Timeline events={session.timeline.slice(-6)} />
            </Panel>
          </div>
        </details>
      </div>

      <Modal
        open={Boolean(pending)}
        title="Confirmar acción narrativa"
        onClose={() => setPending(null)}
      >
        {pending && (
          <div className="action-confirm">
            <span className={`nature-pill nature-pill--${pending.nature}`}>{pending.nature}</span>
            <h3>{pending.label}</h3>
            <p>{pending.description}</p>
            <p>
              <strong>No ejecuta comandos del sistema.</strong> Registra o representa estado
              educativo autorizado.
            </p>
            <Button
              variant={pending.id === 'end_remote' ? 'danger' : 'primary'}
              onClick={() => execute(pending)}
            >
              Confirmar y registrar
            </Button>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(simPending)}
        title="Confirmar efecto completamente simulado"
        onClose={() => setSimPending(null)}
      >
        {simPending && (
          <div className="action-confirm">
            <span className="nature-pill nature-pill--simulated">SIMULADO</span>
            <h3>{simPending.label}</h3>
            <p>{simPending.description}</p>
            <p>
              <strong>No solicita cámara, micrófono, portapapeles ni archivos.</strong> Solo anima
              contenido ficticio precargado.
            </p>
            <Button onClick={() => enqueueSimulation(simPending)}>Añadir a cola segura</Button>
          </div>
        )}
      </Modal>
    </section>
  );
}

function permissionStatus(session: DemoSession, key: 'screen' | 'keyboard') {
  return session.permissions.find((permission) => permission.key === key)?.status ?? 'idle';
}

function explainAttackerError(error?: string) {
  const messages: Record<string, string> = {
    attacker_action_not_allowed: 'esta acción no corresponde al estado actual',
    permission_dependency: 'primero debe permitirse la pantalla',
    socket_disconnected: 'servidor sin enlace; entrada quedó liberada',
    event_rate: 'demasiadas órdenes; espera unos segundos',
    ack_timeout: 'servidor tardó demasiado; no se activó control',
  };
  return messages[error ?? ''] ?? error ?? 'acción inválida';
}

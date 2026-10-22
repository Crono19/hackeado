import { useMemo, useState } from 'react';
import { socketEvents } from '../../../shared/events';
import { getAllowedTransitions, phaseLabels } from '../../../shared/state-machine';
import { timerMilestones } from '../../../shared/timer';
import type {
  DemoSession,
  RemoteChecklistKey,
  RemoteControlStatus,
  SessionCredentials,
  SocketAck,
} from '../../../shared/types';
import { Countdown } from '../../components/Countdown';
import { Button, Modal, Panel, StatusBadge } from '../../components/ui';

type Command = <T>(event: string, payload?: Record<string, unknown>) => Promise<SocketAck<T>>;

interface CoordinatorPanelProps {
  session: DemoSession;
  command: Command;
  onCredentials: (credentials: SessionCredentials) => void;
}

const remoteChecks: Array<{ key: RemoteChecklistKey; label: string }> = [
  { key: 'fictionalAccount', label: 'Cuenta ficticia exclusiva' },
  { key: 'personalSessionsClosed', label: 'Sesiones personales cerradas' },
  { key: 'unattendedDisabled', label: 'Acceso desatendido desactivado' },
  { key: 'fileTransferDisabled', label: 'Transferencia de archivos desactivada' },
  { key: 'clipboardDisabled', label: 'Portapapeles compartido desactivado' },
  { key: 'elevationDisabled', label: 'Elevación administrativa desactivada' },
  { key: 'stopPathVisible', label: 'Botón Detener visible en Windows' },
];

const remoteFlow: RemoteControlStatus[] = ['idle', 'ready', 'screen', 'control', 'ending', 'ended'];

export function CoordinatorPanel({ session, command, onCredentials }: CoordinatorPanelProps) {
  const [confirm, setConfirm] = useState<'emergency' | 'reset' | 'quick' | null>(null);
  const [feedback, setFeedback] = useState('Sistema listo. Esperando orden.');
  const allowed = getAllowedTransitions(session);
  const elapsedMinutes = (session.timer.durationSeconds - session.timer.remainingSeconds) / 60;
  const connected = session.participants.filter(
    (participant) => participant.status === 'connected',
  );
  const readiness = useMemo(
    () => [
      { label: 'Servidor', ready: true, detail: `rev.${session.revision}` },
      {
        label: 'Víctima',
        ready: session.participants.some(
          (participant) => participant.role === 'victim' && participant.status === 'connected',
        ),
        detail: 'enlace vivo',
      },
      { label: 'Audio', ready: session.technical.soundReady, detail: 'cue local' },
      {
        label: 'Control remoto',
        ready: ['ready', 'screen', 'control'].includes(session.remote.status),
        detail: session.remote.status,
      },
    ],
    [session],
  );

  async function run<T>(event: string, payload: Record<string, unknown>, success: string) {
    const result = await command<T>(event, payload);
    setFeedback(result.ok ? success : `ERROR // ${result.error ?? 'orden rechazada'}`);
    return result;
  }

  async function transition(target: DemoSession['phase']) {
    const earlyReveal =
      target === 'reveal' && ['permissions', 'connecting'].includes(session.phase);
    await run(
      socketEvents.phaseRequest,
      earlyReveal ? { target, outcome: 'moderate' } : { target },
      `ESCENA // ${phaseLabels[target]}`,
    );
  }

  async function reset() {
    const result = await run<SessionCredentials>(
      socketEvents.sessionReset,
      {},
      'SESIÓN RESTABLECIDA',
    );
    if (result.ok && result.data) onCredentials(result.data);
    setConfirm(null);
  }

  async function setRemote(status: RemoteControlStatus) {
    await run(socketEvents.remoteStatus, { status }, `REMOTO // ${status.toUpperCase()}`);
  }

  function testSound() {
    const audio = new AudioContext();
    const gain = audio.createGain();
    const oscillator = audio.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(620, audio.currentTime);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.32);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.34);
    oscillator.addEventListener('ended', () => void audio.close());
    setFeedback('AUDIO // tono breve de comprobación reproducido');
  }

  return (
    <div className="command-center">
      <div className="command-center__signal" aria-hidden="true">
        <span>LIVE</span>
        <i />
        <b>{connected.length.toString().padStart(2, '0')} NODOS</b>
      </div>

      {session.timer.reachedMilestones.length > 0 && (
        <div className="command-cue-alert" role="status">
          <span>CUE {session.timer.reachedMilestones.at(-1)}:00</span>
          <strong>
            {session.timer.status === 'finished'
              ? 'Tiempo agotado. Cierra la ronda.'
              : 'Hito alcanzado. Comprueba el ritmo de la escena.'}
          </strong>
          <i>PRIVADO · COORDINACIÓN</i>
        </div>
      )}

      <Panel className="command-clock" label="MISSION://CLOCK">
        <div>
          <p className="eyebrow">TIEMPO AUTORITATIVO DEL SERVIDOR</p>
          <Countdown seconds={session.timer.remainingSeconds} label="Ventana de escena" />
        </div>
        <div className="command-clock__actions">
          {session.timer.status === 'running' ? (
            <Button
              variant="ghost"
              onClick={() => run(socketEvents.timerControl, { action: 'pause' }, 'RELOJ PAUSADO')}
            >
              Ⅱ Pausar
            </Button>
          ) : (
            <Button
              onClick={() =>
                run(
                  socketEvents.timerControl,
                  { action: session.timer.status === 'paused' ? 'resume' : 'start' },
                  session.timer.status === 'paused' ? 'RELOJ REANUDADO' : 'RELOJ INICIADO',
                )
              }
            >
              ▶ {session.timer.status === 'paused' ? 'Continuar' : 'Iniciar'}
            </Button>
          )}
          <StatusBadge tone={session.timer.quickClose ? 'danger' : 'info'}>
            {session.timer.quickClose ? 'CIERRE RÁPIDO' : session.timer.status}
          </StatusBadge>
        </div>
      </Panel>

      <div className="command-layout">
        <Panel className="scene-director" label="SCENE://DIRECTOR">
          <div className="section-heading">
            <div>
              <span>ESCENA ACTIVA</span>
              <h2>{phaseLabels[session.phase]}</h2>
            </div>
            <strong className="scene-director__index">
              {String(Object.keys(phaseLabels).indexOf(session.phase) + 1).padStart(2, '0')}
            </strong>
          </div>
          <div className="phase-rail">
            {Object.entries(phaseLabels).map(([phase, label]) => (
              <span
                key={phase}
                className={
                  phase === session.phase
                    ? 'is-active'
                    : allowed.includes(phase as DemoSession['phase'])
                      ? 'is-next'
                      : ''
                }
                title={label}
              />
            ))}
          </div>
          <div className="scene-director__next">
            <small>SIGUIENTES ÓRDENES PERMITIDAS</small>
            {allowed.map((phase) => {
              const blocker = transitionBlocker(session, phase);
              const earlyReveal =
                phase === 'reveal' && ['permissions', 'connecting'].includes(session.phase);
              return (
                <div className="scene-command" key={phase}>
                  <Button disabled={Boolean(blocker)} onClick={() => transition(phase)}>
                    {phase === 'waiting' ? 'Iniciar historia' : phaseLabels[phase]} <span>→</span>
                  </Button>
                  {(blocker || earlyReveal) && (
                    <small className={blocker ? 'is-blocked' : 'is-safe-exit'}>
                      {blocker ?? 'Salida segura: revela sin conceder control total.'}
                    </small>
                  )}
                </div>
              );
            })}
            {allowed.length === 0 && <p>Sin transición disponible.</p>}
          </div>
          <output className="command-feedback" aria-live="polite">
            {feedback}
          </output>
        </Panel>

        <Panel className="technical-matrix" label="SYSTEM://READINESS">
          <div className="section-heading">
            <div>
              <span>PREVUELO</span>
              <h2>Estado técnico</h2>
            </div>
          </div>
          <div className="readiness-grid">
            {readiness.map((item) => (
              <article key={item.label} className={item.ready ? 'is-ready' : ''}>
                <i />
                <div>
                  <strong>{item.label}</strong>
                  <small>
                    {item.ready ? 'LISTO' : 'PENDIENTE'} · {item.detail}
                  </small>
                </div>
              </article>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() =>
              run(
                socketEvents.technicalUpdate,
                { soundReady: !session.technical.soundReady },
                session.technical.soundReady ? 'AUDIO PENDIENTE' : 'AUDIO CONFIRMADO',
              )
            }
          >
            {session.technical.soundReady ? 'Marcar audio pendiente' : 'Confirmar prueba de audio'}
          </Button>
          <Button variant="ghost" onClick={testSound}>
            ◖ Probar tono
          </Button>
          <p className="audio-caption" aria-live="polite">
            SUBTÍTULO DE AUDIO // tono breve indica salida de sonido operativa
          </p>
          <div className="participant-stack">
            {session.participants.map((participant) => {
              const age = Math.max(
                0,
                Math.round((session.updatedAt - participant.lastSeenAt) / 1000),
              );
              return (
                <article key={participant.id}>
                  <span>{participant.role.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{participant.role}</strong>
                    <small>
                      {participant.status} · pulso hace {age}s
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel className="remote-safety" label="REMOTE://SAFETY_GATE">
          <div className="section-heading">
            <div>
              <span>DOBLE CONFIRMACIÓN</span>
              <h2>Transmisión real, límites visibles</h2>
            </div>
            <StatusBadge tone={session.mode === 'live' ? 'warning' : 'info'}>
              {session.mode}
            </StatusBadge>
          </div>
          <div className="remote-state-rail" aria-label="Estado de acceso remoto">
            {remoteFlow.map((state) => (
              <span key={state} className={state === session.remote.status ? 'is-active' : ''}>
                <i />
                {state}
              </span>
            ))}
          </div>
          <div className="remote-checklist">
            {remoteChecks.map((item) => (
              <label key={item.key}>
                <input
                  type="checkbox"
                  checked={session.technical.remoteChecklist[item.key]}
                  disabled={session.remote.status !== 'idle'}
                  onChange={(event) =>
                    void run(
                      socketEvents.remoteChecklistUpdate,
                      { item: item.key, checked: event.target.checked },
                      `CHECK // ${item.label}`,
                    )
                  }
                />
                <span>{item.label}</span>
                <b>✓</b>
              </label>
            ))}
          </div>
          <div className="remote-confirmations">
            {session.remote.status === 'idle' && (
              <Button onClick={() => void setRemote('ready')}>Armar canal WebRTC</Button>
            )}
            {session.remote.status === 'ready' && (
              <Button
                disabled={
                  session.permissions.find((item) => item.key === 'screen')?.status !== 'granted'
                }
                onClick={() => void setRemote('screen')}
              >
                Confirmar pantalla recibida
              </Button>
            )}
            {session.remote.status === 'screen' && (
              <Button
                disabled={
                  session.permissions.find((item) => item.key === 'keyboard')?.status !== 'granted'
                }
                onClick={() => void setRemote('control')}
              >
                Confirmar control web concedido
              </Button>
            )}
            {session.remote.status === 'control' && (
              <Button variant="danger" onClick={() => void setRemote('ending')}>
                ■ Solicitar cierre
              </Button>
            )}
            {session.remote.status === 'ending' && (
              <Button onClick={() => void setRemote('ended')}>Confirmar “sesión finalizada”</Button>
            )}
            {session.remote.status === 'ended' && (
              <StatusBadge tone="ok">ACCESO TERMINADO</StatusBadge>
            )}
          </div>
          <p className="stop-instruction">
            <strong>WINDOWS:</strong> pulsa <b>Detener transmisión</b> o usa el indicador nativo del
            navegador. Luego el coordinador confirma aquí. Nunca ocultar ese camino.
          </p>
        </Panel>

        <Panel className="milestone-panel" label="CUE://PRIVATE">
          <div className="section-heading">
            <div>
              <span>SOLO COORDINACIÓN</span>
              <h2>Hitos de dirección</h2>
            </div>
          </div>
          <ol>
            {timerMilestones.map((minute) => {
              const reached = elapsedMinutes >= minute;
              const copy = {
                3: 'El engaño debe estar planteado',
                6: 'Decisión y permisos en pantalla',
                10: 'Mostrar qué ocurre detrás',
                14: 'Cerrar con prevención y reacción',
                15: 'Fin obligatorio de la ronda',
              }[minute];
              return (
                <li key={minute} className={reached ? 'is-reached' : ''}>
                  <time>{String(minute).padStart(2, '0')}:00</time>
                  <span>{copy}</span>
                  <b>{reached ? '✓' : '·'}</b>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Panel className="safety-console" label="FAILSAFE://ARMED">
          <p>Órdenes críticas. Visibles solo en este panel.</p>
          <Button variant="ghost" onClick={() => setConfirm('quick')}>
            ↯ Cierre rápido
          </Button>
          <Button
            variant="ghost"
            disabled={!['idle', 'ended'].includes(session.remote.status)}
            onClick={() => setConfirm('reset')}
          >
            ↺ Reiniciar ronda
          </Button>
          <Button
            variant="danger"
            disabled={['preparation', 'emergency', 'reset'].includes(session.phase)}
            onClick={() => setConfirm('emergency')}
          >
            ■ PARADA DE EMERGENCIA
          </Button>
        </Panel>

        <Panel className="contingency-console" label="RESILIENCE://OFFLINE">
          <div className="section-heading">
            <div>
              <span>PLAN B EN UN CLIC</span>
              <h2>La historia continúa</h2>
            </div>
          </div>
          <div className="contingency-stats">
            <span>
              <small>MODO</small>
              <strong>{session.mode}</strong>
            </span>
            <span>
              <small>VELOCIDAD</small>
              <strong>×{session.timer.speed}</strong>
            </span>
            <span>
              <small>RESPALDO</small>
              <strong>{session.technical.fallbackActive ? 'ACTIVO' : 'LISTO'}</strong>
            </span>
          </div>
          <p>
            Si Windows pierde conexión, coordinación puede ejecutar toda la recuperación. El
            contenido audiovisual local sigue disponible.
          </p>
          <Button
            variant="ghost"
            onClick={() => void run(socketEvents.fallbackActivate, {}, 'RESPALDO LOCAL ACTIVADO')}
          >
            ◫ Activar respaldo local
          </Button>
          <a
            className="fallback-link"
            href="/fallback/respaldo.html"
            target="_blank"
            rel="noreferrer"
          >
            Abrir reproducción audiovisual offline ↗
          </a>
          <a
            className="fallback-link"
            href="/fallback/hackeado-respaldo.webm"
            target="_blank"
            rel="noreferrer"
          >
            Abrir video de emergencia WebM ↗
          </a>
        </Panel>
      </div>

      <Modal
        open={confirm === 'emergency'}
        title="¿Detener toda la experiencia?"
        onClose={() => setConfirm(null)}
      >
        <p>
          Finaliza el control, deniega permisos activos, pausa el reloj y muestra estado seguro en
          todos los paneles.
        </p>
        <Button
          variant="danger"
          onClick={async () => {
            await run(socketEvents.emergencyStop, {}, 'PARADA COMPLETADA');
            setConfirm(null);
          }}
        >
          Confirmar parada total
        </Button>
      </Modal>
      <Modal
        open={confirm === 'reset'}
        title="¿Preparar una ronda limpia?"
        onClose={() => setConfirm(null)}
      >
        <p>Revoca tokens de visitantes, crea código nuevo y elimina el estado temporal anterior.</p>
        <Button variant="danger" onClick={reset}>
          Reiniciar y rotar accesos
        </Button>
      </Modal>
      <Modal
        open={confirm === 'quick'}
        title="Activar cierre rápido"
        onClose={() => setConfirm(null)}
      >
        <p>Reduce la ventana a dos minutos y lleva todos los paneles a la revelación educativa.</p>
        <Button
          onClick={async () => {
            await run(socketEvents.quickClose, {}, 'CIERRE RÁPIDO ACTIVO');
            setConfirm(null);
          }}
        >
          Saltar a revelación
        </Button>
      </Modal>
    </div>
  );
}

function transitionBlocker(session: DemoSession, target: DemoSession['phase']) {
  if (target !== 'controlled') return null;
  const screen = session.permissions.find((item) => item.key === 'screen')?.status;
  const keyboard = session.permissions.find((item) => item.key === 'keyboard')?.status;
  if (screen !== 'granted') return 'Falta permitir Pantalla en Víctima.';
  if (keyboard !== 'granted') return 'Falta permitir Control en Víctima.';
  if (session.remote.status !== 'control') {
    return 'Completa: Armar WebRTC → Pantalla recibida → Control web.';
  }
  return null;
}

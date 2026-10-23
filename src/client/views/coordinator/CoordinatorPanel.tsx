import { useState } from 'react';
import { socketEvents } from '../../../shared/events';
import { phaseLabels } from '../../../shared/state-machine';
import type {
  DemoSession,
  ExperienceRole,
  SessionCredentials,
  SocketAck,
} from '../../../shared/types';
import { Countdown } from '../../components/Countdown';
import { Button, Modal, StatusBadge } from '../../components/ui';

type Command = <T>(event: string, payload?: Record<string, unknown>) => Promise<SocketAck<T>>;
type CriticalAction = 'emergency' | 'finish' | 'reset' | 'fallback' | null;

const presenceRoles: Array<{ role: ExperienceRole; code: string; label: string }> = [
  { role: 'coordinator', code: 'CO', label: 'Coordinación' },
  { role: 'victim', code: 'VI', label: 'Víctima' },
  { role: 'attacker', code: 'AT', label: 'Atacante' },
  { role: 'audience', code: 'PU', label: 'Público' },
];

export function CoordinatorLite({
  session,
  command,
  onCredentials,
}: {
  session: DemoSession;
  command: Command;
  onCredentials: (credentials: SessionCredentials) => void;
}) {
  const [confirm, setConfirm] = useState<CriticalAction>(null);
  const [feedback, setFeedback] = useState('AUTO:// flujo narrativo en espera');

  async function run<T>(event: string, payload: Record<string, unknown>, success: string) {
    const result = await command<T>(event, payload);
    setFeedback(result.ok ? success : `BLOQUEADO // ${explainCoordinatorError(result.error)}`);
    return result;
  }

  async function reset() {
    const result = await run<SessionCredentials>(socketEvents.sessionReset, {}, 'RESET COMPLETO');
    if (result.ok && result.data) onCredentials(result.data);
    setConfirm(null);
  }

  const activePhase = !['preparation', 'result', 'emergency', 'reset'].includes(session.phase);
  const remoteActive = !['idle', 'ended'].includes(session.remote.status);

  return (
    <section className="coordinator-lite" aria-label="Coordinación mínima de sesión">
      <header className="coordinator-lite__mast">
        <div>
          <span>CONTROL ROOM // AUTOMATION ONLINE</span>
          <h2>{phaseLabels[session.phase]}</h2>
          <p>Flujo normal automático. Coordinación observa, controla tiempo y protege.</p>
        </div>
        <div className="coordinator-lite__code">
          <small>CÓDIGO DE ACCESO</small>
          <strong>{session.pairingCode}</strong>
          <StatusBadge tone={session.mode === 'live' ? 'danger' : 'info'}>
            {session.mode}
          </StatusBadge>
        </div>
      </header>

      <div className="coordinator-lite__grid">
        <section className="coordinator-clock" aria-label="Tiempo de sesión">
          <span>MISSION://CLOCK</span>
          <Countdown seconds={session.timer.remainingSeconds} label="Tiempo restante" />
          <div>
            {session.phase === 'preparation' && (
              <Button onClick={() => void run(socketEvents.sessionStart, {}, 'RONDA INICIADA')}>
                ▶ Iniciar sesión
              </Button>
            )}
            {session.timer.status === 'running' && (
              <Button
                variant="ghost"
                onClick={() =>
                  void run(socketEvents.timerControl, { action: 'pause' }, 'RELOJ PAUSADO')
                }
              >
                Ⅱ Pausar
              </Button>
            )}
            {session.timer.status === 'paused' && activePhase && (
              <Button
                onClick={() =>
                  void run(socketEvents.timerControl, { action: 'resume' }, 'RELOJ ACTIVO')
                }
              >
                ▶ Continuar
              </Button>
            )}
            <StatusBadge tone={session.timer.status === 'running' ? 'ok' : 'warning'}>
              {session.timer.status}
            </StatusBadge>
          </div>
        </section>

        <section className="coordinator-presence" aria-label="Presencia por rol">
          <header>
            <span>LIVE://NODES</span>
            <strong>4 ROLES</strong>
          </header>
          <div>
            {presenceRoles.map(({ role, code, label }) => {
              const participant = session.participants.find((item) => item.role === role);
              const connected = participant?.status === 'connected';
              return (
                <article key={role} className={connected ? 'is-online' : ''}>
                  <b>{code}</b>
                  <div>
                    <strong>{label}</strong>
                    <small>{connected ? 'EN LÍNEA' : 'SIN ENLACE'}</small>
                  </div>
                  <i />
                </article>
              );
            })}
          </div>
        </section>

        <section className="coordinator-health" aria-label="Estado técnico resumido">
          <header>
            <span>SYSTEM://PULSE</span>
            <strong>REV.{String(session.revision).padStart(3, '0')}</strong>
          </header>
          <dl>
            <div>
              <dt>Agente Windows</dt>
              <dd data-state={session.remote.agent.status}>{session.remote.agent.status}</dd>
            </div>
            <div>
              <dt>Vídeo WebRTC</dt>
              <dd data-state={session.remote.media.status}>{session.remote.media.status}</dd>
            </div>
            <div>
              <dt>Entrada remota</dt>
              <dd data-state={session.remote.input.status}>{session.remote.input.status}</dd>
            </div>
            <div>
              <dt>Respaldo local</dt>
              <dd data-state={session.technical.fallbackActive ? 'active' : 'ready'}>
                {session.technical.fallbackActive ? 'activo' : 'listo'}
              </dd>
            </div>
          </dl>
          <output aria-live="polite">{feedback}</output>
        </section>

        <section className="coordinator-failsafe" aria-label="Acciones críticas">
          <header>
            <span>FAILSAFE://LOCAL</span>
            <strong>SIEMPRE DISPONIBLE</strong>
          </header>
          <div>
            <Button
              variant="ghost"
              disabled={session.technical.fallbackActive}
              onClick={() => setConfirm('fallback')}
            >
              ◫ Activar respaldo
            </Button>
            <Button variant="ghost" disabled={!activePhase} onClick={() => setConfirm('finish')}>
              ■ Finalizar ronda
            </Button>
            <Button variant="ghost" disabled={remoteActive} onClick={() => setConfirm('reset')}>
              ↺ Reiniciar
            </Button>
            <Button
              variant="danger"
              disabled={!activePhase}
              onClick={() => setConfirm('emergency')}
            >
              PARADA TOTAL
            </Button>
          </div>
          <p>Sin botones de escena. Víctima y Atacante hacen avanzar experiencia.</p>
        </section>
      </div>

      {session.technical.fallbackActive && (
        <section className="coordinator-backup" aria-label="Vídeo local de contingencia">
          <div>
            <span>BACKUP://PLAYING</span>
            <strong>Demostración continúa sin control remoto.</strong>
          </div>
          <video controls playsInline preload="metadata" src="/fallback/hackeado-respaldo.webm" />
        </section>
      )}

      <Modal
        open={confirm === 'emergency'}
        title="¿Parada total inmediata?"
        onClose={() => setConfirm(null)}
      >
        <p>
          Revoca entrada, termina vídeo, pausa reloj y coloca todos los paneles en estado seguro.
        </p>
        <Button
          variant="danger"
          onClick={async () => {
            await run(socketEvents.emergencyStop, {}, 'PARADA COMPLETA');
            setConfirm(null);
          }}
        >
          Confirmar parada total
        </Button>
      </Modal>
      <Modal
        open={confirm === 'finish'}
        title="¿Finalizar esta ronda?"
        onClose={() => setConfirm(null)}
      >
        <p>Cierra canales, revoca permisos activos y genera resultado con estado actual.</p>
        <Button
          variant="danger"
          onClick={async () => {
            await run(socketEvents.sessionEnd, {}, 'RONDA FINALIZADA');
            setConfirm(null);
          }}
        >
          Finalizar de forma segura
        </Button>
      </Modal>
      <Modal
        open={confirm === 'fallback'}
        title="¿Cambiar a contingencia local?"
        onClose={() => setConfirm(null)}
      >
        <p>
          Entrada real queda revocada. Paneles usan historia y vídeo precargados; nunca reactivan
          control.
        </p>
        <Button
          onClick={async () => {
            await run(socketEvents.fallbackActivate, {}, 'RESPALDO ACTIVO');
            setConfirm(null);
          }}
        >
          Activar respaldo audiovisual
        </Button>
      </Modal>
      <Modal
        open={confirm === 'reset'}
        title="¿Preparar ronda limpia?"
        onClose={() => setConfirm(null)}
      >
        <p>Rota código y tokens. Estado temporal anterior desaparece.</p>
        <Button variant="danger" onClick={reset}>
          Reiniciar y rotar accesos
        </Button>
      </Modal>
    </section>
  );
}

export const CoordinatorPanel = CoordinatorLite;

function explainCoordinatorError(error?: string) {
  const messages: Record<string, string> = {
    session_already_started: 'sesión ya inició',
    remote_session_active: 'detén acceso remoto antes de reiniciar',
    manual_phase_control_disabled: 'avance manual deshabilitado',
    socket_disconnected: 'servidor sin enlace',
    ack_timeout: 'servidor tardó demasiado',
  };
  return messages[error ?? ''] ?? error ?? 'orden rechazada';
}

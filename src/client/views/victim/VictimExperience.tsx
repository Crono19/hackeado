import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { socketEvents } from '../../../shared/events';
import { permissionDefinitions } from '../../../shared/permissions';
import { defaultScenario } from '../../../shared/scenario';
import type {
  DemoScenario,
  DemoSession,
  DecisionChoice,
  FictionalProfileId,
  ScenarioDesktopItem,
  SocketAck,
} from '../../../shared/types';
import { getScenario } from '../../api/sessions';
import { SimulatedDesktop } from '../../components/SimulatedDesktop';
import { RecoveryChallenge } from '../../components/RecoveryChallenge';
import { ScoreSummary } from '../../components/ScoreSummary';
import { Button, Panel, StatusBadge } from '../../components/ui';
import { VictimWebRtcBroadcast } from '../../components/WebRtcSession';
import { FallbackPlayback } from '../../components/FallbackPlayback';

type Command = <T>(event: string, payload?: Record<string, unknown>) => Promise<SocketAck<T>>;

export function VictimExperience({
  session,
  command,
  getSocket,
}: {
  session: DemoSession;
  command: Command;
  getSocket: () => Socket | null;
}) {
  const [scenario, setScenario] = useState<DemoScenario>(defaultScenario);
  const [selected, setSelected] = useState<FictionalProfileId>('alex');
  const [openItem, setOpenItem] = useState<ScenarioDesktopItem | null>(null);
  const [showSender, setShowSender] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getScenario(session.scenarioId)
      .then(({ scenario: delivered }) => setScenario(delivered))
      .catch(() => setScenario(defaultScenario));
  }, [session.scenarioId]);

  async function begin() {
    const result = await command<DemoSession>(socketEvents.profileSelect, { profileId: selected });
    if (!result.ok) setError(result.error ?? 'No fue posible comenzar.');
  }

  async function openSupport() {
    const result = await command<DemoSession>(socketEvents.supportOpen);
    if (!result.ok) setError(result.error ?? 'No fue posible abrir el caso.');
  }

  async function examine(signal: 'sender' | 'domain' | 'urgency') {
    const result = await command<DemoSession>(socketEvents.signalExamine, { signal });
    if (!result.ok) setError(result.error ?? 'No fue posible registrar la señal.');
  }

  async function decide(choice: DecisionChoice) {
    const result = await command<DemoSession>(socketEvents.decisionSubmit, { choice });
    if (!result.ok) setError(result.error ?? 'No fue posible registrar tu decisión.');
  }

  async function answerPermission(
    permission: DemoSession['permissions'][number],
    granted: boolean,
  ) {
    const result = await command<DemoSession>(socketEvents.permissionAnswer, {
      permission: permission.key,
      status: granted ? 'granted' : 'denied',
    });
    if (!result.ok) setError(result.error ?? 'No fue posible responder el permiso.');
  }

  if (session.phase === 'preparation') {
    return (
      <Panel className="victim-hold" label="WAITING://ROOM">
        <div className="victim-hold__radar" aria-hidden="true">
          <i />
        </div>
        <p className="eyebrow">SESIÓN SEGURA CONECTADA</p>
        <h2>Todo listo de tu lado.</h2>
        <p>El coordinador iniciará la experiencia. No cierres esta ventana.</p>
        <span className="victim-hold__pulse">
          <i /> Esperando señal
        </span>
      </Panel>
    );
  }

  if (!session.victimProfile && session.phase === 'waiting') {
    return (
      <section className="victim-onboarding" aria-labelledby="victim-welcome">
        <div className="victim-onboarding__intro">
          <span className="victim-kicker">NOVA // SESIÓN 04</span>
          <h2 id="victim-welcome">
            Entra en la historia.
            <br />
            <em>Sin entrar tú.</em>
          </h2>
          <p>
            Elige una identidad ficticia. No escribas tu nombre, correo ni ningún dato personal.
          </p>
        </div>
        <div className="avatar-deck" role="radiogroup" aria-label="Identidad ficticia">
          {scenario.profiles.map((profile, index) => (
            <button
              key={profile.id}
              type="button"
              role="radio"
              aria-checked={selected === profile.id}
              className={selected === profile.id ? 'is-selected' : ''}
              onClick={() => setSelected(profile.id)}
            >
              <span className={`avatar avatar--${profile.avatarId}`} aria-hidden="true">
                <b>{String(index + 1).padStart(2, '0')}</b>
                <i />
              </span>
              <span>
                <small>IDENTIDAD {String(index + 1).padStart(2, '0')}</small>
                <strong>{profile.alias}</strong>
                <em>{profile.roleTitle}</em>
              </span>
              <b className="avatar-deck__check">✓</b>
            </button>
          ))}
        </div>
        <div className="victim-onboarding__action">
          <div>
            <i /> Datos ficticios · sesión temporal · cero cargas
          </div>
          <Button onClick={begin}>
            Entrar al escritorio <span>→</span>
          </Button>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="demo-desktop" aria-label="Escritorio ficticio de demostración">
      <header className="demo-desktop__topbar">
        <div className="nova-mark">
          <b>N</b>
          <span>
            NOVA
            <br />
            WORKSPACE
          </span>
        </div>
        <div className="desktop-search">
          ⌕ <span>Buscar aplicaciones y archivos ficticios</span>
          <kbd>⌘ K</kbd>
        </div>
        <div className="desktop-profile">
          <span className={`avatar avatar--${session.victimProfile?.avatarId}`}>
            <i />
          </span>
          <div>
            <strong>{session.victimProfile?.alias ?? 'Perfil demo'}</strong>
            <small>{session.victimProfile?.roleTitle}</small>
          </div>
        </div>
      </header>

      <main className="demo-desktop__canvas">
        <IncidentRail session={session} />
        <VictimWebRtcBroadcast session={session} getSocket={getSocket} />
        {['permissions', 'connecting', 'controlled'].includes(session.phase) && (
          <AssistanceBar session={session} command={command} />
        )}
        <div className="desktop-greeting">
          <span>MARTES · ENTORNO ACADÉMICO</span>
          <h2>Hola, {session.victimProfile?.alias.split(' ')[0]}.</h2>
          <p>Tu espacio de estudio está sincronizado.</p>
        </div>

        <div className="desktop-icons">
          {scenario.desktopItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onDoubleClick={() => setOpenItem(item)}
              onClick={() => setOpenItem(item)}
            >
              <span className={`desktop-icon desktop-icon--${item.kind}`}>{item.icon}</span>
              <strong>{item.name}</strong>
            </button>
          ))}
        </div>

        <aside className="notification-dock" aria-label="Notificaciones ficticias">
          <header>
            <span>Centro de actividad</span>
            <b>{scenario.notifications.length}</b>
          </header>
          {scenario.notifications.map((notification) => (
            <article
              key={notification.id}
              className={notification.urgency === 'warning' ? 'is-warning' : ''}
            >
              <span>{notification.source.slice(0, 1)}</span>
              <div>
                <small>{notification.source}</small>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
              </div>
              <time>ahora</time>
            </article>
          ))}
        </aside>

        {openItem && (
          <section className="desktop-window" role="dialog" aria-label={openItem.name}>
            <header>
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>{openItem.name} · SOLO DEMOSTRACIÓN</span>
              <button type="button" onClick={() => setOpenItem(null)} aria-label="Cerrar ventana">
                ×
              </button>
            </header>
            <div className="desktop-window__body">
              <span className={`desktop-icon desktop-icon--${openItem.kind}`}>{openItem.icon}</span>
              <small>{openItem.kind.toUpperCase()} FICTICIO</small>
              <h3>{openItem.name}</h3>
              <p>{openItem.summary}</p>
              <pre>{openItem.content}</pre>
            </div>
          </section>
        )}

        {['controlled', 'reveal'].includes(session.phase) &&
          session.simulation.queue.some((item) => item.status !== 'cancelled') && (
            <div className="victim-simulation-overlay">
              <SimulatedDesktop session={session} />
            </div>
          )}

        {session.phase === 'controlled' && (
          <ControlActiveAlarm
            session={session}
            onStop={() => void command(socketEvents.controlRevoke, { reason: 'victim' })}
          />
        )}

        {session.phase === 'reveal' && (
          <RevealStage
            session={session}
            onRecover={() => void command(socketEvents.recoveryBegin)}
          />
        )}

        {session.technical.fallbackActive && (
          <div className="victim-fallback-overlay">
            <FallbackPlayback />
          </div>
        )}

        {(session.phase === 'bait' || session.phase === 'decision') && (
          <SupportStage
            session={session}
            scenario={scenario}
            showSender={showSender}
            onToggleSender={() => setShowSender((visible) => !visible)}
            onOpen={openSupport}
            onExamine={examine}
            onDecision={decide}
          />
        )}

        {session.phase === 'permissions' && (
          <PermissionStage session={session} onAnswer={answerPermission} />
        )}

        {session.phase === 'recovery' && (
          <div className="victim-recovery-overlay">
            <RecoveryChallenge session={session} command={command} />
          </div>
        )}

        {session.phase === 'result' &&
          (session.outcome === 'safe' ? (
            <SafeOutcome session={session} />
          ) : (
            session.summary && (
              <div className="victim-result-overlay">
                <ScoreSummary summary={session.summary} />
                <div className="final-protection-strip">
                  VERIFICA IDENTIDAD · LIMITA PERMISOS · DETÉN · PROTEGE · REPORTA
                </div>
              </div>
            )
          ))}

        {error && (
          <div className="victim-inline-error" role="alert">
            {explainVictimError(error)}
          </div>
        )}
      </main>

      <footer className="demo-desktop__taskbar">
        <button type="button" aria-label="Inicio">
          N
        </button>
        <span>ENTORNO EDUCATIVO · DATOS 100% FICTICIOS</span>
        <div>
          <i /> CONECTADO <b>{formatDuration(session.timer.remainingSeconds)}</b>{' '}
          {formatClock(session.updatedAt)}
        </div>
      </footer>
    </section>
  );
}

function SupportStage({
  session,
  scenario,
  showSender,
  onToggleSender,
  onOpen,
  onExamine,
  onDecision,
}: {
  session: DemoSession;
  scenario: DemoScenario;
  showSender: boolean;
  onToggleSender: () => void;
  onOpen: () => Promise<void>;
  onExamine: (signal: 'sender' | 'domain' | 'urgency') => Promise<void>;
  onDecision: (choice: DecisionChoice) => Promise<void>;
}) {
  const [remaining, setRemaining] = useState(() => narrativeSeconds(session));

  useEffect(() => {
    const update = () => setRemaining(narrativeSeconds(session));
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [session]);

  if (session.phase === 'bait') {
    return (
      <section
        className="support-incoming"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-alert-title"
      >
        <div className="support-incoming__icon" aria-hidden="true">
          !
        </div>
        <div>
          <span>SOPORTE NOVA · CASO {scenario.support.caseNumber}</span>
          <h3 id="support-alert-title">Problema crítico detectado</h3>
          <p>{scenario.support.openingMessage}</p>
        </div>
        <div className="narrative-timer">
          <small>CIERRE SUPUESTO</small>
          <strong>00:{String(remaining).padStart(2, '0')}</strong>
        </div>
        <Button onClick={() => void onOpen()}>
          Revisar mensaje <span>→</span>
        </Button>
      </section>
    );
  }

  return (
    <section
      className="support-chat"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-chat-title"
    >
      <header>
        <div className="support-agent">
          <span>MV</span>
          <div>
            <strong id="support-chat-title">{scenario.support.technician}</strong>
            <small>Conectada · caso {scenario.support.caseNumber}</small>
          </div>
        </div>
        <div className="narrative-timer">
          <small>TIEMPO PARA ACTUAR</small>
          <strong>00:{String(remaining).padStart(2, '0')}</strong>
        </div>
      </header>
      <div className="support-chat__body">
        <div className="chat-bubble">
          <small>Ahora</small>
          <p>{scenario.support.openingMessage}</p>
        </div>
        <div className="chat-bubble">
          <small>Ahora</small>
          <p>{scenario.support.followupMessage}</p>
        </div>
        <button
          className="sender-toggle"
          type="button"
          aria-expanded={showSender}
          onClick={onToggleSender}
        >
          ⓘ Ver detalles del remitente <span>{showSender ? '−' : '+'}</span>
        </button>
        <div className="signal-preview" aria-label="Señales que puedes revisar">
          <span>ANTES DE DECIDIR, REVISA:</span>
          {(
            [
              ['sender', '¿Quién lo envió?'],
              ['domain', '¿El dominio es oficial?'],
              ['urgency', '¿Te están apurando?'],
            ] as const
          ).map(([signal, label]) => (
            <button
              type="button"
              key={signal}
              className={session.story.examinedSignals.includes(signal) ? 'is-checked' : ''}
              onClick={() => void onExamine(signal)}
            >
              {session.story.examinedSignals.includes(signal) ? '✓' : '?'} {label}
            </button>
          ))}
        </div>
        {showSender && (
          <div className="sender-forensics">
            <div>
              <small>REMITENTE DECLARADO</small>
              <strong>{scenario.support.technician}</strong>
            </div>
            <div>
              <small>DIRECCIÓN REAL DEL MENSAJE</small>
              <strong>{scenario.support.sender}</strong>
            </div>
            <div>
              <small>DOMINIO OFICIAL</small>
              <strong>{scenario.support.officialDomain}</strong>
            </div>
            <p>Dirección externa + urgencia + solicitud no esperada. Tres señales revisables.</p>
            <div className="signal-checks">
              {(['sender', 'domain', 'urgency'] as const).map((signal) => (
                <button
                  type="button"
                  key={signal}
                  className={session.story.examinedSignals.includes(signal) ? 'is-checked' : ''}
                  onClick={() => void onExamine(signal)}
                >
                  {session.story.examinedSignals.includes(signal) ? '✓' : '+'} {signal}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <footer className="decision-deck">
        <p>¿Qué harías?</p>
        <button
          type="button"
          className="decision-card decision-card--risk"
          onClick={() => void onDecision('solve')}
        >
          <span>01</span>
          <strong>Solucionar ahora</strong>
          <small>Aceptar ayuda y continuar</small>
          <b>→</b>
        </button>
        <button type="button" className="decision-card" onClick={() => void onDecision('postpone')}>
          <span>02</span>
          <strong>Después</strong>
          <small>No conceder acceso ahora</small>
          <b>→</b>
        </button>
        <button
          type="button"
          className="decision-card decision-card--safe"
          onClick={() => void onDecision('verify')}
        >
          <span>03</span>
          <strong>Verificar</strong>
          <small>Contactar canal oficial</small>
          <b>→</b>
        </button>
      </footer>
      <div className="fiction-notice">SIMULACIÓN EDUCATIVA · REMITENTE Y CASO FICTICIOS</div>
    </section>
  );
}

function PermissionStage({
  session,
  onAnswer,
}: {
  session: DemoSession;
  onAnswer: (permission: DemoSession['permissions'][number], granted: boolean) => Promise<void>;
}) {
  const requested = session.permissions.find((permission) => permission.status === 'requested');
  const exposure = Math.max(
    session.risk.privacy,
    session.risk.deviceControl,
    session.risk.accounts,
    session.risk.files,
  );
  return (
    <section className="permission-stage" aria-live="polite">
      <header>
        <div>
          <span>ASISTENCIA REMOTA</span>
          <h3>{requested ? 'Nuevo permiso solicitado' : 'Esperando al técnico'}</h3>
        </div>
        <div className="victim-exposure">
          <small>EXPOSICIÓN NARRATIVA</small>
          <strong>{exposure}%</strong>
          <i style={{ '--exposure': `${exposure}%` } as React.CSSProperties} />
        </div>
      </header>
      {requested ? (
        <article className="permission-request">
          <span className="permission-request__icon">
            {permissionDefinitions[requested.key].icon}
          </span>
          <div className="permission-request__copy">
            <small>
              {requested.nature === 'real' ? 'CAPACIDAD REAL LIMITADA' : 'EFECTO SIMULADO'}
            </small>
            <h4>{permissionDefinitions[requested.key].label}</h4>
            <blockquote>{permissionDefinitions[requested.key].statedReason}</blockquote>
            <p className="permission-request__plain">
              <strong>Si permites:</strong> {permissionDefinitions[requested.key].actualImpact}
            </p>
            <details>
              <summary>¿Por qué importa este permiso?</summary>
              <p>{permissionDefinitions[requested.key].actualImpact}</p>
            </details>
          </div>
          <div className="permission-request__actions">
            <Button variant="ghost" onClick={() => void onAnswer(requested, false)}>
              Rechazar
            </Button>
            <Button variant="danger" onClick={() => void onAnswer(requested, true)}>
              Permitir una vez
            </Button>
          </div>
        </article>
      ) : (
        <div className="permission-wait">
          <i />
          <strong>No hay solicitudes pendientes.</strong>
          <p>Lee cada permiso antes de responder. Rechazar siempre es una opción.</p>
        </div>
      )}
      <div className="permission-history">
        {session.permissions.map((permission) => (
          <span key={permission.key} className={`is-${permission.status}`}>
            {permissionDefinitions[permission.key].shortLabel}
            <b>{permission.status}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

function AssistanceBar({ session, command }: { session: DemoSession; command: Command }) {
  const canStop = ['ready', 'screen', 'control'].includes(session.remote.status);
  return (
    <div className={`assistance-bar assistance-bar--${session.remote.status}`} role="status">
      <span>
        <i /> ASISTENCIA ACTIVA
      </span>
      <strong>Mara Voss · Soporte Nivel 2</strong>
      <span>PANTALLA::{permissionState(session, 'screen')}</span>
      <span>CONTROL::{permissionState(session, 'keyboard')}</span>
      <b>{formatDuration(session.timer.remainingSeconds)}</b>
      {canStop && (
        <button
          type="button"
          data-webrtc-protected
          onClick={() => void command(socketEvents.remoteStopRequest)}
          aria-label="Detener asistencia remota"
        >
          ■ DETENER ACCESO
        </button>
      )}
    </div>
  );
}

function IncidentRail({ session }: { session: DemoSession }) {
  const stages = [
    ['bait', 'Mensaje'],
    ['decision', 'Decisión'],
    ['permissions', 'Permisos'],
    ['connecting', 'Conexión'],
    ['controlled', 'Control'],
    ['reveal', 'Revelación'],
    ['recovery', 'Recuperación'],
    ['result', 'Resultado'],
  ] as const;
  const current = stages.findIndex(([phase]) => phase === session.phase);
  return (
    <nav className="victim-incident-rail" aria-label="Progreso de experiencia">
      {stages.map(([phase, label], index) => (
        <span
          key={phase}
          className={index === current ? 'is-active' : index < current ? 'is-past' : ''}
        >
          <i />
          {label}
        </span>
      ))}
    </nav>
  );
}

function ControlActiveAlarm({ session, onStop }: { session: DemoSession; onStop: () => void }) {
  return (
    <section className="victim-control-alarm" role="alert" aria-live="assertive">
      <div className="victim-control-alarm__code">
        REMOTE
        <br />
        <strong>ACTIVE</strong>
      </div>
      <div>
        <span>ALGUIEN ESTÁ CONTROLANDO ESTE WINDOWS</span>
        <h3>Mouse y teclado ya no son solo tuyos.</h3>
        <p>
          Operador puede hacer clic, escribir, abrir aplicaciones y modificar archivos ficticios
          visibles.
        </p>
        <small>Botón nativo superior y Ctrl+Shift+F12 siguen bajo control local.</small>
      </div>
      <Button variant="danger" onClick={onStop}>
        ■ DETENER AHORA
      </Button>
      <b>{session.remote.input.expiresAt ? 'LEASE TEMPORAL' : 'SIMULACIÓN CONTROLADA'}</b>
    </section>
  );
}

function RevealStage({ session, onRecover }: { session: DemoSession; onRecover: () => void }) {
  const stopped = session.remote.status === 'ended';
  return (
    <section className="victim-reveal-stage" aria-labelledby="victim-reveal-title">
      <div className="victim-reveal-stage__stamp">
        BREACH
        <br />
        REVEALED
      </div>
      <div>
        <span>LO QUE SUCEDÍA DETRÁS</span>
        <h3 id="victim-reveal-title">No era “solo soporte”.</h3>
        <p>
          Pantalla compartida mostró todo lo visible. Control permitió actuar como persona sentada
          frente al equipo.
        </p>
        <ul>
          <li>
            <b>Vio:</b> mensajes, pestañas y nombres de archivos.
          </li>
          <li>
            <b>Pudo hacer:</b> clic, escribir, abrir y cambiar contenido ficticio.
          </li>
          <li>
            <b>Señal clave:</b> urgencia + contacto inesperado + permisos amplios.
          </li>
        </ul>
      </div>
      <div className="victim-reveal-stage__action">
        <StatusBadge tone={stopped ? 'ok' : 'danger'}>
          {stopped ? 'ACCESO DETENIDO' : 'DETENCIÓN PENDIENTE'}
        </StatusBadge>
        <Button variant={stopped ? 'primary' : 'danger'} onClick={onRecover}>
          {stopped ? 'Empezar recuperación →' : 'Detener y recuperar →'}
        </Button>
      </div>
    </section>
  );
}

function SafeOutcome({ session }: { session: DemoSession }) {
  const verified = session.story.decision?.choice === 'verify';
  return (
    <section className="safe-outcome" role="status">
      <span className="safe-outcome__mark">✓</span>
      <small>RUTA SEGURA · PUNTUACIÓN {session.score}</small>
      <h3>{verified ? 'Verificaste antes de confiar.' : 'No concediste acceso.'}</h3>
      <p>
        El supuesto soporte quedó fuera. Ningún permiso fue concedido y el escritorio conserva
        control.
      </p>
      <div>
        <strong>La señal clave</strong>
        <span>Urgencia no reemplaza verificación por canal oficial.</span>
      </div>
    </section>
  );
}

function narrativeSeconds(session: DemoSession) {
  if (!session.story.baitDeadlineAt) return 45;
  return Math.max(0, Math.ceil((session.story.baitDeadlineAt - Date.now()) / 1000));
}

function permissionState(session: DemoSession, key: 'screen' | 'keyboard') {
  return session.permissions.find((permission) => permission.key === key)?.status.toUpperCase();
}

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat('es-GT', { hour: '2-digit', minute: '2-digit' }).format(timestamp);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60)
    .toString()
    .padStart(2, '0');
  const remainder = (Math.max(0, seconds) % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function explainVictimError(error: string) {
  const messages: Record<string, string> = {
    socket_disconnected: 'Conexión perdida. Control local fue revocado; informa a coordinación.',
    ack_timeout: 'Servidor no respondió. No repitas permisos: espera confirmación.',
    recovery_not_ready: 'Primero debe mostrarse la revelación.',
    action_rejected: 'Acción no válida en este momento.',
  };
  return messages[error] ?? error;
}

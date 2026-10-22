import { useCallback, useState } from 'react';
import { createInitialSession } from '../../shared/session';
import type { SessionCredentials } from '../../shared/types';
import { clearCredentials, loadCredentials, saveCredentials } from '../session-storage';
import { useSessionSocket } from '../hooks/useSessionSocket';
import type { RoleRoute } from '../routes';
import { AttackerPanel } from '../views/attacker/AttackerPanel';
import { AudienceExperience } from '../views/audience/AudienceExperience';
import { CoordinatorPanel } from '../views/coordinator/CoordinatorPanel';
import { VictimExperience } from '../views/victim/VictimExperience';
import { ConnectionBadge } from './ConnectionBadge';
import { SessionLobby } from './SessionLobby';
import { Button, StatusBadge } from './ui';

export function RoleDashboard({ route }: { route: RoleRoute }) {
  const [credentials, setCredentials] = useState<SessionCredentials | null>(() =>
    loadCredentials(route.role),
  );
  const acceptCredentials = useCallback((next: SessionCredentials) => {
    saveCredentials(next);
    setCredentials(next);
  }, []);
  const invalidateCredentials = useCallback(() => {
    clearCredentials(route.role);
    setCredentials(null);
  }, [route.role]);
  const { status, session, error, command, reconnect, getSocket } = useSessionSocket(
    credentials,
    invalidateCredentials,
  );
  const display =
    session ?? createInitialSession({ mode: 'simulated', pairingCode: credentials?.pairingCode });
  const theme =
    route.role !== 'victim'
      ? 'dark'
      : ['permissions', 'connecting'].includes(display.phase)
        ? 'warning'
        : ['controlled', 'emergency'].includes(display.phase)
          ? 'dark'
          : 'light';

  function leave() {
    invalidateCredentials();
  }

  return (
    <section
      className={`role-dashboard role-dashboard--${route.role} theme-${theme} ${credentials ? 'is-session-active' : ''}`}
      aria-labelledby="panel-title"
    >
      <header className="role-hero">
        <div>
          <p className="eyebrow">
            {route.eyebrow} // ROLE::{route.role.toUpperCase()}
          </p>
          <h1 id="panel-title" data-text={route.label}>
            {route.label}
            <span>console.</span>
          </h1>
          <p>{route.description}</p>
        </div>
        <div className="role-hero__status">
          <ConnectionBadge status={credentials ? status : 'disconnected'} />
          <StatusBadge tone="info">DEMO CONTROLADA</StatusBadge>
          {credentials && (
            <Button variant="ghost" onClick={leave}>
              Salir localmente
            </Button>
          )}
        </div>
      </header>
      <SessionLobby role={route.role} credentials={credentials} onCredentials={acceptCredentials} />
      {credentials && session && (
        <div className={`mode-ribbon mode-ribbon--${session.mode}`}>
          <span>MODE::{session.mode.toUpperCase()}</span>
          <strong>
            {session.mode === 'live'
              ? 'Herramienta remota externa · controles visibles'
              : session.mode === 'rehearsal'
                ? 'Ensayo acelerado ×4'
                : 'Simulación local segura'}
          </strong>
        </div>
      )}
      {credentials && session && route.role === 'coordinator' && (
        <CoordinatorPanel session={session} command={command} onCredentials={acceptCredentials} />
      )}
      {credentials && session && route.role === 'victim' && (
        <VictimExperience session={session} command={command} getSocket={getSocket} />
      )}
      {credentials && session && route.role === 'attacker' && (
        <AttackerPanel session={session} command={command} getSocket={getSocket} />
      )}
      {credentials && session && route.role === 'audience' && (
        <AudienceExperience session={session} />
      )}
      {session?.phase === 'emergency' && (
        <div className="global-safety-state" role="alert">
          <span>■ ACCESO FINALIZADO</span>
          <strong>La demostración está en estado seguro.</strong>
          <p>Control remoto terminado · permisos revocados · reloj detenido</p>
        </div>
      )}
      {credentials && error && (
        <div className="connection-alert" role="alert">
          <span>ENLACE INTERRUMPIDO // {error}</span>
          <strong>La escena queda congelada; no se pierde el estado.</strong>
          <Button variant="ghost" onClick={reconnect}>
            ↻ Reintentar enlace
          </Button>
        </div>
      )}
      <a className="back-link dashboard-back" href="/">
        ← Volver al mapa
      </a>
    </section>
  );
}

import { roleRoutes } from './routes';
import { RoleDashboard } from './components/RoleDashboard';
import { StateMachineDebug } from './components/StateMachineDebug';
import { releaseInfo } from '../shared/release';

const debugEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEBUG_UI === 'true';

export function App() {
  const route = roleRoutes.find((item) => item.path === window.location.pathname);
  const isDebug = debugEnabled && window.location.pathname === '/debug';

  return (
    <main id="main-content" className="app-shell">
      <div className="grain" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <div className="breach-line" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="/" aria-label="Ir al inicio de HACKEADO">
          HACKEADO<span aria-hidden="true">_</span>
        </a>
        <span className="status-chip">
          <i aria-hidden="true" /> {releaseInfo.channel} // SPRINT {releaseInfo.completedSprint}
        </span>
      </header>

      {isDebug ? <StateMachineDebug /> : route ? <RoleDashboard route={route} /> : <Home />}
    </main>
  );
}

function Home() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">INCIDENT LAB // GRUPO 03 // GT-2026</p>
        <h1 id="hero-title" data-text="Alguien está dentro">
          Alguien está
          <span>dentro.</span>
        </h1>
        <p className="lede">
          Base técnica de una experiencia sobre acceso remoto, permisos peligrosos y la decisión que
          abre la puerta.
        </p>
        <div className="system-readout" aria-label="Estado del sistema">
          <span>
            <b>CORE</b> READY
          </span>
          <span>
            <b>STATE</b> GUARDED
          </span>
          <span>
            <b>REMOTE</b> ISOLATED
          </span>
        </div>
      </div>

      <nav className="panel-grid" aria-label="Paneles de la experiencia">
        {roleRoutes.map((route, index) => (
          <a className="panel-card" href={route.path} key={route.path}>
            <span className="panel-index">0{index + 1}</span>
            <span className="panel-label">{route.label}</span>
            <span className="panel-description">{route.description}</span>
            <span className="panel-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </nav>

      <section className="release-telemetry" aria-label="Estado de versión candidata">
        <div>
          <span>BUILD</span>
          <strong>{releaseInfo.version}</strong>
        </div>
        <div>
          <span>VIDEO</span>
          <strong>WEBRTC P2P</strong>
        </div>
        <div>
          <span>INPUT</span>
          <strong>LEASE LOCKED</strong>
        </div>
        <div>
          <span>FAILSAFE</span>
          <strong>4 CHANNELS</strong>
        </div>
      </section>

      {debugEnabled && (
        <a className="debug-entry" href="/debug">
          <span>DEV://STATE_ENGINE</span>
          <strong>Abrir consola de dominio</strong>
          <i aria-hidden="true">↗</i>
        </a>
      )}

      <footer className="hero-footer">
        <span>Demostración controlada</span>
        <span>Información ficticia</span>
        <span>Mac ↔ Windows</span>
      </footer>
    </section>
  );
}

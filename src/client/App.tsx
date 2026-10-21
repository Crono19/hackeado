import { roleRoutes } from './routes';
import { DashboardPlaceholder } from './components/DashboardPlaceholder';

export function App() {
  const route = roleRoutes.find((item) => item.path === window.location.pathname);

  return (
    <main id="main-content" className="app-shell">
      <div className="grain" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="/" aria-label="Ir al inicio de HACKEADO">
          HACKEADO<span aria-hidden="true">_</span>
        </a>
        <span className="status-chip">Base · Fase 1</span>
      </header>

      {route ? <DashboardPlaceholder route={route} /> : <Home />}
    </main>
  );
}

function Home() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">GRUPO 3 · SEGURIDAD INFORMÁTICA</p>
        <h1 id="hero-title">
          Alguien está
          <span>dentro.</span>
        </h1>
        <p className="lede">
          Base técnica de una experiencia sobre acceso remoto, permisos peligrosos y la decisión
          que abre la puerta.
        </p>
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

      <footer className="hero-footer">
        <span>Demostración controlada</span>
        <span>Información ficticia</span>
        <span>Mac ↔ Windows</span>
      </footer>
    </section>
  );
}


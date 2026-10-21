import type { RoleRoute } from '../routes';

interface DashboardPlaceholderProps {
  route: RoleRoute;
}

export function DashboardPlaceholder({ route }: DashboardPlaceholderProps) {
  return (
    <section className={`placeholder placeholder--${route.role}`} aria-labelledby="panel-title">
      <p className="eyebrow">{route.eyebrow}</p>
      <h1 id="panel-title">Panel de {route.label.toLowerCase()}</h1>
      <p className="lede">{route.description}</p>

      <div className="placeholder-status" role="status">
        <span className="status-light" aria-hidden="true" />
        Estructura preparada · funcionalidad pendiente de la siguiente fase
      </div>

      <a className="back-link" href="/">
        ← Volver al mapa de paneles
      </a>
    </section>
  );
}


import type { PermissionState } from '../../shared/types';
import { StatusBadge } from './ui';

const labels = {
  screen: 'Ver pantalla',
  keyboard: 'Teclado + mouse',
  files: 'Archivos',
  clipboard: 'Portapapeles',
  microphone: 'Micrófono',
  camera: 'Cámara',
  unattended: 'Acceso permanente',
};
const statusLabels = {
  idle: 'No solicitado',
  requested: 'Solicitado',
  granted: 'Permitido',
  denied: 'Rechazado',
};

export function PermissionCard({ permission }: { permission: PermissionState }) {
  const tone =
    permission.status === 'granted'
      ? 'danger'
      : permission.status === 'denied'
        ? 'ok'
        : permission.status === 'requested'
          ? 'warning'
          : 'neutral';
  return (
    <article className={`permission-card permission-card--${permission.status}`}>
      <div className="permission-card__icon" aria-hidden="true">
        {permission.key.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <span>{permission.nature === 'real' ? 'REAL CONTROLADA' : 'SIMULADA'}</span>
        <h3>{labels[permission.key]}</h3>
      </div>
      <StatusBadge tone={tone}>{statusLabels[permission.status]}</StatusBadge>
    </article>
  );
}

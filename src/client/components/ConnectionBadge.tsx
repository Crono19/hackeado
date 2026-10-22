import type { ConnectionStatus } from '../../shared/types';

const labels: Record<ConnectionStatus, string> = {
  connected: 'Enlace estable',
  reconnecting: 'Reconectando',
  disconnected: 'Sin enlace',
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span className={`connection-badge connection-badge--${status}`} role="status">
      <i aria-hidden="true" />
      {labels[status]}
    </span>
  );
}

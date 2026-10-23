import { useEffect, useState } from 'react';
import type { DemoSession } from '../../../shared/types';
import { Button, StatusBadge } from '../ui';

export function ControlConsent({
  session,
  onApprove,
  onReject,
}: {
  session: DemoSession;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const input = session.remote.input;
  useEffect(() => {
    if (input.status !== 'granted') return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [input.status]);

  if (input.status === 'requested') {
    return (
      <section className="control-consent control-consent--request" aria-live="assertive">
        <span className="control-consent__kicker">SOLICITUD SEPARADA // CONTROL DEL EQUIPO</span>
        <h3>¿Permitir mouse y teclado?</h3>
        <p>
          El operador podrá hacer clic, escribir y abrir elementos mientras esta sesión esté activa.
          No obtiene archivos, terminal ni acceso oculto. Puedes detenerlo en cualquier momento.
        </p>
        <div className="control-consent__actions">
          <Button variant="danger" onClick={onApprove}>
            Permitir por esta sesión
          </Button>
          <Button variant="ghost" onClick={onReject}>
            No permitir
          </Button>
        </div>
      </section>
    );
  }
  if (input.status === 'granted') {
    const seconds = Math.max(0, Math.ceil(((input.activationAvailableAt ?? now) - now) / 1_000));
    return (
      <section className="control-consent control-consent--countdown" aria-live="assertive">
        <span>CONTROL AUTORIZADO</span>
        <strong>{seconds || 'LISTO'}</strong>
        <p>
          {seconds
            ? 'El control podrá comenzar al terminar la cuenta.'
            : 'Esperando activación del operador.'}
        </p>
        <Button variant="ghost" onClick={onReject}>
          Revocar antes de iniciar
        </Button>
      </section>
    );
  }
  if (input.status === 'active') {
    return (
      <section className="control-consent control-consent--active" aria-live="assertive">
        <StatusBadge tone="danger">CONTROL REMOTO ACTIVO</StatusBadge>
        <strong>Tu mouse y teclado pueden moverse a distancia.</strong>
        <p>Usa el botón rojo de la app Windows o Ctrl+Shift+F12 para detener inmediatamente.</p>
        <Button variant="danger" onClick={onReject}>
          ■ Detener control ahora
        </Button>
      </section>
    );
  }
  return null;
}

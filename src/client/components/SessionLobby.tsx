import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type {
  ExperienceRole,
  JoinRequestStatus,
  JoinRequestView,
  SessionCredentials,
  SessionMode,
} from '../../shared/types';
import {
  createDemoSession,
  decideJoin,
  listJoinRequests,
  pollJoin,
  requestSessionJoin,
} from '../api/sessions';
import { Button, Panel, StatusBadge } from './ui';

interface SessionLobbyProps {
  role: ExperienceRole;
  credentials: SessionCredentials | null;
  onCredentials: (credentials: SessionCredentials) => void;
}

export function SessionLobby({ role, credentials, onCredentials }: SessionLobbyProps) {
  if (role === 'coordinator') {
    return <CoordinatorLobby credentials={credentials} onCredentials={onCredentials} />;
  }
  return <JoinLobby role={role} credentials={credentials} onCredentials={onCredentials} />;
}

function JoinLobby({ role, credentials, onCredentials }: SessionLobbyProps) {
  const params = new URLSearchParams(window.location.search);
  const [code, setCode] = useState(params.get('code') ?? '');
  const [ticket, setTicket] = useState<{ request: JoinRequestView; requestKey: string } | null>(
    null,
  );
  const [status, setStatus] = useState<JoinRequestStatus>('waiting');
  const [error, setError] = useState<string | null>(null);
  const visibleStatus: JoinRequestStatus = credentials ? 'approved' : ticket ? status : 'waiting';

  useEffect(() => {
    if (!ticket || status !== 'waiting') return;
    const poll = window.setInterval(async () => {
      try {
        const result = await pollJoin(ticket.request.id, ticket.requestKey);
        setStatus(result.request.status);
        if (result.request.status === 'approved' && result.token) {
          onCredentials({
            sessionId: result.request.sessionId,
            pairingCode: code,
            role,
            token: result.token,
            expiresAt: result.request.expiresAt,
          });
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No fue posible consultar solicitud.');
      }
    }, 1_000);
    return () => window.clearInterval(poll);
  }, [code, onCredentials, role, status, ticket]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const next = await requestSessionJoin(code, role as Exclude<ExperienceRole, 'coordinator'>);
      setTicket(next);
      setStatus('waiting');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Código rechazado.');
    }
  }

  if (credentials) return null;

  return (
    <Panel className={`join-console join-console--${role}`} label="PAIR://REQUEST">
      <div className="join-console__heading">
        <div>
          <p className="eyebrow">
            {role === 'victim' ? 'WINDOWS // ENTRADA CONTROLADA' : 'ENLACE TEMPORAL'}
          </p>
          <h2>{role === 'victim' ? 'Conecta al incidente.' : 'Entrar a sesión'}</h2>
          {role === 'victim' && (
            <p className="join-console__promise">
              Usarás identidad ficticia. Cada permiso pedirá tu decisión. Siempre podrás detener.
            </p>
          )}
        </div>
        <StatusBadge
          tone={
            visibleStatus === 'approved'
              ? 'ok'
              : visibleStatus === 'rejected' || visibleStatus === 'expired'
                ? 'danger'
                : 'warning'
          }
        >
          {visibleStatus}
        </StatusBadge>
      </div>
      <form onSubmit={submit}>
        <label htmlFor={`code-${role}`}>Código de seis dígitos</label>
        <input
          id={`code-${role}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          required
        />
        <Button type="submit" disabled={code.length !== 6 || Boolean(ticket)}>
          Solicitar acceso <span>↗</span>
        </Button>
      </form>
      {role === 'victim' && (
        <div className="victim-entry-assurances" aria-label="Protecciones de sesión">
          <span>
            <b>01</b> Datos ficticios
          </span>
          <span>
            <b>02</b> Permisos visibles
          </span>
          <span>
            <b>03</b> Parada local
          </span>
        </div>
      )}
      {ticket && (
        <p className="join-console__signal" role="status">
          <i aria-hidden="true" />
          Solicitud enviada. Coordinador debe aprobar rol <strong>{role}</strong>.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Panel>
  );
}

function CoordinatorLobby({ credentials, onCredentials }: Omit<SessionLobbyProps, 'role'>) {
  const [requests, setRequests] = useState<JoinRequestView[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<SessionMode>('simulated');

  useEffect(() => {
    if (!credentials) return;
    const victimUrl = `${window.location.origin}/victima?code=${credentials.pairingCode}`;
    void QRCode.toDataURL(victimUrl, {
      margin: 1,
      color: { dark: '#050706', light: '#baff2f' },
    }).then(setQrDataUrl);
    const refresh = async () => {
      try {
        const result = await listJoinRequests(credentials);
        setRequests(result.requests);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Sin acceso a solicitudes.');
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 1_500);
    return () => window.clearInterval(timer);
  }, [credentials]);

  async function create() {
    setError(null);
    try {
      const created = await createDemoSession(mode);
      onCredentials(created.credentials);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible crear sesión.');
    }
  }

  async function decide(requestId: string, approved: boolean) {
    if (!credentials) return;
    try {
      await decideJoin(credentials, requestId, approved);
      const refreshed = await listJoinRequests(credentials);
      setRequests(refreshed.requests);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible decidir.');
    }
  }

  if (!credentials) {
    return (
      <Panel className="join-console join-console--create" label="SESSION://GENERATOR">
        <p className="eyebrow">CONTROL ROOM</p>
        <h2>Crear perímetro temporal</h2>
        <p>Código aleatorio, tokens por rol y expiración automática. Nada persiste al reiniciar.</p>
        <div className="mode-selector" role="radiogroup" aria-label="Modo de sesión">
          {(
            [
              ['simulated', 'SIMULADO', 'Todo ocurre dentro de la app; ideal para público.'],
              ['rehearsal', 'ENSAYO ×4', 'Reloj acelerado para practicar el guion completo.'],
              [
                'live',
                'REMOTO REAL',
                'Agente Windows visible, consentimiento doble y parada local.',
              ],
            ] as const
          ).map(([value, label, detail]) => (
            <button
              type="button"
              role="radio"
              aria-checked={mode === value}
              className={mode === value ? 'is-selected' : ''}
              key={value}
              onClick={() => setMode(value)}
            >
              <i />
              <strong>{label}</strong>
              <small>{detail}</small>
            </button>
          ))}
        </div>
        {mode === 'live' && (
          <p className="live-mode-warning">
            ⚠ Solo equipo preparado, cuenta ficticia y herramienta legítima separada. Sin acceso
            desatendido.
          </p>
        )}
        <Button onClick={create}>
          Crear sesión segura <span>＋</span>
        </Button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </Panel>
    );
  }

  return (
    <Panel className="pairing-board" label="PAIR://LIVE">
      <div className="pairing-board__code">
        <span>Código temporal</span>
        <strong>{credentials.pairingCode}</strong>
        <small>Expira automáticamente · datos ficticios</small>
      </div>
      <div className="pairing-board__qr">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Código QR temporal para abrir el panel de víctima" />
        ) : (
          <span aria-live="polite">Generando QR seguro…</span>
        )}
      </div>
      <div className="approval-queue">
        <h3>Solicitudes de acceso</h3>
        {requests.length === 0 ? (
          <p>Sin solicitudes pendientes.</p>
        ) : (
          requests.map((request) => (
            <article key={request.id}>
              <div>
                <strong>{request.role}</strong>
                <small>{request.status}</small>
              </div>
              {request.status === 'waiting' && (
                <div>
                  <Button onClick={() => decide(request.id, true)}>Aprobar</Button>
                  <Button variant="danger" onClick={() => decide(request.id, false)}>
                    Rechazar
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Panel>
  );
}

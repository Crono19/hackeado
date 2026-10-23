import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import type { Socket } from 'socket.io-client';
import { socketEvents } from '../../../shared/events';
import type {
  PointerButtonMessage,
  RemotePointerButton,
  RemoteShortcutId,
} from '../../../shared/remote-protocol';
import type { DemoSession, SocketAck } from '../../../shared/types';
import { mapClientPointToVideo } from '../../webrtc/coordinates';
import {
  isLocalReleaseShortcut,
  localKeyboardReleaseLabel,
  toRemoteKeyPayload,
} from '../../webrtc/keyboard';
import { createRemotePeer } from '../../webrtc/peer';
import {
  emitWebRtcSignal,
  type SignalCandidate,
  type SignalDescription,
} from '../../webrtc/protocol';
import {
  bitrateKbps,
  classifyQuality,
  emptyQuality,
  type QualitySnapshot,
} from '../../webrtc/quality';
import { Button, StatusBadge } from '../ui';

type StreamState = 'idle' | 'negotiating' | 'live' | 'error';

export function AttackerRemoteDesktop({
  session,
  getSocket,
}: {
  session: DemoSession;
  getSocket: () => Socket | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const queuedCandidates = useRef<RTCIceCandidateInit[]>([]);
  const statsRef = useRef({ at: 0, bytes: 0 });
  const frameRef = useRef<number | null>(null);
  const sequenceRef = useRef(0);
  const sessionRef = useRef(session);
  const pressedButtons = useRef(new Set<RemotePointerButton>());
  const pressedKeys = useRef(new Set<string>());
  const [state, setState] = useState<StreamState>('idle');
  const [quality, setQuality] = useState<QualitySnapshot>(emptyQuality);
  const [controlReady, setControlReady] = useState(false);
  const [keyboardCaptured, setKeyboardCaptured] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState('Esperando enlace seguro.');

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const sendPointer = useCallback(
    (
      type: PointerButtonMessage['type'] | 'pointer.move' | 'pointer.wheel',
      point: { x: number; y: number },
      extra: object = {},
    ) => {
      const channel = channelRef.current;
      const current = sessionRef.current;
      const leaseId = current.remote.input.leaseId;
      if (channel?.readyState !== 'open' || !leaseId) return;
      channel.send(
        JSON.stringify({
          version: 1,
          type,
          sessionId: current.id,
          leaseId,
          sequence: ++sequenceRef.current,
          sentAt: Date.now(),
          ...point,
          ...extra,
        }),
      );
    },
    [],
  );

  const sendKeyboard = useCallback(
    (type: 'keyboard.down' | 'keyboard.up', event: KeyboardEvent) => {
      const payload = toRemoteKeyPayload(event);
      const channel = channelRef.current;
      const current = sessionRef.current;
      const leaseId = current.remote.input.leaseId;
      if (!payload || channel?.readyState !== 'open' || !leaseId) return false;
      channel.send(
        JSON.stringify({
          version: 1,
          type,
          sessionId: current.id,
          leaseId,
          sequence: ++sequenceRef.current,
          sentAt: Date.now(),
          ...payload,
        }),
      );
      return true;
    },
    [],
  );

  const sendShortcut = useCallback((shortcut: RemoteShortcutId) => {
    const channel = channelRef.current;
    const current = sessionRef.current;
    const leaseId = current.remote.input.leaseId;
    if (channel?.readyState !== 'open' || !leaseId) return;
    channel.send(
      JSON.stringify({
        version: 1,
        type: 'keyboard.shortcut',
        shortcut,
        sessionId: current.id,
        leaseId,
        sequence: ++sequenceRef.current,
        sentAt: Date.now(),
      }),
    );
  }, []);

  const releaseButtons = useCallback(() => {
    for (const button of pressedButtons.current) {
      sendPointer('pointer.up', { x: 0.5, y: 0.5 }, { button });
    }
    pressedButtons.current.clear();
  }, [sendPointer]);

  const flushKeyboard = useCallback(() => {
    const channel = channelRef.current;
    const current = sessionRef.current;
    const leaseId = current.remote.input.leaseId;
    if (channel?.readyState === 'open' && leaseId)
      channel.send(
        JSON.stringify({
          version: 1,
          type: 'keyboard.releaseAll',
          sessionId: current.id,
          leaseId,
          sequence: ++sequenceRef.current,
          sentAt: Date.now(),
        }),
      );
    pressedKeys.current.clear();
  }, []);

  const releaseKeyboard = useCallback(() => {
    flushKeyboard();
    setKeyboardCaptured(false);
  }, [flushKeyboard]);

  const releaseInput = useCallback(() => {
    releaseButtons();
    releaseKeyboard();
  }, [releaseButtons, releaseKeyboard]);

  const close = useCallback(
    (notify = false) => {
      releaseInput();
      if (videoRef.current) videoRef.current.srcObject = null;
      channelRef.current?.close();
      channelRef.current = null;
      peerRef.current?.close();
      peerRef.current = null;
      queuedCandidates.current = [];
      setState('idle');
      setControlReady(false);
      setQuality(emptyQuality);
      const socket = getSocket();
      if (notify && socket?.connected)
        emitWebRtcSignal(socket, sessionRef.current, socketEvents.webrtcStop);
    },
    [getSocket, releaseInput],
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onOffer = async ({ description }: SignalDescription) => {
      close(false);
      setState('negotiating');
      const peer = createRemotePeer();
      peerRef.current = peer;
      peer.ontrack = ({ streams }) => {
        if (videoRef.current) {
          videoRef.current.srcObject = streams[0] ?? new MediaStream();
          void videoRef.current.play();
        }
      };
      peer.ondatachannel = ({ channel }) => {
        channelRef.current = channel;
        channel.onopen = () => setControlReady(true);
        channel.onclose = () => {
          setControlReady(false);
          releaseInput();
        };
      };
      peer.onicecandidate = ({ candidate }) => {
        if (candidate)
          emitWebRtcSignal(socket, sessionRef.current, socketEvents.webrtcIce, {
            candidate: candidate.toJSON(),
          });
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') setState('live');
        if (['failed', 'disconnected'].includes(peer.connectionState)) {
          setState('error');
          releaseInput();
        }
      };
      try {
        await peer.setRemoteDescription(description);
        for (const candidate of queuedCandidates.current.splice(0)) {
          await peer.addIceCandidate(candidate);
        }
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        emitWebRtcSignal(socket, sessionRef.current, socketEvents.webrtcAnswer, {
          description: answer,
        });
      } catch {
        setState('error');
      }
    };
    const onIce = async ({ candidate }: SignalCandidate) => {
      const peer = peerRef.current;
      if (!peer || !peer.remoteDescription) queuedCandidates.current.push(candidate);
      else await peer.addIceCandidate(candidate).catch(() => undefined);
    };
    const onStop = () => close(false);
    const onDisconnect = () => {
      setFeedback('Enlace perdido. Entrada liberada; reconexión será solo vídeo.');
      close(false);
    };
    socket.on(socketEvents.webrtcOffer, onOffer);
    socket.on(socketEvents.webrtcIce, onIce);
    socket.on(socketEvents.webrtcStop, onStop);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off(socketEvents.webrtcOffer, onOffer);
      socket.off(socketEvents.webrtcIce, onIce);
      socket.off(socketEvents.webrtcStop, onStop);
      socket.off('disconnect', onDisconnect);
    };
  }, [close, getSocket, releaseInput]);

  useEffect(() => {
    if (state !== 'live') return;
    const timer = window.setInterval(async () => {
      const peer = peerRef.current;
      const socket = getSocket();
      if (!peer) return;
      let next: QualitySnapshot | null = null;
      const reports = await peer.getStats();
      reports.forEach((report) => {
        if (report.type !== 'inbound-rtp' || report.kind !== 'video') return;
        const bytes = Number(report.bytesReceived ?? 0);
        let rtt = 0;
        const transport = reports.get(report.transportId);
        const pair = transport ? reports.get(transport.selectedCandidatePairId) : undefined;
        if (pair) rtt = Math.round(Number(pair.currentRoundTripTime ?? 0) * 1_000);
        next = {
          bitrateKbps: bitrateKbps(statsRef.current, report.timestamp, bytes),
          fps: Math.round(Number(report.framesPerSecond ?? 0)),
          packetsLost: Number(report.packetsLost ?? 0),
          roundTripMs: rtt,
          width: Number(report.frameWidth ?? videoRef.current?.videoWidth ?? 0),
          height: Number(report.frameHeight ?? videoRef.current?.videoHeight ?? 0),
        };
        statsRef.current = { at: report.timestamp, bytes };
      });
      if (next) {
        setQuality(next);
        if (socket?.connected)
          emitWebRtcSignal(socket, sessionRef.current, socketEvents.remoteQuality, next);
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [getSocket, state]);

  useEffect(() => {
    if (session.remote.input.status !== 'active') {
      releaseButtons();
      flushKeyboard();
    }
  }, [flushKeyboard, releaseButtons, session.remote.input.status]);
  useEffect(() => {
    window.addEventListener('blur', releaseInput);
    return () => window.removeEventListener('blur', releaseInput);
  }, [releaseInput]);
  useEffect(() => {
    if (session.remote.input.status !== 'granted') return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [session.remote.input.status]);
  useEffect(() => {
    const socket = getSocket();
    const leaseId = session.remote.input.leaseId;
    if (!socket?.connected || session.remote.input.status !== 'active' || !leaseId) return;
    const timer = window.setInterval(() => {
      void emitWithAck(socket, socketEvents.controlHeartbeat, session.id, { leaseId });
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [getSocket, session.id, session.remote.input.leaseId, session.remote.input.status]);
  useEffect(() => () => close(false), [close]);

  function point(event: ReactPointerEvent<HTMLDivElement> | ReactWheelEvent<HTMLDivElement>) {
    return mapClientPointToVideo(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      { width: videoRef.current?.videoWidth ?? 0, height: videoRef.current?.videoHeight ?? 0 },
    );
  }

  const canControl =
    controlReady &&
    session.remote.input.status === 'active' &&
    Boolean(session.remote.input.leaseId);
  const qualityLevel = state === 'live' ? classifyQuality(quality) : 'offline';
  const activationSeconds = Math.max(
    0,
    Math.ceil(((session.remote.input.activationAvailableAt ?? now) - now) / 1_000),
  );

  async function requestControl() {
    const socket = getSocket();
    if (!socket) return;
    const result = await emitWithAck(socket, socketEvents.controlRequest, session.id, {});
    setFeedback(
      result.ok
        ? 'Solicitud enviada. La víctima decide.'
        : `BLOQUEADO // ${explainControlError(result.error)}`,
    );
  }

  async function activateControl() {
    const socket = getSocket();
    const leaseId = session.remote.input.leaseId;
    if (!socket || !leaseId) return;
    const result = await emitWithAck(socket, socketEvents.controlActivate, session.id, { leaseId });
    setFeedback(
      result.ok ? 'Control nativo activado.' : `BLOQUEADO // ${explainControlError(result.error)}`,
    );
  }

  async function releaseControl() {
    const socket = getSocket();
    if (!socket) return;
    releaseInput();
    const result = await emitWithAck(socket, socketEvents.controlRevoke, session.id, {
      reason: 'attacker',
    });
    setFeedback(
      result.ok
        ? 'Entrada liberada. Víctima conserva control local.'
        : explainControlError(result.error),
    );
  }

  async function reveal() {
    const socket = getSocket();
    if (!socket) return;
    releaseInput();
    const result = await emitWithAck(socket, socketEvents.controlReveal, session.id, {});
    setFeedback(
      result.ok
        ? 'Revelación iniciada. Control quedó revocado.'
        : explainControlError(result.error),
    );
  }

  async function emergencyStop() {
    const socket = getSocket();
    if (!socket) return;
    releaseInput();
    const result = await emitWithAck(socket, socketEvents.emergencyStop, session.id, {});
    setFeedback(result.ok ? 'PARADA TOTAL CONFIRMADA.' : explainControlError(result.error));
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!canControl || !keyboardCaptured) return;
    if (isLocalReleaseShortcut(event.nativeEvent)) {
      event.preventDefault();
      releaseKeyboard();
      setFeedback('Teclado liberado localmente.');
      return;
    }
    if (!sendKeyboard('keyboard.down', event.nativeEvent)) return;
    event.preventDefault();
    pressedKeys.current.add(event.code);
  }

  function handleKeyUp(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!canControl || !keyboardCaptured || !pressedKeys.current.has(event.code)) return;
    if (sendKeyboard('keyboard.up', event.nativeEvent)) event.preventDefault();
    pressedKeys.current.delete(event.code);
  }

  return (
    <section
      className={`remote-stage remote-stage--${canControl ? 'armed' : state}${session.phase === 'reveal' ? ' remote-stage--reveal' : ''}`}
      aria-label="Escritorio remoto Windows"
    >
      <header className="remote-stage__header">
        <div>
          <span>LINK://WIN-VM01</span>
          <h2>Escritorio remoto</h2>
        </div>
        <div className="remote-stage__states">
          <StatusBadge tone={session.remote.agent.status === 'online' ? 'ok' : 'danger'}>
            {session.remote.agent.status === 'online' ? 'AGENTE ONLINE' : 'AGENTE OFFLINE'}
          </StatusBadge>
          <StatusBadge tone={canControl ? 'danger' : state === 'live' ? 'info' : 'neutral'}>
            {canControl ? 'CONTROL ACTIVO' : state === 'live' ? 'SOLO VISTA' : 'SIN SEÑAL'}
          </StatusBadge>
          <StatusBadge tone={session.remote.input.leaseId ? 'ok' : 'neutral'}>
            {session.remote.input.leaseId
              ? `LEASE ${session.remote.input.leaseId.slice(0, 6).toUpperCase()}`
              : 'LEASE VACÍO'}
          </StatusBadge>
        </div>
      </header>
      <div
        ref={viewportRef}
        className="remote-stage__viewport"
        tabIndex={canControl ? 0 : -1}
        onFocus={() => canControl && setKeyboardCaptured(true)}
        onBlur={releaseKeyboard}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onContextMenu={(event) => {
          if (canControl) event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (!canControl || frameRef.current) return;
          const mapped = point(event);
          if (!mapped.inside) return;
          frameRef.current = requestAnimationFrame(() => {
            sendPointer('pointer.move', mapped);
            frameRef.current = null;
          });
        }}
        onPointerDown={(event) => {
          if (!canControl) return;
          event.currentTarget.focus();
          const mapped = point(event);
          const button = pointerButton(event.button);
          if (!mapped.inside || !button) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pressedButtons.current.add(button);
          sendPointer('pointer.down', mapped, { button });
        }}
        onPointerUp={(event) => {
          if (!canControl) return;
          const mapped = point(event);
          const button = pointerButton(event.button);
          if (!button) return;
          pressedButtons.current.delete(button);
          sendPointer('pointer.up', mapped, { button });
        }}
        onPointerCancel={releaseButtons}
        onPointerLeave={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) releaseButtons();
        }}
        onWheel={(event) => {
          if (!canControl) return;
          event.preventDefault();
          const mapped = point(event);
          if (!mapped.inside) return;
          sendPointer('pointer.wheel', mapped, { deltaX: event.deltaX, deltaY: event.deltaY });
        }}
      >
        <video ref={videoRef} autoPlay playsInline muted />
        <div className="remote-stage__reticle" aria-hidden="true" />
        {state !== 'live' && (
          <div className="remote-stage__empty">
            <span>NO SIGNAL</span>
            <strong>Esperando pantalla completa desde Windows</strong>
            <small>Vídeo nunca pasa por servidor.</small>
          </div>
        )}
        {canControl && (
          <div className="remote-stage__armed">
            <i /> INPUT INJECT // LEASE ACTIVE
          </div>
        )}
        {keyboardCaptured && canControl && (
          <div className="remote-stage__capture">⌨ TECLADO CAPTURADO</div>
        )}
      </div>
      {canControl && (
        <div className="remote-commandbar" aria-label="Atajos remotos permitidos">
          {(
            [
              ['start', '⊞ Inicio'],
              ['alt-tab', 'Alt + Tab'],
              ['escape', 'Esc'],
              ['enter', 'Enter'],
              ['close-window', 'Cerrar ventana'],
              ['show-desktop', 'Escritorio'],
            ] as const
          ).map(([shortcut, label]) => (
            <button type="button" key={shortcut} onClick={() => sendShortcut(shortcut)}>
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              void viewportRef.current?.requestFullscreen().then(() => viewportRef.current?.focus())
            }
          >
            ⛶ Pantalla completa
          </button>
        </div>
      )}
      <footer className="remote-stage__footer">
        <StatusBadge
          tone={
            qualityLevel === 'optimal'
              ? 'ok'
              : qualityLevel === 'adapted'
                ? 'warning'
                : qualityLevel === 'degraded'
                  ? 'danger'
                  : 'neutral'
          }
        >
          {qualityLevel.toUpperCase()}
        </StatusBadge>
        <span>{quality.width ? `${quality.width}×${quality.height}` : '—'}</span>
        <span>{quality.fps} FPS</span>
        <span>{quality.bitrateKbps} KBIT/S</span>
        <span>{quality.roundTripMs} MS RTT</span>
        <span>{quality.packetsLost} LOST</span>
        {state === 'live' && session.remote.input.status === 'disabled' && (
          <Button onClick={() => void requestControl()}>Solicitar control</Button>
        )}
        {session.remote.input.status === 'granted' && (
          <Button
            variant="danger"
            onClick={() => void activateControl()}
            disabled={activationSeconds > 0}
          >
            {activationSeconds ? `Armando en ${activationSeconds}` : 'Activar control'}
          </Button>
        )}
        {session.remote.input.status === 'active' && (
          <Button variant="danger" onClick={() => void releaseControl()}>
            Liberar control
          </Button>
        )}
        {state === 'live' && (
          <Button variant="ghost" onClick={() => close(true)}>
            Cortar vídeo
          </Button>
        )}
        {session.phase === 'controlled' && (
          <Button onClick={() => void reveal()}>Revelación</Button>
        )}
        <Button variant="danger" onClick={() => void emergencyStop()}>
          PARADA TOTAL
        </Button>
      </footer>
      <p className="remote-stage__notice">
        {feedback} · Click en vídeo captura teclado · {localKeyboardReleaseLabel} libera localmente
        · Sin shell ni transferencia
      </p>
    </section>
  );
}

function pointerButton(button: number): RemotePointerButton | null {
  return button === 0
    ? 'left'
    : button === 1
      ? 'middle'
      : button === 2
        ? 'right'
        : button === 3
          ? 'back'
          : button === 4
            ? 'forward'
            : null;
}

function emitWithAck<T>(socket: Socket, event: string, sessionId: string, payload: object) {
  return new Promise<SocketAck<T>>((resolve) =>
    socket.emit(event, { eventId: crypto.randomUUID(), sessionId, ...payload }, resolve),
  );
}

function explainControlError(error?: string) {
  const messages: Record<string, string> = {
    agent_offline: 'agente Windows fuera de línea',
    screen_permission_required: 'la víctima aún no permitió pantalla',
    control_not_requested: 'primero solicita control',
    control_not_granted: 'la víctima aún no concedió control',
    control_activation_delay: 'espera la cuenta regresiva de seguridad',
    control_consent_expired: 'consentimiento vencido; debe solicitarse otra vez',
    lease_expired: 'lease vencido; entrada fue liberada',
    reveal_out_of_phase: 'la revelación solo se habilita bajo control',
    event_rate: 'demasiadas órdenes; espera unos segundos',
  };
  return messages[error ?? ''] ?? error ?? 'orden rechazada sin activar entrada';
}

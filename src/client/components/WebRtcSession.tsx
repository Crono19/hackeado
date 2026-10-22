import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { socketEvents } from '../../shared/events';
import type { DemoSession } from '../../shared/types';
import { Button, StatusBadge } from './ui';

type StreamState = 'idle' | 'requesting' | 'negotiating' | 'live' | 'error';

interface SignalDescription {
  description: RTCSessionDescriptionInit;
}

interface SignalCandidate {
  candidate: RTCIceCandidateInit;
}

interface RemoteInput {
  type: 'pointer' | 'click' | 'key';
  x?: number;
  y?: number;
  key?: string;
  shiftKey?: boolean;
}

interface QualitySnapshot {
  bitrateKbps: number;
  fps: number;
  packetsLost: number;
  width: number;
  height: number;
}

const emptyQuality: QualitySnapshot = {
  bitrateKbps: 0,
  fps: 0,
  packetsLost: 0,
  width: 0,
  height: 0,
};

function emitSignal(socket: Socket, session: DemoSession, event: string, payload = {}) {
  socket.emit(event, {
    eventId: crypto.randomUUID(),
    sessionId: session.id,
    ...payload,
  });
}

function createPeer() {
  return new RTCPeerConnection({
    iceServers: [],
    bundlePolicy: 'max-bundle',
  });
}

export function VictimWebRtcBroadcast({
  session,
  getSocket,
}: {
  session: DemoSession;
  getSocket: () => Socket | null;
}) {
  const [state, setState] = useState<StreamState>('idle');
  const [message, setMessage] = useState('La transmisión está apagada.');
  const [cursor, setCursor] = useState<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.5,
    active: false,
  });
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const sessionRef = useRef(session);
  const queuedCandidates = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const closeLocal = useCallback(
    (notify = true) => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      channelRef.current?.close();
      channelRef.current = null;
      peerRef.current?.close();
      peerRef.current = null;
      queuedCandidates.current = [];
      setState('idle');
      setCursor((current) => ({ ...current, active: false }));
      setMessage('Transmisión finalizada por la víctima.');
      const socket = getSocket();
      if (notify && socket?.connected) {
        emitSignal(socket, sessionRef.current, socketEvents.webrtcStop);
      }
    },
    [getSocket],
  );

  const handleRemoteInput = useCallback((input: RemoteInput) => {
    const current = sessionRef.current;
    const controlAllowed =
      current.remote.status === 'control' &&
      current.phase === 'controlled' &&
      current.permissions.some(
        (permission) => permission.key === 'keyboard' && permission.status === 'granted',
      );
    if (!controlAllowed) return;

    if (
      (input.type === 'pointer' || input.type === 'click') &&
      input.x != null &&
      input.y != null
    ) {
      const x = Math.min(1, Math.max(0, input.x));
      const y = Math.min(1, Math.max(0, input.y));
      setCursor({ x, y, active: true });
      if (input.type === 'click') {
        const target = document.elementFromPoint(x * window.innerWidth, y * window.innerHeight);
        const interactive = target?.closest<HTMLElement>('button, a, input, summary');
        const desktop = interactive?.closest('.demo-desktop');
        if (interactive && desktop && !interactive.closest('[data-webrtc-protected]')) {
          interactive.click();
        }
      }
      return;
    }

    if (input.type !== 'key' || !input.key) return;
    const focusables = [
      ...document.querySelectorAll<HTMLElement>(
        '.demo-desktop button:not(:disabled), .demo-desktop a[href], .demo-desktop input:not(:disabled), .demo-desktop summary',
      ),
    ].filter((item) => !item.closest('[data-webrtc-protected]'));
    if (input.key === 'Tab' && focusables.length) {
      const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
      const delta = input.shiftKey ? -1 : 1;
      focusables[(currentIndex + delta + focusables.length) % focusables.length]?.focus();
    } else if (input.key === 'Enter' || input.key === ' ') {
      (document.activeElement as HTMLElement | null)?.click?.();
    } else if (input.key === 'Escape') {
      document.querySelector<HTMLElement>('.desktop-window header button')?.click();
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onAnswer = async ({ description }: SignalDescription) => {
      const peer = peerRef.current;
      if (!peer) return;
      try {
        await peer.setRemoteDescription(description);
        for (const candidate of queuedCandidates.current.splice(0)) {
          await peer.addIceCandidate(candidate);
        }
        setState('live');
        setMessage('Pantalla transmitida al panel atacante.');
      } catch {
        setState('error');
        setMessage('No se pudo completar la negociación WebRTC.');
      }
    };
    const onIce = async ({ candidate }: SignalCandidate) => {
      const peer = peerRef.current;
      if (!peer) return;
      if (!peer.remoteDescription) queuedCandidates.current.push(candidate);
      else await peer.addIceCandidate(candidate).catch(() => undefined);
    };
    const onStop = () => closeLocal(false);
    socket.on(socketEvents.webrtcAnswer, onAnswer);
    socket.on(socketEvents.webrtcIce, onIce);
    socket.on(socketEvents.webrtcStop, onStop);
    return () => {
      socket.off(socketEvents.webrtcAnswer, onAnswer);
      socket.off(socketEvents.webrtcIce, onIce);
      socket.off(socketEvents.webrtcStop, onStop);
    };
  }, [closeLocal, getSocket]);

  useEffect(() => {
    if (['ending', 'ended'].includes(session.remote.status) || session.phase === 'emergency') {
      if (peerRef.current) closeLocal();
    }
  }, [closeLocal, session.phase, session.remote.status]);

  useEffect(() => () => closeLocal(false), [closeLocal]);

  async function startBroadcast() {
    const socket = getSocket();
    if (!socket?.connected) {
      setState('error');
      setMessage('El enlace con el servidor no está disponible.');
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getDisplayMedia) {
      setState('error');
      setMessage('Captura bloqueada: abre Víctima desde localhost o HTTPS.');
      return;
    }

    setState('requesting');
    setMessage('Elige “Esta pestaña” y activa Compartir.');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
      } as DisplayMediaStreamOptions);
      closeLocal(false);
      streamRef.current = stream;
      const peer = createPeer();
      peerRef.current = peer;
      const channel = peer.createDataChannel('hackeado-control', { ordered: true });
      channelRef.current = channel;
      channel.onmessage = (event) => {
        try {
          handleRemoteInput(JSON.parse(String(event.data)) as RemoteInput);
        } catch {
          // Invalid control packets are ignored and never reach the operating system.
        }
      };
      peer.onicecandidate = ({ candidate }) => {
        if (candidate) {
          emitSignal(socket, sessionRef.current, socketEvents.webrtcIce, {
            candidate: candidate.toJSON(),
          });
        }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') setState('live');
        if (['failed', 'disconnected'].includes(peer.connectionState)) {
          setState('error');
          setMessage('La conexión directa perdió calidad o se interrumpió.');
        }
      };
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error('screen_track_missing');
      track.contentHint = 'detail';
      track.onended = () => closeLocal();
      const sender = peer.addTrack(track, stream);
      const parameters = sender.getParameters();
      parameters.encodings = [
        { ...(parameters.encodings[0] ?? {}), maxBitrate: 8_000_000, maxFramerate: 30 },
      ];
      await sender.setParameters(parameters).catch(() => undefined);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setState('negotiating');
      setMessage('Negociando enlace directo con el atacante…');
      emitSignal(socket, session, socketEvents.webrtcOffer, { description: offer });
    } catch (error) {
      closeLocal(false);
      setState('error');
      setMessage(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'La víctima canceló el selector de pantalla.'
          : 'No fue posible iniciar la transmisión.',
      );
    }
  }

  const screenGranted = session.permissions.some(
    (permission) => permission.key === 'screen' && permission.status === 'granted',
  );
  const visible = ['connecting', 'controlled', 'reveal', 'containment', 'recovery'].includes(
    session.phase,
  );
  if (!visible || !screenGranted) return null;

  return (
    <aside className={`webrtc-consent webrtc-consent--${state}`} aria-live="polite">
      <div className="webrtc-consent__signal">
        <i />
        <span>{state === 'live' ? 'PANTALLA EN VIVO' : 'TRANSMISIÓN CONSENTIDA'}</span>
      </div>
      <div>
        <strong>
          {state === 'live' ? 'El operador puede ver esta pestaña.' : 'Comparte solo HACKEADO.'}
        </strong>
        <small>{message}</small>
      </div>
      {state === 'idle' || state === 'error' ? (
        <Button onClick={() => void startBroadcast()} disabled={!getSocket()?.connected}>
          Compartir esta pestaña
        </Button>
      ) : state === 'live' ? (
        <Button variant="danger" onClick={() => closeLocal()} data-webrtc-protected>
          ■ Detener transmisión
        </Button>
      ) : (
        <StatusBadge tone="warning">{state}</StatusBadge>
      )}
      {cursor.active && (
        <span
          className="webrtc-remote-cursor"
          style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}
          aria-hidden="true"
        >
          <i />
          OPERADOR
        </span>
      )}
    </aside>
  );
}

export function AttackerWebRtcMonitor({
  session,
  getSocket,
}: {
  session: DemoSession;
  getSocket: () => Socket | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const queuedCandidates = useRef<RTCIceCandidateInit[]>([]);
  const statsRef = useRef({ at: 0, bytes: 0 });
  const frameRef = useRef<number | null>(null);
  const sessionRef = useRef(session);
  const [state, setState] = useState<StreamState>('idle');
  const [quality, setQuality] = useState<QualitySnapshot>(emptyQuality);
  const [controlReady, setControlReady] = useState(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const close = useCallback(
    (notify = false) => {
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
      if (notify && socket?.connected) {
        emitSignal(socket, sessionRef.current, socketEvents.webrtcStop);
      }
    },
    [getSocket],
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onOffer = async ({ description }: SignalDescription) => {
      close(false);
      setState('negotiating');
      const peer = createPeer();
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
        channel.onclose = () => setControlReady(false);
      };
      peer.onicecandidate = ({ candidate }) => {
        if (candidate) {
          emitSignal(socket, sessionRef.current, socketEvents.webrtcIce, {
            candidate: candidate.toJSON(),
          });
        }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') setState('live');
        if (['failed', 'disconnected'].includes(peer.connectionState)) setState('error');
      };
      try {
        await peer.setRemoteDescription(description);
        for (const candidate of queuedCandidates.current.splice(0)) {
          await peer.addIceCandidate(candidate);
        }
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        emitSignal(socket, sessionRef.current, socketEvents.webrtcAnswer, {
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
    socket.on(socketEvents.webrtcOffer, onOffer);
    socket.on(socketEvents.webrtcIce, onIce);
    socket.on(socketEvents.webrtcStop, onStop);
    return () => {
      socket.off(socketEvents.webrtcOffer, onOffer);
      socket.off(socketEvents.webrtcIce, onIce);
      socket.off(socketEvents.webrtcStop, onStop);
    };
  }, [close, getSocket]);

  useEffect(() => {
    if (state !== 'live') return;
    const timer = window.setInterval(async () => {
      const peer = peerRef.current;
      if (!peer) return;
      const reports = await peer.getStats();
      reports.forEach((report) => {
        if (report.type !== 'inbound-rtp' || report.kind !== 'video') return;
        const elapsed = report.timestamp - statsRef.current.at;
        const bytes = Number(report.bytesReceived ?? 0);
        const bitrateKbps =
          elapsed > 0
            ? Math.max(0, Math.round(((bytes - statsRef.current.bytes) * 8) / elapsed))
            : 0;
        statsRef.current = { at: report.timestamp, bytes };
        setQuality({
          bitrateKbps,
          fps: Math.round(Number(report.framesPerSecond ?? 0)),
          packetsLost: Number(report.packetsLost ?? 0),
          width: Number(report.frameWidth ?? videoRef.current?.videoWidth ?? 0),
          height: Number(report.frameHeight ?? videoRef.current?.videoHeight ?? 0),
        });
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => () => close(false), [close]);

  function send(input: RemoteInput) {
    const channel = channelRef.current;
    if (channel?.readyState === 'open') channel.send(JSON.stringify(input));
  }

  function pointerPosition(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const video = videoRef.current;
    const sourceRatio =
      video?.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9;
    const frameRatio = rect.width / rect.height;
    const renderedWidth = frameRatio > sourceRatio ? rect.height * sourceRatio : rect.width;
    const renderedHeight = frameRatio > sourceRatio ? rect.height : rect.width / sourceRatio;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left - offsetX) / renderedWidth)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top - offsetY) / renderedHeight)),
    };
  }

  const canControl =
    controlReady &&
    session.remote.status === 'control' &&
    session.phase === 'controlled' &&
    session.permissions.some(
      (permission) => permission.key === 'keyboard' && permission.status === 'granted',
    );
  const qualityTone =
    quality.height >= 900 && quality.fps >= 24
      ? 'ok'
      : quality.height > 0 && quality.fps >= 15
        ? 'warning'
        : 'danger';

  return (
    <section className="webrtc-monitor" aria-label="Transmisión WebRTC consentida">
      <header>
        <div>
          <span>LIVE://VICTIM_FEED</span>
          <h2>Pantalla consentida</h2>
        </div>
        <StatusBadge tone={state === 'live' ? 'danger' : state === 'error' ? 'danger' : 'neutral'}>
          {state === 'live' ? 'EN VIVO' : state}
        </StatusBadge>
      </header>
      <div
        className={`webrtc-monitor__viewport ${canControl ? 'is-controllable' : ''}`}
        tabIndex={canControl ? 0 : -1}
        onPointerMove={(event) => {
          if (!canControl || frameRef.current) return;
          const point = pointerPosition(event);
          frameRef.current = requestAnimationFrame(() => {
            send({ type: 'pointer', ...point });
            frameRef.current = null;
          });
        }}
        onPointerDown={(event) => {
          if (canControl) send({ type: 'click', ...pointerPosition(event) });
        }}
        onKeyDown={(event) => {
          if (!canControl) return;
          event.preventDefault();
          send({ type: 'key', key: event.key, shiftKey: event.shiftKey });
        }}
      >
        <video ref={videoRef} autoPlay playsInline muted />
        {state !== 'live' && (
          <div className="webrtc-monitor__empty">
            <i />
            <strong>Esperando que la víctima comparta esta pestaña</strong>
            <small>La captura requiere una acción visible en Windows.</small>
          </div>
        )}
        {canControl && (
          <span className="webrtc-monitor__control">CONTROL WEB ACTIVO · CLIC + TAB + ENTER</span>
        )}
      </div>
      <footer className="webrtc-quality">
        <StatusBadge tone={state === 'live' ? qualityTone : 'neutral'}>
          {state === 'live'
            ? qualityTone === 'ok'
              ? 'CALIDAD ÓPTIMA'
              : 'CALIDAD ADAPTADA'
            : 'SIN SEÑAL'}
        </StatusBadge>
        <span>{quality.width && quality.height ? `${quality.width}×${quality.height}` : '—'}</span>
        <span>{quality.fps || 0} FPS</span>
        <span>{quality.bitrateKbps || 0} KBIT/S</span>
        <span>{quality.packetsLost} PKT LOST</span>
        {state === 'live' && (
          <Button variant="danger" onClick={() => close(true)}>
            ■ Cortar transmisión
          </Button>
        )}
      </footer>
      <p className="webrtc-monitor__notice">
        El control está limitado a la pestaña HACKEADO. No inyecta teclado ni mouse en Windows.
      </p>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { socketEvents } from '../../../shared/events';
import { remoteControlMessageSchema } from '../../../shared/schemas';
import type { DemoSession, SocketAck } from '../../../shared/types';
import {
  clearNativeControl,
  hasNativeBridge,
  probeNativeBridge,
  sendNativeInput,
  setNativeControlContext,
  subscribeNativeMessages,
} from '../../native/bridge';
import type { NativeAgentRegistration } from '../../native/messages';
import {
  createRemotePeer,
  desktopCaptureConstraints,
  optimizeDesktopSender,
} from '../../webrtc/peer';
import {
  emitWebRtcSignal,
  type SignalCandidate,
  type SignalDescription,
} from '../../webrtc/protocol';
import { Button, StatusBadge } from '../ui';
import { ControlConsent } from './ControlConsent';

type StreamState = 'idle' | 'requesting' | 'negotiating' | 'live' | 'error';

export function VictimDesktopBroadcast({
  session,
  getSocket,
}: {
  session: DemoSession;
  getSocket: () => Socket | null;
}) {
  const [state, setState] = useState<StreamState>('idle');
  const [message, setMessage] = useState('Transmisión apagada. Tú decides cuándo empieza.');
  const [registration, setRegistration] = useState<NativeAgentRegistration | null>(null);
  const [bridgeChecked, setBridgeChecked] = useState(false);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const sessionRef = useRef(session);
  const queuedCandidates = useRef<RTCIceCandidateInit[]>([]);
  const registrationPending = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let active = true;
    void probeNativeBridge().then((result) => {
      if (!active) return;
      setRegistration(result);
      setBridgeChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (
      !registration ||
      !socket?.connected ||
      session.mode !== 'live' ||
      session.remote.agent.status === 'online' ||
      registrationPending.current
    )
      return;
    registrationPending.current = true;
    emitWithAck<DemoSession>(socket, socketEvents.agentRegister, session.id, registration).finally(
      () => {
        registrationPending.current = false;
      },
    );
  }, [getSocket, registration, session.id, session.mode, session.remote.agent.status]);

  useEffect(() => {
    const socket = getSocket();
    const agentId = session.remote.agent.agentId;
    if (!socket?.connected || !agentId || session.remote.agent.status !== 'online') return;
    const timer = window.setInterval(() => {
      void emitWithAck(socket, socketEvents.agentHeartbeat, session.id, { agentId });
    }, 3_000);
    return () => window.clearInterval(timer);
  }, [getSocket, session.id, session.remote.agent.agentId, session.remote.agent.status]);

  useEffect(() => {
    const input = session.remote.input;
    if (input.leaseId && input.expiresAt && ['granted', 'active'].includes(input.status)) {
      setNativeControlContext({
        sessionId: session.id,
        leaseId: input.leaseId,
        expiresAt: input.expiresAt,
        consentGranted: true,
        active: input.status === 'active',
        operatorName: 'OPERADOR HACKEADO',
      });
    } else if (hasNativeBridge()) {
      clearNativeControl(session.remote.stopReason ?? 'victim');
    }
  }, [session.id, session.remote.input, session.remote.stopReason]);

  const closeLocal = useCallback(
    (notify = true, reason: 'victim' | 'network' = 'victim') => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      channelRef.current?.close();
      channelRef.current = null;
      peerRef.current?.close();
      peerRef.current = null;
      queuedCandidates.current = [];
      setState('idle');
      setMessage('Transmisión finalizada. Control nativo revocado.');
      clearNativeControl(reason);
      const socket = getSocket();
      if (notify && socket?.connected) {
        emitWebRtcSignal(socket, sessionRef.current, socketEvents.webrtcStop, { reason });
      }
    },
    [getSocket],
  );

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
        setMessage('Escritorio completo visible para operador autorizado.');
      } catch {
        setState('error');
        setMessage('No pudo completarse negociación WebRTC.');
      }
    };
    const onIce = async ({ candidate }: SignalCandidate) => {
      const peer = peerRef.current;
      if (!peer) return;
      if (!peer.remoteDescription) queuedCandidates.current.push(candidate);
      else await peer.addIceCandidate(candidate).catch(() => undefined);
    };
    const onStop = () => closeLocal(false, 'network');
    const onDisconnect = () => closeLocal(false, 'network');
    socket.on(socketEvents.webrtcAnswer, onAnswer);
    socket.on(socketEvents.webrtcIce, onIce);
    socket.on(socketEvents.webrtcStop, onStop);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off(socketEvents.webrtcAnswer, onAnswer);
      socket.off(socketEvents.webrtcIce, onIce);
      socket.off(socketEvents.webrtcStop, onStop);
      socket.off('disconnect', onDisconnect);
    };
  }, [closeLocal, getSocket]);

  useEffect(
    () =>
      subscribeNativeMessages((nativeMessage) => {
        if (nativeMessage.type !== 'native.stopped') return;
        const current = sessionRef.current;
        if (!['requested', 'granted', 'active'].includes(current.remote.input.status)) return;
        const socket = getSocket();
        if (socket?.connected)
          void emitWithAck(socket, socketEvents.controlRevoke, current.id, { reason: 'victim' });
        closeLocal(true, 'victim');
      }),
    [closeLocal, getSocket],
  );

  useEffect(() => {
    if (session.phase === 'emergency' && peerRef.current) closeLocal();
  }, [closeLocal, session.phase]);
  useEffect(() => () => closeLocal(false), [closeLocal]);

  async function startBroadcast() {
    const socket = getSocket();
    if (!socket?.connected) return fail('Servidor sin enlace.');
    if (session.mode === 'live' && !registration)
      return fail('Modo live requiere HACKEADO Victim Host.');
    if (!window.isSecureContext || !navigator.mediaDevices?.getDisplayMedia)
      return fail('Captura requiere localhost o HTTPS.');

    setState('requesting');
    setMessage('Selecciona “Pantalla completa” y monitor de la VM. Nada inicia silenciosamente.');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(desktopCaptureConstraints);
      closeLocal(false);
      streamRef.current = stream;
      const peer = createRemotePeer();
      peerRef.current = peer;
      const channel = peer.createDataChannel('hackeado-control', { ordered: true });
      channelRef.current = channel;
      channel.onmessage = (event) => {
        try {
          const packet = remoteControlMessageSchema.parse(JSON.parse(String(event.data)));
          const current = sessionRef.current;
          if (
            current.remote.input.status !== 'active' ||
            packet.sessionId !== current.id ||
            packet.leaseId !== current.remote.input.leaseId
          )
            return;
          sendNativeInput(packet);
        } catch {
          // Invalid packets never cross native bridge.
        }
      };
      channel.onclose = () => clearNativeControl('network');
      peer.onicecandidate = ({ candidate }) => {
        if (candidate)
          emitWebRtcSignal(socket, sessionRef.current, socketEvents.webrtcIce, {
            candidate: candidate.toJSON(),
          });
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') setState('live');
        if (['failed', 'disconnected'].includes(peer.connectionState)) closeLocal(true, 'network');
      };
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error('screen_track_missing');
      track.contentHint = 'detail';
      track.onended = () => closeLocal();
      await optimizeDesktopSender(peer.addTrack(track, stream));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setState('negotiating');
      setMessage('Negociando canal directo 1080p/30…');
      emitWebRtcSignal(socket, session, socketEvents.webrtcOffer, { description: offer });
    } catch (error) {
      closeLocal(false);
      fail(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Selector cancelado. Ninguna pantalla fue compartida.'
          : 'No pudo iniciarse captura de pantalla.',
      );
    }
  }

  async function grantControl() {
    const socket = getSocket();
    if (!socket) return;
    await emitWithAck(socket, socketEvents.controlGrant, session.id, { approved: true });
  }

  async function rejectOrStopControl() {
    const socket = getSocket();
    if (!socket) return;
    await emitWithAck(socket, socketEvents.controlRevoke, session.id, { reason: 'victim' });
  }

  function fail(text: string) {
    setState('error');
    setMessage(text);
  }

  const screenGranted = session.permissions.some(
    (permission) => permission.key === 'screen' && permission.status === 'granted',
  );
  const visible =
    (session.mode === 'live' && session.phase === 'permissions') ||
    ['connecting', 'controlled', 'reveal', 'containment', 'recovery'].includes(session.phase);
  if (!visible || !screenGranted) return null;

  return (
    <aside className={`webrtc-consent webrtc-consent--${state}`} aria-live="polite">
      <div className="webrtc-consent__signal">
        <i />
        <span>{state === 'live' ? 'ESCRITORIO EN VIVO' : 'CAPTURA LOCAL'}</span>
      </div>
      <div>
        <strong>
          {registration ? 'AGENTE WINDOWS CONECTADO' : 'MODO NAVEGADOR · SIN CONTROL NATIVO'}
        </strong>
        <small>{message}</small>
      </div>
      {state === 'idle' || state === 'error' ? (
        <Button
          onClick={() => void startBroadcast()}
          disabled={!getSocket()?.connected || (session.mode === 'live' && !registration)}
        >
          Elegir pantalla completa
        </Button>
      ) : state === 'live' ? (
        <Button variant="danger" onClick={() => closeLocal()} data-webrtc-protected>
          ■ Detener pantalla
        </Button>
      ) : (
        <StatusBadge tone="warning">{state}</StatusBadge>
      )}
      {!bridgeChecked && <small>Buscando puente nativo…</small>}
      <ControlConsent
        session={session}
        onApprove={() => void grantControl()}
        onReject={() => void rejectOrStopControl()}
      />
    </aside>
  );
}

function emitWithAck<T>(socket: Socket, event: string, sessionId: string, payload: object) {
  return new Promise<SocketAck<T>>((resolve) =>
    socket.emit(event, { eventId: crypto.randomUUID(), sessionId, ...payload }, resolve),
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { socketEvents } from '../../shared/events';
import type {
  ConnectionStatus,
  DemoSession,
  SessionCredentials,
  SocketAck,
} from '../../shared/types';
import { createSessionSocket } from '../socket/client';

export function useSessionSocket(
  credentials: SessionCredentials | null,
  onInvalidCredentials?: () => void,
) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [session, setSession] = useState<DemoSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!credentials) return;
    const nextSocket = createSessionSocket(credentials);
    socketRef.current = nextSocket;

    nextSocket.on('connect', () => {
      setStatus('connected');
      setError(null);
    });
    nextSocket.on('disconnect', (reason) => {
      setStatus(nextSocket.active ? 'reconnecting' : 'disconnected');
      if (!nextSocket.active) setError(reason);
    });
    nextSocket.io.on('reconnect_attempt', () => setStatus('reconnecting'));
    nextSocket.on('connect_error', (caught) => {
      setError(caught.message);
      if (['invalid_token', 'session_not_found', 'session_expired'].includes(caught.message)) {
        onInvalidCredentials?.();
      }
    });
    nextSocket.on(socketEvents.sessionState, (next: DemoSession) => setSession(next));
    nextSocket.on(socketEvents.sessionExpired, () => {
      setStatus('disconnected');
      setError('Sesión expirada');
    });
    nextSocket.connect();

    const heartbeat = window.setInterval(() => {
      if (nextSocket.connected) {
        nextSocket.emit(socketEvents.heartbeat, {
          eventId: crypto.randomUUID(),
          sessionId: credentials.sessionId,
        });
      }
    }, 8_000);

    return () => {
      window.clearInterval(heartbeat);
      nextSocket.disconnect();
      if (socketRef.current === nextSocket) socketRef.current = null;
    };
  }, [credentials, onInvalidCredentials]);

  const command = useCallback(
    <T>(event: string, payload: Record<string, unknown> = {}) =>
      new Promise<SocketAck<T>>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected || !credentials) {
          resolve({ ok: false, error: 'socket_disconnected' });
          return;
        }
        socket.timeout(3_000).emit(
          event,
          {
            ...payload,
            eventId: crypto.randomUUID(),
            sessionId: credentials.sessionId,
          },
          (timeoutError: Error | null, ack: SocketAck<T>) => {
            resolve(timeoutError ? { ok: false, error: 'ack_timeout' } : ack);
          },
        );
      }),
    [credentials],
  );

  const reconnect = useCallback(() => {
    setError(null);
    setStatus('reconnecting');
    socketRef.current?.connect();
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  return { status, session, error, command, reconnect, getSocket };
}

import { io, type Socket } from 'socket.io-client';
import type { SessionCredentials } from '../../shared/types';

function deriveServerUrl() {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  if (window.location.port === '5174') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return window.location.origin;
}

export function createSessionSocket(credentials: SessionCredentials): Socket {
  return io(deriveServerUrl(), {
    auth: { sessionId: credentials.sessionId, token: credentials.token },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 500,
    timeout: 4_000,
  });
}

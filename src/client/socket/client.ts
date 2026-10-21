import { io } from 'socket.io-client';

function deriveServerUrl() {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

export const socket = io(deriveServerUrl(), {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
});


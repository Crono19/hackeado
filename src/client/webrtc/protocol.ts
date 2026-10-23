import type { Socket } from 'socket.io-client';
import type { DemoSession } from '../../shared/types';

export interface SignalDescription {
  description: RTCSessionDescriptionInit;
}

export interface SignalCandidate {
  candidate: RTCIceCandidateInit;
}

export function emitWebRtcSignal(
  socket: Socket,
  session: Pick<DemoSession, 'id'>,
  event: string,
  payload: Record<string, unknown> = {},
) {
  socket.emit(event, {
    eventId: crypto.randomUUID(),
    sessionId: session.id,
    ...payload,
  });
}

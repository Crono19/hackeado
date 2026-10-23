import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as createClient, type Socket } from 'socket.io-client';
import { afterEach, describe, expect, it } from 'vitest';
import { SessionStore } from '../../src/server/sessions/store';
import { registerSocketGateway } from '../../src/server/sockets/gateway';
import { socketEvents } from '../../src/shared/events';
import type { DemoSession, SocketAck } from '../../src/shared/types';

const clients: Socket[] = [];
const servers: Array<{ io: Server; httpServer: ReturnType<typeof createServer> }> = [];

afterEach(async () => {
  for (const client of clients.splice(0)) client.disconnect();
  for (const server of servers.splice(0)) {
    await new Promise<void>((resolve) => server.io.close(() => resolve()));
    if (server.httpServer.listening)
      await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  }
});

describe('gateway resilience boundaries', () => {
  it('deduplicates commands and rate-limits each event independently', async () => {
    const store = new SessionStore();
    const created = store.createSession({ scenarioId: 'support-scam-default', mode: 'simulated' });
    const { url } = await serve(store);
    const socket = createClient(url, {
      auth: { sessionId: created.session.id, token: created.credentials.token },
      transports: ['websocket'],
      forceNew: true,
    });
    clients.push(socket);
    await connected(socket);

    const payload = { eventId: 'start-once', sessionId: created.session.id };
    expect((await command<DemoSession>(socket, socketEvents.sessionStart, payload)).ok).toBe(true);
    expect((await command<DemoSession>(socket, socketEvents.sessionStart, payload)).duplicate).toBe(
      true,
    );

    for (let index = 0; index < 40; index++) {
      const heartbeat = await command<DemoSession>(socket, socketEvents.heartbeat, {
        eventId: `heartbeat-${index}`,
        sessionId: created.session.id,
      });
      expect(heartbeat.ok).toBe(true);
    }
    const flooded = await command<DemoSession>(socket, socketEvents.heartbeat, {
      eventId: 'heartbeat-flooded',
      sessionId: created.session.id,
    });
    expect(flooded).toMatchObject({ ok: false, error: 'event_rate' });

    const independent = await command<DemoSession>(socket, socketEvents.timerControl, {
      eventId: 'timer-independent',
      sessionId: created.session.id,
      action: 'pause',
    });
    expect(independent.ok).toBe(true);
  });

  it('does not resurrect sessions or leases after an in-memory server restart', () => {
    const original = new SessionStore();
    const created = original.createSession({ scenarioId: 'support-scam-default', mode: 'live' });
    const restarted = new SessionStore();
    expect(() => restarted.authenticate(created.session.id, created.credentials.token)).toThrow(
      'Sesión inexistente o expirada.',
    );
  });
});

async function serve(store: SessionStore) {
  const httpServer = createServer();
  const io = new Server(httpServer);
  registerSocketGateway(io, store);
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  servers.push({ io, httpServer });
  const address = httpServer.address();
  if (!address || typeof address === 'string') throw new Error('test_server_address_missing');
  return { url: `http://127.0.0.1:${address.port}` };
}

function connected(socket: Socket) {
  if (socket.connected) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
}

function command<T>(socket: Socket, event: string, payload: object) {
  return new Promise<SocketAck<T>>((resolve) => socket.emit(event, payload, resolve));
}

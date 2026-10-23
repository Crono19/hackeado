import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as createClient, type Socket } from 'socket.io-client';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentRegistry } from '../../src/server/control/agent-registry.js';
import { ControlLeaseManager } from '../../src/server/control/lease-manager.js';
import { SessionStore } from '../../src/server/sessions/store.js';
import { registerSocketGateway } from '../../src/server/sockets/gateway.js';
import { socketEvents } from '../../src/shared/events.js';
import { updatePermission } from '../../src/shared/session.js';
import type { DemoSession, SessionCredentials, SocketAck } from '../../src/shared/types.js';

const clients: Socket[] = [];
const servers: Array<{ io: Server; httpServer: ReturnType<typeof createServer> }> = [];

afterEach(async () => {
  for (const client of clients.splice(0)) client.disconnect();
  for (const server of servers.splice(0)) {
    await new Promise<void>((resolve) => server.io.close(() => resolve()));
    if (server.httpServer.listening) {
      await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
    }
  }
});

describe('native control realtime foundation', () => {
  it('registers agent, requests consent, grants one lease, and activates control', async () => {
    const store = new SessionStore();
    const created = store.createSession({ scenarioId: 'support-scam-default', mode: 'live' });
    const coordinator = store.authenticate(created.session.id, created.credentials.token);
    const victimCredentials = approve(store, coordinator, created.session.pairingCode, 'victim');
    const attackerCredentials = approve(
      store,
      coordinator,
      created.session.pairingCode,
      'attacker',
    );
    store.updateState(coordinator, (session) =>
      updatePermission(updatePermission(session, 'screen', 'granted'), 'keyboard', 'granted'),
    );

    const httpServer = createServer();
    const io = new Server(httpServer);
    const registry = new AgentRegistry({
      allowedDeviceId: 'hackeado-windows-vm',
      agentKey: 'integration-agent-secret-key',
      heartbeatTimeoutMs: 9_000,
    });
    const leases = new ControlLeaseManager({ ttlMs: 15_000 });
    registerSocketGateway(io, store, { agentRegistry: registry, leaseManager: leases });
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    servers.push({ io, httpServer });
    const address = httpServer.address();
    if (!address || typeof address === 'string') throw new Error('test_server_address_missing');
    const url = `http://127.0.0.1:${address.port}`;

    const victim = connect(url, victimCredentials);
    const attacker = connect(url, attackerCredentials);
    await Promise.all([onceConnected(victim), onceConnected(attacker)]);

    const registered = await command<DemoSession>(victim, socketEvents.agentRegister, {
      eventId: 'event-agent-register-integration',
      sessionId: created.session.id,
      deviceId: 'hackeado-windows-vm',
      agentKey: 'integration-agent-secret-key',
      version: '0.2.0',
      capabilities: {
        nativeBridge: true,
        desktopCapture: true,
        pointer: true,
        keyboard: true,
        wheel: true,
        emergencyHotkey: true,
        displayCount: 1,
        screenWidth: 1920,
        screenHeight: 1080,
        dpiScale: 1,
      },
    });
    expect(registered.ok).toBe(true);
    expect(registered.data?.remote.agent.status).toBe('online');

    const offered = await command(victim, socketEvents.webrtcOffer, {
      eventId: 'event-webrtc-offer-integration',
      sessionId: created.session.id,
      description: { type: 'offer', sdp: 'v=0\r\n' },
    });
    expect(offered.ok).toBe(true);
    const answered = await command(attacker, socketEvents.webrtcAnswer, {
      eventId: 'event-webrtc-answer-integration',
      sessionId: created.session.id,
      description: { type: 'answer', sdp: 'v=0\r\n' },
    });
    expect(answered.ok).toBe(true);
    const ice = await command(victim, socketEvents.webrtcIce, {
      eventId: 'event-webrtc-ice-integration',
      sessionId: created.session.id,
      candidate: {
        candidate: 'candidate:1 1 UDP 2122252543 192.168.1.2 50000 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      },
    });
    expect(ice.ok).toBe(true);

    const requested = await command<DemoSession>(attacker, socketEvents.controlRequest, {
      eventId: 'event-control-request-integration',
      sessionId: created.session.id,
    });
    expect(requested.ok).toBe(true);
    expect(requested.data?.remote.input.status).toBe('requested');

    const granted = await command<DemoSession>(victim, socketEvents.controlGrant, {
      eventId: 'event-control-grant-integration',
      sessionId: created.session.id,
      approved: true,
    });
    expect(granted.ok).toBe(true);
    expect(granted.data?.remote.input.status).toBe('granted');
    const leaseId = granted.data?.remote.input.leaseId;
    expect(leaseId).toBeTypeOf('string');

    const tooEarly = await command<DemoSession>(attacker, socketEvents.controlActivate, {
      eventId: 'event-control-activate-too-early',
      sessionId: created.session.id,
      leaseId,
    });
    expect(tooEarly.ok).toBe(false);
    expect(tooEarly.error).toBe('control_activation_delay');
    await new Promise((resolve) => setTimeout(resolve, 3_050));

    const activated = await command<DemoSession>(attacker, socketEvents.controlActivate, {
      eventId: 'event-control-activate-integration',
      sessionId: created.session.id,
      leaseId,
    });
    expect(activated.ok).toBe(true);
    expect(activated.data?.remote.input.status).toBe('active');
    expect(activated.data?.remote.status).toBe('control');

    attacker.disconnect();
    await waitFor(() => store.getState(coordinator).remote.input.status === 'revoked');
    expect(store.getState(coordinator).remote.stopReason).toBe('network');
    expect(store.getState(coordinator).remote.media.status).toBe('ended');
  }, 10_000);
});

function approve(
  store: SessionStore,
  coordinator: ReturnType<SessionStore['authenticate']>,
  code: string,
  role: 'victim' | 'attacker',
): SessionCredentials {
  const ticket = store.requestJoin(code, role, `${role}-integration`);
  store.decideJoin(coordinator, ticket.request.id, true);
  const token = store.getJoinRequest(ticket.request.id, ticket.requestKey).token;
  if (!token) throw new Error('test_token_missing');
  return {
    sessionId: coordinator.sessionId,
    pairingCode: code,
    role,
    token,
    expiresAt: Date.now() + 60_000,
  };
}

function connect(url: string, credentials: SessionCredentials) {
  const socket = createClient(url, {
    auth: { sessionId: credentials.sessionId, token: credentials.token },
    transports: ['websocket'],
    forceNew: true,
  });
  clients.push(socket);
  return socket;
}

function onceConnected(socket: Socket) {
  if (socket.connected) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
}

function command<T>(socket: Socket, event: string, payload: Record<string, unknown>) {
  return new Promise<SocketAck<T>>((resolve) => socket.emit(event, payload, resolve));
}

async function waitFor(predicate: () => boolean, timeoutMs = 1_000) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error('condition_timeout');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

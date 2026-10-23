/* global fetch, setTimeout, clearTimeout, console */
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { io } from 'socket.io-client';

const baseUrl = process.env.HACKEADO_URL ?? 'http://127.0.0.1:3107';
const round = Number.parseInt(process.env.HACKEADO_ROUND ?? '1', 10);
const startedAt = performance.now();
const sockets = [];

try {
  const health = await api('/api/health');
  assert(health.status === 'ok' && health.version === '1.0.0-rc.1', 'release health mismatch');

  const created = await api('/api/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scenarioId: 'support-scam-default', mode: 'simulated' }),
  });
  const victimCredentials = await approvedRole(created, 'victim');
  const attackerCredentials = await approvedRole(created, 'attacker');
  const audienceCredentials = await approvedRole(created, 'audience');
  const coordinator = await connect(created.credentials);
  let victim = await connect(victimCredentials);
  const attacker = await connect(attackerCredentials);
  const audience = await connect(audienceCredentials);
  sockets.push(coordinator, victim, attacker, audience);

  const startEventId = randomUUID();
  const syncStartedAt = performance.now();
  const started = await emitAck(coordinator, 'session:start', event(startEventId, created));
  assert(started.ok && started.data.phase === 'waiting', 'automatic start failed');
  assert(started.data.timer.status === 'running', 'timer did not start with round');
  assert(performance.now() - syncStartedAt < 1_000, 'local sync exceeded 1 second');

  const duplicate = await emitAck(coordinator, 'session:start', event(startEventId, created));
  assert(duplicate.duplicate, 'event deduplication failed');

  const forbidden = await emitAck(
    audience,
    'phase:request',
    event(randomUUID(), created, { target: 'profile' }),
  );
  assert(!forbidden.ok && forbidden.error === 'role_forbidden', 'role boundary failed');

  victim.disconnect();
  sockets.splice(sockets.indexOf(victim), 1);
  victim = await connect(victimCredentials);
  sockets.push(victim);
  const rehydrated = await emitAck(victim, 'system:heartbeat', event(randomUUID(), created));
  assert(rehydrated.ok && rehydrated.data.phase === 'waiting', 'reconnection state mismatch');

  const profiled = await emitAck(
    victim,
    'profile:selected',
    event(randomUUID(), created, { profileId: 'alex' }),
  );
  assert(profiled.ok && profiled.data.phase === 'bait', 'profile did not trigger bait');
  const opened = await emitAck(victim, 'support:open', event(randomUUID(), created));
  assert(opened.ok && opened.data.phase === 'decision', 'support did not trigger decision');
  const signal = await emitAck(
    victim,
    'signal:examined',
    event(randomUUID(), created, { signal: 'sender' }),
  );
  assert(signal.ok && signal.data.score === 10, 'signal scoring failed');
  const decision = await emitAck(
    victim,
    'decision:submitted',
    event(randomUUID(), created, { choice: 'solve' }),
  );
  assert(decision.ok && decision.data.phase === 'permissions', 'risky decision routing failed');

  await attackerAction(attacker, created, 'request_screen');
  const screen = await permission(victim, created, 'screen', 'granted');
  assert(screen.data.phase === 'permissions', 'screen alone enabled input');
  await attackerAction(attacker, created, 'request_keyboard');
  const keyboard = await permission(victim, created, 'keyboard', 'granted');
  assert(keyboard.data.phase === 'connecting', 'double consent did not connect simulation');

  for (const action of ['mark_remote_ready', 'confirm_screen', 'confirm_control']) {
    const result = await attackerAction(attacker, created, action);
    assert(result.ok, `simulated control action failed: ${action}`);
  }
  const controlled = await emitAck(attacker, 'system:heartbeat', event(randomUUID(), created));
  assert(
    controlled.ok &&
      controlled.data.phase === 'controlled' &&
      controlled.data.outcome === 'compromised',
    'automatic controlled transition failed',
  );

  const publicBeforeReveal = await emitAck(
    audience,
    'system:heartbeat',
    event(randomUUID(), created),
  );
  assert(publicBeforeReveal.data.participants.length === 0, 'public participant leak');
  assert(publicBeforeReveal.data.pairingCode === '••••••', 'public pairing code leak');

  const revealed = await emitAck(attacker, 'control:reveal', event(randomUUID(), created));
  assert(revealed.ok && revealed.data.phase === 'reveal', 'attacker reveal failed');
  assert(revealed.data.remote.status === 'ended', 'reveal did not revoke remote input');

  const recovering = await emitAck(victim, 'recovery:begin', event(randomUUID(), created));
  assert(recovering.ok && recovering.data.phase === 'recovery', 'victim recovery start failed');
  const recoveryOrder = [
    'disconnect_remote',
    'revoke_permissions',
    'secure_accounts',
    'close_sessions',
    'enable_mfa',
    'review_report',
  ];
  const ordered = await emitAck(
    victim,
    'recovery:order',
    event(randomUUID(), created, { order: recoveryOrder }),
  );
  assert(ordered.ok && ordered.data.recovery.orderValidated, 'recovery order failed');
  for (const step of recoveryOrder) {
    const recovered = await emitAck(
      victim,
      'recovery:step',
      event(randomUUID(), created, { step }),
    );
    assert(recovered.ok, `recovery step failed: ${step}`);
  }
  const completed = await emitAck(victim, 'recovery:complete', event(randomUUID(), created));
  assert(completed.ok && completed.data.phase === 'result', 'recovery completion failed');
  assert(completed.data.recovery.status === 'complete', 'recovery state incomplete');

  const resetStartedAt = performance.now();
  const reset = await emitAck(coordinator, 'session:reset', event(randomUUID(), created));
  assert(reset.ok && reset.data?.token, `clean reset failed: ${JSON.stringify(reset)}`);
  assert(reset.data.pairingCode !== created.session.pairingCode, 'pairing code did not rotate');
  assert(performance.now() - resetStartedAt < 30_000, 'reset exceeded 30 seconds');

  const durationMs = Math.round(performance.now() - startedAt);
  console.log(
    `ROUND_RESULT ${JSON.stringify({
      round,
      status: 'PASS',
      durationMs,
      finalPhase: completed.data.phase,
      resetMs: Math.round(performance.now() - resetStartedAt),
      release: health.version,
    })}`,
  );
} finally {
  for (const socket of sockets) socket.disconnect();
}

async function api(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${body.error ?? body.message}`);
  return body;
}

async function approvedRole(created, role) {
  const ticket = await api('/api/sessions/join', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: created.session.pairingCode, role }),
  });
  await api(`/api/sessions/${created.session.id}/join-requests/${ticket.request.id}/decision`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${created.credentials.token}`,
    },
    body: JSON.stringify({ approved: true }),
  });
  const resolved = await api(
    `/api/join-requests/${ticket.request.id}?key=${encodeURIComponent(ticket.requestKey)}`,
  );
  return { ...created.credentials, role, token: resolved.token };
}

function connect(credentials) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      auth: { sessionId: credentials.sessionId, token: credentials.token },
      transports: ['websocket'],
      reconnection: false,
      timeout: 3_000,
    });
    const timer = setTimeout(() => reject(new Error(`socket timeout: ${credentials.role}`)), 4_000);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('connect_error', reject);
  });
}

function emitAck(socket, name, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ack timeout: ${name}`)), 3_000);
    socket.emit(name, payload, (ack) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

function event(eventId, created, fields = {}) {
  return { eventId, sessionId: created.session.id, ...fields };
}

function attackerAction(socket, created, action) {
  return emitAck(socket, 'attacker:action', event(randomUUID(), created, { action }));
}

function permission(socket, created, permissionName, status) {
  return emitAck(
    socket,
    'permission:answered',
    event(randomUUID(), created, { permission: permissionName, status }),
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

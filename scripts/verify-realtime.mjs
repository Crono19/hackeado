/* global fetch, setTimeout, clearTimeout, console */
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { io } from 'socket.io-client';

const baseUrl = process.env.HACKEADO_URL ?? 'http://127.0.0.1:3107';

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

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ack timeout: ${event}`)), 3_000);
    socket.emit(event, payload, (ack) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

function waitForState(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('session:state', listener);
      reject(new Error('state broadcast timeout'));
    }, 3_000);
    function listener(state) {
      if (!predicate(state)) return;
      clearTimeout(timer);
      socket.off('session:state', listener);
      resolve(state);
    }
    socket.on('session:state', listener);
  });
}

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

const eventId = randomUUID();
const syncStartedAt = performance.now();
const transition = await emitAck(coordinator, 'phase:request', {
  eventId,
  sessionId: created.session.id,
  target: 'waiting',
});
if (!transition.ok || transition.data.phase !== 'waiting') throw new Error('phase sync failed');
if (performance.now() - syncStartedAt >= 1_000) throw new Error('local sync exceeded 1 second');

const duplicate = await emitAck(coordinator, 'phase:request', {
  eventId,
  sessionId: created.session.id,
  target: 'waiting',
});
if (!duplicate.duplicate) throw new Error('dedup failed');

const forbidden = await emitAck(audience, 'phase:request', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  target: 'profile',
});
if (forbidden.ok || forbidden.error !== 'role_forbidden') throw new Error('role guard failed');

victim.disconnect();
victim = await connect(victimCredentials);
const heartbeat = await emitAck(victim, 'system:heartbeat', {
  eventId: randomUUID(),
  sessionId: created.session.id,
});
if (!heartbeat.ok || heartbeat.data.phase !== 'waiting')
  throw new Error('rehydration state mismatch');

const profile = await emitAck(victim, 'profile:selected', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  profileId: 'alex',
});
if (!profile.ok || profile.data.victimProfile.alias !== 'Alex Rivera')
  throw new Error('fictional profile start failed');

const audienceClock = waitForState(audience, (state) => state.timer.status === 'running');
const started = await emitAck(coordinator, 'timer:control', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'start',
});
if (!started.ok || started.data.timer.status !== 'running') throw new Error('timer start failed');
const synchronized = await audienceClock;
if (synchronized.timer.remainingSeconds !== started.data.timer.remainingSeconds)
  throw new Error('cross-panel timer mismatch');
const timerForbidden = await emitAck(audience, 'timer:control', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'pause',
});
if (timerForbidden.ok || timerForbidden.error !== 'role_forbidden')
  throw new Error('timer role guard failed');
await new Promise((resolve) => setTimeout(resolve, 1_250));
const paused = await emitAck(coordinator, 'timer:control', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'pause',
});
if (!paused.ok || paused.data.timer.status !== 'paused' || paused.data.timer.remainingSeconds > 899)
  throw new Error('authoritative timer pause failed');
await new Promise((resolve) => setTimeout(resolve, 1_100));
const pausedHeartbeat = await emitAck(audience, 'system:heartbeat', {
  eventId: randomUUID(),
  sessionId: created.session.id,
});
if (pausedHeartbeat.data.timer.remainingSeconds !== paused.data.timer.remainingSeconds)
  throw new Error('paused timer drifted');

const bait = await emitAck(coordinator, 'phase:request', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  target: 'bait',
});
if (!bait.ok || !bait.data.story.baitDeadlineAt) throw new Error('bait setup failed');
const opened = await emitAck(victim, 'support:open', {
  eventId: randomUUID(),
  sessionId: created.session.id,
});
if (!opened.ok || opened.data.phase !== 'decision') throw new Error('support open failed');
const signal = await emitAck(victim, 'signal:examined', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  signal: 'sender',
});
if (!signal.ok || signal.data.score !== 10) throw new Error('signal scoring failed');
const decision = await emitAck(victim, 'decision:submitted', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  choice: 'solve',
});
if (!decision.ok || decision.data.phase !== 'permissions')
  throw new Error('decision routing failed');
const actionForbidden = await emitAck(audience, 'attacker:action', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'request_screen',
});
if (actionForbidden.ok || actionForbidden.error !== 'role_forbidden')
  throw new Error('attacker action role guard failed');
const screenRequest = await emitAck(attacker, 'attacker:action', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'request_screen',
});
if (!screenRequest.ok || screenRequest.data.permissions[0].status !== 'requested')
  throw new Error('screen request failed');
const screenGrant = await emitAck(victim, 'permission:answered', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  permission: 'screen',
  status: 'granted',
});
if (!screenGrant.ok || screenGrant.data.risk.privacy === 0)
  throw new Error('permission risk sync failed');
const keyboardRequest = await emitAck(attacker, 'attacker:action', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'request_keyboard',
});
if (!keyboardRequest.ok) throw new Error('dependent action failed');
const moderate = await emitAck(victim, 'permission:answered', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  permission: 'keyboard',
  status: 'denied',
});
if (!moderate.ok || moderate.data.phase !== 'reveal' || moderate.data.outcome !== 'moderate')
  throw new Error('moderate route failed');

const publicState = await emitAck(audience, 'system:heartbeat', {
  eventId: randomUUID(),
  sessionId: created.session.id,
});
if (
  !publicState.ok ||
  publicState.data.participants.length !== 0 ||
  publicState.data.pairingCode !== '••••••'
)
  throw new Error('public state filtering failed');

const resumed = await emitAck(coordinator, 'timer:control', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'resume',
});
if (!resumed.ok) throw new Error('timer resume before simulation failed');
const simulatedEffect = waitForState(audience, (state) =>
  state.simulation.queue.some(
    (item) => item.actionId === 'move_cursor' && item.status === 'completed',
  ),
);
const queuedSimulation = await emitAck(attacker, 'simulation:enqueue', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'move_cursor',
  confirmed: true,
});
if (!queuedSimulation.ok) throw new Error('simulation enqueue failed');
const completedSimulation = await simulatedEffect;
if (completedSimulation.simulation.exposedPercent <= 0)
  throw new Error('simulation completion failed');
const pendingSimulation = await emitAck(attacker, 'simulation:enqueue', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'copy_files',
  confirmed: true,
});
if (!pendingSimulation.ok) throw new Error('second simulation enqueue failed');
const resiliencePause = await emitAck(coordinator, 'timer:control', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'pause',
});
if (
  !resiliencePause.ok ||
  resiliencePause.data.simulation.queue.some((item) => ['queued', 'running'].includes(item.status))
)
  throw new Error('pause did not cancel pending simulation');
const resilienceResume = await emitAck(coordinator, 'timer:control', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  action: 'resume',
});
if (!resilienceResume.ok || resilienceResume.data.timer.status !== 'running')
  throw new Error('resilience resume failed');

for (const target of ['containment', 'recovery']) {
  const phase = await emitAck(coordinator, 'phase:request', {
    eventId: randomUUID(),
    sessionId: created.session.id,
    target,
  });
  if (!phase.ok || phase.data.phase !== target) throw new Error(`${target} phase failed`);
}
const recoveryOrder = [
  'disconnect_remote',
  'revoke_permissions',
  'secure_accounts',
  'close_sessions',
  'enable_mfa',
  'review_report',
];
const wrongRecovery = await emitAck(victim, 'recovery:order', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  order: [...recoveryOrder].reverse(),
});
if (!wrongRecovery.ok || wrongRecovery.data.recovery.orderValidated)
  throw new Error('wrong recovery order was accepted');
const orderedRecovery = await emitAck(victim, 'recovery:order', {
  eventId: randomUUID(),
  sessionId: created.session.id,
  order: recoveryOrder,
});
if (!orderedRecovery.ok || !orderedRecovery.data.recovery.orderValidated)
  throw new Error('correct recovery order failed');
const stoppedRemote = await emitAck(victim, 'remote:stop-requested', {
  eventId: randomUUID(),
  sessionId: created.session.id,
});
if (!stoppedRemote.ok || stoppedRemote.data.remote.status !== 'ended')
  throw new Error('remote stop gate failed');
for (const step of recoveryOrder) {
  const recovered = await emitAck(victim, 'recovery:step', {
    eventId: randomUUID(),
    sessionId: created.session.id,
    step,
  });
  if (!recovered.ok) throw new Error(`recovery step failed: ${step}`);
}
const recoveryComplete = await emitAck(victim, 'recovery:complete', {
  eventId: randomUUID(),
  sessionId: created.session.id,
});
if (
  !recoveryComplete.ok ||
  recoveryComplete.data.phase !== 'result' ||
  recoveryComplete.data.recovery.status !== 'complete'
)
  throw new Error('recovery completion failed');
const emergency = await emitAck(coordinator, 'experience:emergency-stop', {
  eventId: randomUUID(),
  sessionId: created.session.id,
});
if (
  !emergency.ok ||
  emergency.data.phase !== 'emergency' ||
  emergency.data.remote.status !== 'ended' ||
  emergency.data.simulation.queue.some((item) => ['queued', 'running'].includes(item.status))
)
  throw new Error('safe emergency stop failed');

const resetStartedAt = performance.now();
const reset = await emitAck(coordinator, 'session:reset', {
  eventId: randomUUID(),
  sessionId: created.session.id,
});
if (!reset.ok || !reset.data.token || reset.data.pairingCode === created.session.pairingCode)
  throw new Error('clean reset failed');
if (performance.now() - resetStartedAt >= 30_000) throw new Error('reset exceeded 30 seconds');

coordinator.disconnect();
victim.disconnect();
attacker.disconnect();
audience.disconnect();
console.log(
  'realtime verification passed: sync, roles, story, permissions, public-filter, simulation, recovery, resilience, emergency, reset<30s',
);

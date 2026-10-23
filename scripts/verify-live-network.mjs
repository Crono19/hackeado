/* global fetch, setTimeout, clearTimeout, console */
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { URL } from 'node:url';
import { io } from 'socket.io-client';

const baseUrl = new URL(process.env.HACKEADO_URL ?? '');
if (baseUrl.protocol !== 'https:') {
  throw new Error('HACKEADO_URL debe usar https:// para validar exposición live.');
}

const requestStartedAt = performance.now();
const healthResponse = await fetch(new URL('/api/health', baseUrl), {
  headers: { origin: baseUrl.origin },
});
if (!healthResponse.ok) throw new Error(`health_failed_${healthResponse.status}`);
const health = await healthResponse.json();
if (health.status !== 'ok' || health.version !== '1.0.0-rc.1') {
  throw new Error('release_health_mismatch');
}
const httpsRoundTripMs = Math.round(performance.now() - requestStartedAt);

const createdResponse = await fetch(new URL('/api/sessions', baseUrl), {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: baseUrl.origin },
  body: JSON.stringify({ scenarioId: 'support-scam-default', mode: 'live' }),
});
if (!createdResponse.ok) throw new Error(`session_create_failed_${createdResponse.status}`);
const created = await createdResponse.json();

const socketStartedAt = performance.now();
const socket = io(baseUrl.origin, {
  auth: {
    sessionId: created.credentials.sessionId,
    token: created.credentials.token,
  },
  extraHeaders: { origin: baseUrl.origin },
  transports: ['websocket'],
  reconnection: false,
  timeout: 5_000,
});

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('wss_timeout')), 6_000);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
  const connectedMs = Math.round(performance.now() - socketStartedAt);
  const ackStartedAt = performance.now();
  const heartbeat = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('wss_ack_timeout')), 3_000);
    socket.emit(
      'system:heartbeat',
      {
        eventId: randomUUID(),
        sessionId: created.credentials.sessionId,
      },
      (ack) => {
        clearTimeout(timer);
        resolve(ack);
      },
    );
  });
  if (!heartbeat.ok) throw new Error(`wss_heartbeat_failed_${heartbeat.error}`);
  const ackMs = Math.round(performance.now() - ackStartedAt);
  console.log('LIVE NETWORK // PASS');
  console.log(`HTTPS ${httpsRoundTripMs}ms · WSS connect ${connectedMs}ms · ACK ${ackMs}ms`);
  console.log(`TLS origin ${baseUrl.origin} · release ${health.version}`);
  if (ackMs >= 150)
    console.log('WARN // latencia ACK supera objetivo de 150ms; probar control físico.');
} finally {
  socket.disconnect();
}

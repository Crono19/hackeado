import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config.js';
import { SessionStore } from './sessions/store.js';
import { registerSocketGateway } from './sockets/gateway.js';
import { isRequestOriginAllowed } from './security.js';
import { AgentRegistry } from './control/agent-registry.js';
import { ControlLeaseManager } from './control/lease-manager.js';

const store = new SessionStore(config.sessionTtlMs);
const app = createApp({
  store,
  allowedOrigins: config.allowedOrigins,
  enableDebugUi: config.enableDebugUi,
});
const secure = Boolean(config.tlsCertPath && config.tlsKeyPath);
const httpServer = secure
  ? createHttpsServer(
      {
        cert: readFileSync(config.tlsCertPath),
        key: readFileSync(config.tlsKeyPath),
        minVersion: 'TLSv1.2',
      },
      app,
    )
  : createHttpServer(app);
const agentRegistry = new AgentRegistry({
  allowedDeviceId: config.demoDeviceId,
  agentKey: config.demoAgentKey,
  heartbeatTimeoutMs: config.agentHeartbeatMs * 3,
});
const leaseManager = new ControlLeaseManager({ ttlMs: config.controlLeaseMs });

const io = new Server(httpServer, {
  cors: {
    origin: config.allowedOrigins,
    methods: ['GET', 'POST'],
  },
  allowRequest: (request, callback) => {
    callback(
      null,
      isRequestOriginAllowed(request.headers.origin, request.headers.host, config.allowedOrigins),
    );
  },
  maxHttpBufferSize: 32 * 1024,
  transports: ['websocket', 'polling'],
});

registerSocketGateway(io, store, { agentRegistry, leaseManager });

const cleanupTimer = setInterval(() => {
  for (const sessionId of store.cleanup()) {
    io.to(`session:${sessionId}`).emit('session:expired');
    io.in(`session:${sessionId}`).disconnectSockets(true);
  }
}, 30_000);
cleanupTimer.unref();

httpServer.listen(config.port, config.host, () => {
  console.log(
    `HACKEADO server running on ${secure ? 'https' : 'http'}://${config.host}:${config.port}`,
  );
});

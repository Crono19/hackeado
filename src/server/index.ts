import 'dotenv/config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config.js';
import { SessionStore } from './sessions/store.js';
import { registerSocketGateway } from './sockets/gateway.js';
import { isRequestOriginAllowed } from './security.js';

const store = new SessionStore(config.sessionTtlMs);
const app = createApp({ store, allowedOrigins: config.allowedOrigins });
const httpServer = createServer(app);

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

registerSocketGateway(io, store);

const cleanupTimer = setInterval(() => {
  for (const sessionId of store.cleanup()) {
    io.to(`session:${sessionId}`).emit('session:expired');
    io.in(`session:${sessionId}`).disconnectSockets(true);
  }
}, 30_000);
cleanupTimer.unref();

httpServer.listen(config.port, config.host, () => {
  console.log(`HACKEADO server running on http://${config.host}:${config.port}`);
});

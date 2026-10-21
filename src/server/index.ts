import 'dotenv/config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config.js';
import { socketEvents } from '../shared/events.js';

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.clientOrigin === '*' ? true : config.clientOrigin.split(','),
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.emit(socketEvents.connected, {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
  });
});

httpServer.listen(config.port, config.host, () => {
  console.log(`HACKEADO server running on http://${config.host}:${config.port}`);
});


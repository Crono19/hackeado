import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import { ZodError } from 'zod';
import type { HealthResponse } from '../shared/types.js';
import { createSessionRouter } from './http/sessions.js';
import { SessionStore, SessionStoreError } from './sessions/store.js';
import {
  enforceOrigin,
  noStoreApi,
  rateLimit,
  securityHeaders,
  SlidingWindowRateLimiter,
} from './security.js';

export interface AppOptions {
  clientBuildPath?: string;
  store?: SessionStore;
  allowedOrigins?: string[];
}

const clientRoutes = ['/', '/victima', '/atacante', '/publico', '/coordinacion', '/debug'];

export function buildHealthResponse(now = new Date()): HealthResponse {
  return {
    status: 'ok',
    service: 'hackeado-server',
    timestamp: now.toISOString(),
  };
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const store = options.store ?? new SessionStore();
  const clientBuildPath = options.clientBuildPath ?? resolve(process.cwd(), 'dist/client');
  const allowedOrigins = options.allowedOrigins ?? [
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ];
  const apiLimiter = new SlidingWindowRateLimiter(300);
  const mutationLimiter = new SlidingWindowRateLimiter(120);

  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(securityHeaders);
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', noStoreApi, rateLimit(apiLimiter, 'api'), enforceOrigin(allowedOrigins));
  app.use('/api', (request, response, next) =>
    request.method === 'POST'
      ? rateLimit(mutationLimiter, 'mutation')(request, response, next)
      : next(),
  );

  app.get('/api/health', (_request, response) => {
    response.json(buildHealthResponse());
  });

  app.use('/api', createSessionRouter(store));
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'route_not_found', message: 'Ruta inexistente.' });
  });

  if (existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath, { index: false }));
    app.get(clientRoutes, (_request, response) => {
      response.sendFile(resolve(clientBuildPath, 'index.html'));
    });
  }

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      void _next;
      if (error instanceof SessionStoreError) {
        response.status(error.status).json({ error: error.code, message: error.message });
        return;
      }
      if (error instanceof ZodError) {
        response.status(400).json({ error: 'invalid_payload', message: 'Datos inválidos.' });
        return;
      }
      if (isBodyParserError(error, 'entity.parse.failed')) {
        response.status(400).json({ error: 'invalid_json', message: 'JSON inválido.' });
        return;
      }
      if (isBodyParserError(error, 'entity.too.large')) {
        response
          .status(413)
          .json({ error: 'payload_too_large', message: 'Solicitud demasiado grande.' });
        return;
      }
      console.error('[HACKEADO] internal_error', error instanceof Error ? error.name : 'Unknown');
      response.status(500).json({ error: 'internal_error', message: 'Error interno.' });
    },
  );

  return app;
}

function isBodyParserError(error: unknown, type: string) {
  return Boolean(error && typeof error === 'object' && 'type' in error && error.type === type);
}

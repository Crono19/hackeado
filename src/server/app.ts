import express from 'express';
import type { HealthResponse } from '../shared/types.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_request, response) => {
    const payload: HealthResponse = {
      status: 'ok',
      service: 'hackeado-server',
      timestamp: new Date().toISOString(),
    };

    response.json(payload);
  });

  return app;
}


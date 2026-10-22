import { describe, expect, it } from 'vitest';
import { buildHealthResponse, createApp } from '../../src/server/app.js';

describe('server health', () => {
  it('builds the stable health contract', () => {
    expect(buildHealthResponse(new Date('2026-10-20T12:00:00.000Z'))).toEqual({
      status: 'ok',
      service: 'hackeado-server',
      timestamp: '2026-10-20T12:00:00.000Z',
    });
  });

  it('creates the Express application with identifying header disabled', () => {
    const app = createApp({ clientBuildPath: '/nonexistent-hackeado-client' });
    expect(app.get('x-powered-by')).toBe(false);
  });
});

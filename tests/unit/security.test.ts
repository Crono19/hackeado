import { describe, expect, it } from 'vitest';
import {
  contentSecurityPolicy,
  isRequestOriginAllowed,
  SlidingWindowRateLimiter,
} from '../../src/server/security';

describe('security boundary', () => {
  it('publishes restrictive browser capabilities', () => {
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("media-src 'self' blob:");
    expect(contentSecurityPolicy).toContain("connect-src 'self' ws: wss:");
  });

  it('allows same-origin and explicit origins, rejects malformed or foreign origins', () => {
    const allowed = ['http://localhost:5174'];
    expect(isRequestOriginAllowed(undefined, 'demo.local:3000', allowed)).toBe(true);
    expect(isRequestOriginAllowed('http://localhost:5174', 'demo.local:3000', allowed)).toBe(true);
    expect(isRequestOriginAllowed('http://demo.local:3000', 'demo.local:3000', allowed)).toBe(true);
    expect(isRequestOriginAllowed('https://foreign.example', 'demo.local:3000', allowed)).toBe(
      false,
    );
    expect(isRequestOriginAllowed('not a url', 'demo.local:3000', allowed)).toBe(false);
  });

  it('limits a key inside a sliding time window and recovers afterward', () => {
    let now = 1_000;
    const limiter = new SlidingWindowRateLimiter(2, 1_000, () => now);
    expect(limiter.consume('client').allowed).toBe(true);
    expect(limiter.consume('client').allowed).toBe(true);
    expect(limiter.consume('client')).toEqual({ allowed: false, retryAfterSeconds: 1 });
    now = 2_001;
    expect(limiter.consume('client').allowed).toBe(true);
  });
});

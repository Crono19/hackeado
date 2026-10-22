import type { NextFunction, Request, Response } from 'express';

const minute = 60_000;

export const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self' ws: wss:",
].join('; ');

export class SlidingWindowRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    public readonly maximum: number,
    private readonly windowMs = minute,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = this.now();
    const recent = (this.attempts.get(key) ?? []).filter((at) => at > now - this.windowMs);
    if (recent.length >= this.maximum) {
      const retryAt = recent[0]! + this.windowMs;
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)) };
    }
    recent.push(now);
    this.attempts.set(key, recent);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  cleanup() {
    const cutoff = this.now() - this.windowMs;
    for (const [key, attempts] of this.attempts) {
      const recent = attempts.filter((at) => at > cutoff);
      if (recent.length) this.attempts.set(key, recent);
      else this.attempts.delete(key);
    }
  }
}

export function securityHeaders(_request: Request, response: Response, next: NextFunction) {
  response.setHeader('Content-Security-Policy', contentSecurityPolicy);
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), usb=(), display-capture=(self)',
  );
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  next();
}

export function noStoreApi(_request: Request, response: Response, next: NextFunction) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Pragma', 'no-cache');
  next();
}

export function enforceOrigin(allowedOrigins: readonly string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
    const origin = request.header('origin');
    const host = request.header('host');
    if (isRequestOriginAllowed(origin, host, allowedOrigins)) return next();
    response.status(403).json({ error: 'origin_forbidden', message: 'Origen no autorizado.' });
  };
}

export function rateLimit(limiter: SlidingWindowRateLimiter, scope: string) {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = limiter.consume(
      `${scope}:${request.ip ?? request.socket.remoteAddress ?? 'local'}`,
    );
    response.setHeader('RateLimit-Limit', String(limiter.maximum));
    if (result.allowed) return next();
    response.setHeader('Retry-After', String(result.retryAfterSeconds));
    response
      .status(429)
      .json({ error: 'rate_limited', message: 'Demasiadas solicitudes. Intenta más tarde.' });
  };
}

export function isRequestOriginAllowed(
  origin: string | undefined,
  host: string | undefined,
  allowedOrigins: readonly string[],
): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

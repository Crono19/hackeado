const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
const parsedTtl = Number.parseInt(process.env.SESSION_TTL_MINUTES ?? '30', 10);

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number.isNaN(parsedPort) ? 3000 : parsedPort,
  allowedOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5174,http://127.0.0.1:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  sessionTtlMs: (Number.isNaN(parsedTtl) ? 30 : parsedTtl) * 60 * 1000,
};

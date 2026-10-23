const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
const parsedTtl = Number.parseInt(process.env.SESSION_TTL_MINUTES ?? '30', 10);
const parsedLeaseSeconds = Number.parseInt(process.env.CONTROL_LEASE_SECONDS ?? '15', 10);
const parsedAgentHeartbeat = Number.parseInt(process.env.AGENT_HEARTBEAT_MS ?? '3000', 10);

function positiveOr(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function booleanFromEnvironment(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').trim().toLowerCase());
}

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number.isNaN(parsedPort) ? 3000 : parsedPort,
  allowedOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5174,http://127.0.0.1:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  sessionTtlMs: (Number.isNaN(parsedTtl) ? 30 : parsedTtl) * 60 * 1000,
  demoDeviceId: process.env.DEMO_DEVICE_ID?.trim() ?? '',
  demoAgentKey: process.env.DEMO_AGENT_KEY ?? '',
  controlLeaseMs: positiveOr(parsedLeaseSeconds, 15) * 1000,
  agentHeartbeatMs: positiveOr(parsedAgentHeartbeat, 3000),
  requireNativeAgent: booleanFromEnvironment(process.env.REQUIRE_NATIVE_AGENT),
  enableDebugUi: booleanFromEnvironment(process.env.ENABLE_DEBUG_UI),
  tlsCertPath: process.env.TLS_CERT_PATH?.trim() ?? '',
  tlsKeyPath: process.env.TLS_KEY_PATH?.trim() ?? '',
};

if (config.requireNativeAgent && (!config.demoDeviceId || config.demoAgentKey.length < 16)) {
  throw new Error(
    'REQUIRE_NATIVE_AGENT necesita DEMO_DEVICE_ID y DEMO_AGENT_KEY de al menos 16 caracteres.',
  );
}

if (Boolean(config.tlsCertPath) !== Boolean(config.tlsKeyPath)) {
  throw new Error('TLS_CERT_PATH y TLS_KEY_PATH deben configurarse juntos.');
}

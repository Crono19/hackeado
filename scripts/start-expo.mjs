/* global console */
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';
import process from 'node:process';

const required = ['TLS_CERT_PATH', 'TLS_KEY_PATH', 'DEMO_DEVICE_ID', 'DEMO_AGENT_KEY'];
for (const name of required) {
  if (!process.env[name]) throw new Error(`expo_config_missing_${name.toLowerCase()}`);
}
if (!existsSync(process.env.TLS_CERT_PATH) || !existsSync(process.env.TLS_KEY_PATH)) {
  throw new Error('expo_tls_file_missing');
}
if (process.env.REQUIRE_NATIVE_AGENT !== 'true') throw new Error('expo_native_agent_not_required');
if (
  (process.env.DEMO_AGENT_KEY ?? '').length < 32 ||
  process.env.DEMO_AGENT_KEY?.includes('replace-')
) {
  throw new Error('expo_agent_key_weak_or_placeholder');
}
const origins = (process.env.CLIENT_ORIGIN ?? '').split(',').filter(Boolean);
if (!origins.length || origins.some((origin) => !origin.trim().startsWith('https://'))) {
  throw new Error('expo_origins_must_use_https');
}
if (!existsSync('dist/client/index.html') || !existsSync('dist/server/server/index.js')) {
  throw new Error('expo_build_missing_run_npm_build');
}

const port = process.env.PORT ?? '3000';
console.log('HACKEADO // EXPO RC ARMED');
for (const [name, entries] of Object.entries(networkInterfaces())) {
  for (const entry of entries ?? []) {
    if (entry.family === 'IPv4' && !entry.internal) {
      console.log(`${name}: https://${entry.address}:${port}`);
    }
  }
}
console.log('Native agent required · TLS active · debug UI disabled by default');

const child = spawn(process.execPath, ['dist/server/server/index.js'], {
  env: process.env,
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});

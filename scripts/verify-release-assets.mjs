/* global console */
import { access, readFile, stat } from 'node:fs/promises';

const requiredFiles = [
  'dist/client/index.html',
  'dist/server/server/index.js',
  'public/fallback/hackeado-respaldo.webm',
  'config/windows-agent.example.json',
  '.env.expo.example',
  'scripts/start-expo.sh',
  'scripts/windows/package-victim-host.ps1',
  'docs/23-release-candidate-sprint-12.md',
];
for (const path of requiredFiles) await access(path);

const fallback = await stat('public/fallback/hackeado-respaldo.webm');
if (fallback.size < 1_000_000) throw new Error('fallback_video_too_small');

const agentExample = JSON.parse(await readFile('config/windows-agent.example.json', 'utf8'));
if (agentExample.allowDevTools !== false) throw new Error('agent_devtools_must_be_disabled');
if (!String(agentExample.serverUrl).startsWith('https://'))
  throw new Error('agent_example_requires_https');
if (!String(agentExample.agentKey).includes('replace-'))
  throw new Error('agent_example_contains_secret');

const project = await readFile(
  'apps/windows-agent/Hackeado.VictimHost/Hackeado.VictimHost.csproj',
  'utf8',
);
if (!project.includes('<DebugSymbols>false</DebugSymbols>')) {
  throw new Error('windows_release_debug_symbols_enabled');
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
if (packageJson.version !== '1.0.0-rc.1') throw new Error('release_version_mismatch');

console.log('RELEASE ASSETS // PASS');
console.log(
  `Fallback ${(fallback.size / 1_048_576).toFixed(1)} MiB · DevTools OFF · HTTPS config · RC ${packageJson.version}`,
);

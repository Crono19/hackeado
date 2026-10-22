/* global console */
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import process from 'node:process';

const rounds = Number.parseInt(process.env.HACKEADO_ROUNDS ?? '10', 10);
const startedAt = performance.now();

for (let round = 1; round <= rounds; round += 1) {
  await runRound(round);
  console.log(`round ${String(round).padStart(2, '0')}/${rounds}: PASS`);
}

console.log(
  `${rounds} consecutive rounds passed in ${((performance.now() - startedAt) / 1000).toFixed(1)}s`,
);

function runRound(round) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/verify-realtime.mjs'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let errors = '';
    child.stderr.on('data', (chunk) => {
      errors += String(chunk);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`round ${round} failed (${code})\n${errors}`));
    });
  });
}

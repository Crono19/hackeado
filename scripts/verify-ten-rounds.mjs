/* global console */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';

const rounds = Number.parseInt(process.env.HACKEADO_ROUNDS ?? '10', 10);
const startedAt = performance.now();
const results = [];

for (let round = 1; round <= rounds; round += 1) {
  const result = await runRound(round);
  results.push(result);
  console.log(
    `round ${String(round).padStart(2, '0')}/${rounds}: PASS · ${result.durationMs}ms · reset ${result.resetMs}ms`,
  );
}

const totalDurationMs = Math.round(performance.now() - startedAt);
const evidenceDirectory = resolve(process.env.HACKEADO_EVIDENCE_DIR ?? 'release/evidence');
await mkdir(evidenceDirectory, { recursive: true });
const report = {
  schemaVersion: 1,
  release: results[0]?.release ?? 'unknown',
  generatedAt: new Date().toISOString(),
  baseUrl: process.env.HACKEADO_URL ?? 'http://127.0.0.1:3107',
  requestedRounds: rounds,
  passedRounds: results.length,
  totalDurationMs,
  maximumRoundMs: Math.max(...results.map((result) => result.durationMs)),
  maximumResetMs: Math.max(...results.map((result) => result.resetMs)),
  results,
};
const reportPath = resolve(evidenceDirectory, 'ten-rounds.json');
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`${rounds} consecutive rounds passed in ${(totalDurationMs / 1000).toFixed(1)}s`);
console.log(`evidence: ${reportPath}`);

function runRound(round) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/verify-realtime.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, HACKEADO_ROUND: String(round) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let errors = '';
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      errors += String(chunk);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`round ${round} failed (${code})\n${errors}${output}`));
        return;
      }
      const resultLine = output.split(/\r?\n/).find((line) => line.startsWith('ROUND_RESULT '));
      if (!resultLine) {
        reject(new Error(`round ${round} produced no structured result\n${output}`));
        return;
      }
      resolve(JSON.parse(resultLine.slice('ROUND_RESULT '.length)));
    });
  });
}

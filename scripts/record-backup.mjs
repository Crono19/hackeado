/* global console, setTimeout */
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const videoDirectory = resolve(tmpdir(), 'hackeado-backup-video');
const output = resolve('public/fallback/hackeado-respaldo.webm');
await mkdir(videoDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: videoDirectory, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const video = page.video();
await page.goto(pathToFileURL(resolve('public/fallback/respaldo.html')).href);
await page.locator('#play').click();
await new Promise((resolveWait) => setTimeout(resolveWait, 35_500));
await context.close();
if (!video) throw new Error('video_capture_unavailable');
await video.saveAs(output);
await browser.close();
console.log(`BACKUP VIDEO // ${output}`);

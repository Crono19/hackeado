import { defineConfig, devices } from '@playwright/test';

const port = 3119;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] }, grep: /responsive|accessibility/ },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      CLIENT_ORIGIN: `http://127.0.0.1:${port}`,
    },
  },
});

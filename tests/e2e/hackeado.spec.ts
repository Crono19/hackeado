import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';

type Role = 'coordinator' | 'victim' | 'attacker' | 'audience';
type Credentials = {
  sessionId: string;
  pairingCode: string;
  role: Role;
  token: string;
  expiresAt: number;
};

async function createTeam(request: APIRequestContext, roles: Exclude<Role, 'coordinator'>[]) {
  const createdResponse = await request.post('/api/sessions', {
    data: { scenarioId: 'support-scam-default', mode: 'simulated' },
  });
  expect(createdResponse.ok()).toBeTruthy();
  const created = (await createdResponse.json()) as { credentials: Credentials };
  const credentials: Partial<Record<Role, Credentials>> = { coordinator: created.credentials };

  for (const role of roles) {
    const joinResponse = await request.post('/api/sessions/join', {
      data: { code: created.credentials.pairingCode, role },
    });
    const ticket = (await joinResponse.json()) as {
      request: { id: string };
      requestKey: string;
    };
    await request.post(
      `/api/sessions/${created.credentials.sessionId}/join-requests/${ticket.request.id}/decision`,
      {
        headers: { authorization: `Bearer ${created.credentials.token}` },
        data: { approved: true },
      },
    );
    const resolvedResponse = await request.get(
      `/api/join-requests/${ticket.request.id}?key=${encodeURIComponent(ticket.requestKey)}`,
    );
    const resolved = (await resolvedResponse.json()) as { token: string };
    credentials[role] = { ...created.credentials, role, token: resolved.token };
  }
  return credentials as Record<Role, Credentials>;
}

async function connect(baseURL: string, credentials: Credentials): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(baseURL, {
      auth: { sessionId: credentials.sessionId, token: credentials.token },
      transports: ['websocket'],
      reconnection: false,
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

async function command<T>(socket: Socket, credentials: Credentials, event: string, payload = {}) {
  return new Promise<T>((resolve, reject) => {
    socket
      .timeout(3_000)
      .emit(
        event,
        { eventId: randomUUID(), sessionId: credentials.sessionId, ...payload },
        (error: Error | null, ack: { ok: boolean; error?: string; data: T }) => {
          if (error || !ack?.ok) reject(error ?? new Error(ack?.error ?? 'command_failed'));
          else resolve(ack.data);
        },
      );
  });
}

async function rolePage(context: BrowserContext, credentials: Credentials, path: string) {
  await context.addInitScript((value) => {
    localStorage.setItem(`hackeado:session:${value.role}`, JSON.stringify(value));
  }, credentials);
  const page = await context.newPage();
  await page.goto(path);
  await expect(page.getByText('MODE::SIMULATED')).toBeVisible();
  return page;
}

async function enterStory(page: Page, coordinator: Socket, credentials: Credentials) {
  await command(coordinator, credentials, 'phase:request', { target: 'waiting' });
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: /Entrar al escritorio/ }).click();
  await command(coordinator, credentials, 'phase:request', { target: 'bait' });
  await page.getByRole('button', { name: /Revisar mensaje/ }).click();
}

test('flujo seguro termina al verificar identidad', async ({ browser, request, baseURL }) => {
  const team = await createTeam(request, ['victim']);
  const coordinator = await connect(baseURL!, team.coordinator);
  const context = await browser.newContext();
  const victim = await rolePage(context, team.victim, '/victima');
  await enterStory(victim, coordinator, team.coordinator);
  await victim.getByRole('button', { name: /Verificar/ }).click();
  await expect(victim.getByText(/Verificaste antes de confiar/)).toBeVisible();
  coordinator.disconnect();
  await context.close();
});

test('flujo moderado revela observar sin controlar', async ({ browser, request, baseURL }) => {
  const team = await createTeam(request, ['victim', 'attacker', 'audience']);
  const coordinator = await connect(baseURL!, team.coordinator);
  const attacker = await connect(baseURL!, team.attacker);
  const victimContext = await browser.newContext();
  const audienceContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const victim = await rolePage(victimContext, team.victim, '/victima');
  const audience = await rolePage(audienceContext, team.audience, '/publico');
  await enterStory(victim, coordinator, team.coordinator);
  await victim.getByRole('button', { name: /Solucionar ahora/ }).click();
  await command(attacker, team.attacker, 'attacker:action', { action: 'request_screen' });
  await victim.getByRole('button', { name: /Permitir una vez/ }).click();
  await command(attacker, team.attacker, 'attacker:action', { action: 'request_keyboard' });
  await victim.getByRole('button', { name: 'Rechazar' }).click();
  await expect(audience.getByText('ESTABA DENTRO.')).toBeVisible();
  await expect(audience.getByText(/Puede observar consecuencias/)).toBeVisible();
  coordinator.disconnect();
  attacker.disconnect();
  await victimContext.close();
  await audienceContext.close();
});

test('flujo comprometido recupera control completo', async ({ browser, request, baseURL }) => {
  const team = await createTeam(request, ['victim', 'attacker']);
  const coordinator = await connect(baseURL!, team.coordinator);
  const attacker = await connect(baseURL!, team.attacker);
  const victimSocket = await connect(baseURL!, team.victim);
  const context = await browser.newContext();
  const victim = await rolePage(context, team.victim, '/victima');
  await enterStory(victim, coordinator, team.coordinator);
  await victim.getByRole('button', { name: /Solucionar ahora/ }).click();
  await command(attacker, team.attacker, 'attacker:action', { action: 'request_screen' });
  await victim.getByRole('button', { name: /Permitir una vez/ }).click();
  await command(attacker, team.attacker, 'attacker:action', { action: 'request_keyboard' });
  await victim.getByRole('button', { name: /Permitir una vez/ }).click();
  await command(coordinator, team.coordinator, 'phase:request', { target: 'connecting' });
  for (const status of ['ready', 'screen', 'control']) {
    await command(coordinator, team.coordinator, 'remote:status', { status });
  }
  await command(coordinator, team.coordinator, 'phase:request', { target: 'controlled' });
  for (const target of ['reveal', 'containment', 'recovery']) {
    await command(coordinator, team.coordinator, 'phase:request', { target });
  }
  const order = [
    'disconnect_remote',
    'revoke_permissions',
    'secure_accounts',
    'close_sessions',
    'enable_mfa',
    'review_report',
  ];
  await command(victimSocket, team.victim, 'recovery:order', { order });
  await command(victimSocket, team.victim, 'remote:stop-requested');
  for (const step of order) await command(victimSocket, team.victim, 'recovery:step', { step });
  await command(victimSocket, team.victim, 'recovery:complete');
  await expect(
    victim.getByText('VERIFICA IDENTIDAD · LIMITA PERMISOS · DETÉN · PROTEGE · REPORTA'),
  ).toBeVisible();
  coordinator.disconnect();
  attacker.disconnect();
  victimSocket.disconnect();
  await context.close();
});

test('parada de emergencia domina cualquier escena activa', async ({
  browser,
  request,
  baseURL,
}) => {
  const team = await createTeam(request, ['victim']);
  const coordinator = await connect(baseURL!, team.coordinator);
  const context = await browser.newContext();
  const victim = await rolePage(context, team.victim, '/victima');
  await command(coordinator, team.coordinator, 'phase:request', { target: 'waiting' });
  await command(coordinator, team.coordinator, 'experience:emergency-stop');
  await expect(victim.getByText('ACCESO FINALIZADO')).toBeVisible();
  await expect(victim.getByText('La demostración está en estado seguro.')).toBeVisible();
  coordinator.disconnect();
  await context.close();
});

test('señalización WebRTC viaja solo entre víctima y atacante autorizados', async ({
  request,
  baseURL,
}) => {
  const team = await createTeam(request, ['victim', 'attacker']);
  const victim = await connect(baseURL!, team.victim);
  const attacker = await connect(baseURL!, team.attacker);
  const receivedOffer = new Promise<{ description: RTCSessionDescriptionInit }>((resolve) => {
    attacker.once('webrtc:offer', resolve);
  });
  const description: RTCSessionDescriptionInit = { type: 'offer', sdp: 'v=0\r\n' };
  await command(victim, team.victim, 'webrtc:offer', { description });
  await expect(receivedOffer).resolves.toEqual({ description });
  victim.disconnect();
  attacker.disconnect();
});

test('coordinación bloquea Bajo control incompleto y permite Revelación moderada', async ({
  browser,
  request,
  baseURL,
}) => {
  const team = await createTeam(request, ['victim', 'attacker']);
  const coordinatorSocket = await connect(baseURL!, team.coordinator);
  const victimSocket = await connect(baseURL!, team.victim);
  const attackerSocket = await connect(baseURL!, team.attacker);
  const context = await browser.newContext();
  const coordinator = await rolePage(context, team.coordinator, '/coordinacion');

  await command(coordinatorSocket, team.coordinator, 'phase:request', { target: 'waiting' });
  await command(victimSocket, team.victim, 'profile:selected', { profileId: 'alex' });
  await command(coordinatorSocket, team.coordinator, 'phase:request', { target: 'bait' });
  await command(victimSocket, team.victim, 'support:open');
  await command(victimSocket, team.victim, 'decision:submitted', { choice: 'solve' });
  await command(attackerSocket, team.attacker, 'attacker:action', { action: 'request_screen' });
  await command(victimSocket, team.victim, 'permission:answered', {
    permission: 'screen',
    status: 'granted',
  });
  await command(attackerSocket, team.attacker, 'attacker:action', { action: 'request_keyboard' });
  await command(victimSocket, team.victim, 'permission:answered', {
    permission: 'keyboard',
    status: 'granted',
  });
  await command(coordinatorSocket, team.coordinator, 'phase:request', { target: 'connecting' });

  await expect(coordinator.getByRole('button', { name: /Bajo control/ })).toBeDisabled();
  await expect(coordinator.getByText(/Completa: Armar WebRTC/)).toBeVisible();
  await coordinator.getByRole('button', { name: /Revelación/ }).click();
  await expect(coordinator.locator('.scene-director h2')).toHaveText('Revelación');

  coordinatorSocket.disconnect();
  victimSocket.disconnect();
  attackerSocket.disconnect();
  await context.close();
});

test('frontera HTTP rechaza origen y JSON malformado sin filtrar detalles', async ({ request }) => {
  const health = await request.get('/api/health');
  expect(health.headers()['content-security-policy']).toContain("default-src 'self'");
  expect(health.headers()['permissions-policy']).toContain('camera=()');
  expect(health.headers()['permissions-policy']).toContain('display-capture=(self)');
  expect(health.headers()['cache-control']).toBe('no-store');

  const foreign = await request.post('/api/sessions', {
    headers: { origin: 'https://foreign.example' },
    data: { scenarioId: 'support-scam-default', mode: 'simulated' },
  });
  expect(foreign.status()).toBe(403);
  expect(await foreign.json()).toEqual({
    error: 'origin_forbidden',
    message: 'Origen no autorizado.',
  });

  const malformed = await request.post('/api/sessions', {
    headers: { 'content-type': 'application/json' },
    data: '{broken',
  });
  expect(malformed.status()).toBe(400);
  expect(await malformed.json()).toEqual({ error: 'invalid_json', message: 'JSON inválido.' });
});

test('responsive y accessibility conservan navegación visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Víctima/ })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('href', '#main-content');
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    unnamedButtons: [...document.querySelectorAll('button')].filter(
      (button) => !(button.textContent?.trim() || button.getAttribute('aria-label')),
    ).length,
    imagesWithoutAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
  }));
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.unnamedButtons).toBe(0);
  expect(metrics.imagesWithoutAlt).toBe(0);
});

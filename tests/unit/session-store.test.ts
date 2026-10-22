import { describe, expect, it } from 'vitest';
import { SessionStore, SessionStoreError } from '../../src/server/sessions/store.js';
import type { ExperienceRole } from '../../src/shared/types.js';

function setup(ttlMs = 60_000) {
  let now = 1_000;
  const store = new SessionStore(ttlMs, () => now);
  const created = store.createSession({ scenarioId: 'support-scam-default', mode: 'simulated' });
  const coordinator = store.authenticate(created.session.id, created.credentials.token);
  return { store, created, coordinator, setNow: (value: number) => (now = value) };
}

function approveRole(
  store: SessionStore,
  created: ReturnType<SessionStore['createSession']>,
  coordinator: ReturnType<SessionStore['authenticate']>,
  role: Exclude<ExperienceRole, 'coordinator'>,
) {
  const ticket = store.requestJoin(created.session.pairingCode, role, `client-${role}`);
  store.decideJoin(coordinator, ticket.request.id, true);
  const resolved = store.getJoinRequest(ticket.request.id, ticket.requestKey);
  return { ticket, token: resolved.token! };
}

describe('temporary session store', () => {
  it('creates coordinator and approves all remaining roles', () => {
    const { store, created, coordinator } = setup();
    expect(coordinator.role).toBe('coordinator');

    for (const role of ['victim', 'attacker', 'audience'] as const) {
      const { token } = approveRole(store, created, coordinator, role);
      expect(store.authenticate(created.session.id, token).role).toBe(role);
    }
    expect(store.getState(coordinator).participants).toHaveLength(4);
  });

  it('keeps requests waiting until coordinator resolves them and supports rejection', () => {
    const { store, created, coordinator } = setup();
    const ticket = store.requestJoin(created.session.pairingCode, 'victim', 'client');
    expect(store.getJoinRequest(ticket.request.id, ticket.requestKey).request.status).toBe(
      'waiting',
    );
    store.decideJoin(coordinator, ticket.request.id, false);
    expect(store.getJoinRequest(ticket.request.id, ticket.requestKey).request.status).toBe(
      'rejected',
    );
  });

  it('expires inactive sessions and their pairing code', () => {
    const { store, created, setNow } = setup(1_000);
    setNow(2_001);
    expect(() => store.requestJoin(created.session.pairingCode, 'victim', 'client')).toThrow(
      SessionStoreError,
    );
  });

  it('expires an issued role token even when session activity extended state lifetime', () => {
    const { store, created, setNow } = setup(1_000);
    setNow(1_500);
    expect(store.authenticate(created.session.id, created.credentials.token).role).toBe(
      'coordinator',
    );
    setNow(2_001);
    expect(() => store.authenticate(created.session.id, created.credentials.token)).toThrow(
      'Token expirado',
    );
  });

  it('invalidates every previous token and rotates code on reset', () => {
    const { store, created, coordinator } = setup();
    const victim = approveRole(store, created, coordinator, 'victim');
    const reset = store.reset(coordinator);
    expect(reset.session.pairingCode).not.toBe(created.session.pairingCode);
    expect(() => store.authenticate(created.session.id, created.credentials.token)).toThrow(
      'Token inválido',
    );
    expect(() => store.authenticate(created.session.id, victim.token)).toThrow('Token inválido');
    expect(store.authenticate(created.session.id, reset.credentials.token).role).toBe(
      'coordinator',
    );
  });

  it('blocks reset during remote access and permits repeatable clean resets after ending', () => {
    const { store, coordinator } = setup();
    store.updateState(coordinator, (session) => ({
      ...session,
      remote: { ...session.remote, status: 'control' },
    }));
    expect(() => store.reset(coordinator)).toThrow('Termina y confirma el acceso remoto');
    store.updateState(coordinator, (session) => ({
      ...session,
      remote: { ...session.remote, status: 'ended', endedAt: 1_500 },
    }));
    const first = store.reset(coordinator);
    const nextCoordinator = store.authenticate(first.session.id, first.credentials.token);
    const second = store.reset(nextCoordinator);
    expect(second.session.remote.status).toBe('idle');
    expect(second.session.pairingCode).not.toBe(first.session.pairingCode);
  });

  it('prevents public role from controlling phases', () => {
    const { store, created, coordinator } = setup();
    const { token } = approveRole(store, created, coordinator, 'audience');
    const publicAuth = store.authenticate(created.session.id, token);
    expect(() => store.assertRole(publicAuth, ['coordinator'])).toThrow('no autorizado');
  });

  it('limits repeated pairing attempts', () => {
    const { store } = setup();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      expect(() => store.requestJoin('999999', 'victim', 'same-client')).toThrow();
    }
    expect(() => store.requestJoin('999999', 'victim', 'same-client')).toThrow(
      'Demasiados intentos',
    );
  });
});

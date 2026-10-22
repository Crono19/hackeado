import { describe, expect, it } from 'vitest';
import { SessionStore } from '../../src/server/sessions/store.js';
import { disconnectParticipant } from '../../src/server/sockets/gateway.js';

function connectedVictim() {
  const store = new SessionStore();
  const created = store.createSession({ scenarioId: 'support-scam-default', mode: 'simulated' });
  const coordinator = store.authenticate(created.session.id, created.credentials.token);
  const ticket = store.requestJoin(created.session.pairingCode, 'victim', 'victim-browser');
  store.decideJoin(coordinator, ticket.request.id, true);
  const token = store.getJoinRequest(ticket.request.id, ticket.requestKey).token!;
  const victim = store.authenticate(created.session.id, token);
  store.setParticipantStatus(victim, 'connected');
  return { store, created, coordinator, victim, token };
}

describe('realtime state guarantees', () => {
  it('deduplicates critical event identifiers', () => {
    const { store, coordinator } = connectedVictim();
    expect(store.isDuplicate(coordinator, 'event-unique-0001')).toBe(false);
    expect(store.isDuplicate(coordinator, 'event-unique-0001')).toBe(true);
  });

  it('marks closed victim disconnected and pauses active timer', () => {
    const { store, coordinator, victim } = connectedVictim();
    store.updateState(coordinator, (session) => ({
      ...session,
      timer: { ...session.timer, status: 'running' },
    }));
    const state = disconnectParticipant(store, victim);
    expect(state.participants.find((item) => item.id === victim.participantId)?.status).toBe(
      'disconnected',
    );
    expect(state.timer.status).toBe('paused');
  });

  it('reconnects with same temporary token and restores full state', () => {
    const { store, created, victim, token } = connectedVictim();
    store.updateState(victim, (session) => ({ ...session, score: 40, revision: 7 }));
    disconnectParticipant(store, victim);
    const reconnected = store.authenticate(created.session.id, token);
    const restored = store.setParticipantStatus(reconnected, 'connected');
    expect(restored.score).toBe(40);
    expect(restored.revision).toBe(7);
    expect(restored.participants.find((item) => item.id === victim.participantId)?.status).toBe(
      'connected',
    );
  });
});

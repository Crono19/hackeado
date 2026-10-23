import { describe, expect, it } from 'vitest';
import { toPublicSession } from '../../src/shared/public-state.js';
import { createInitialSession } from '../../src/shared/session.js';

describe('audience state projection', () => {
  it('hides private decisions, participants, permissions, and control before reveal', () => {
    const base = createInitialSession({ now: 1_000 });
    const privateState = {
      ...base,
      phase: 'controlled' as const,
      participants: [
        {
          id: 'secret-id',
          role: 'coordinator' as const,
          status: 'connected' as const,
          joinedAt: 1,
          lastSeenAt: 2,
        },
      ],
      story: {
        examinedSignals: ['sender' as const],
        decision: { choice: 'solve' as const, route: 'continue' as const, submittedAt: 2 },
      },
      permissions: base.permissions.map((permission) => ({
        ...permission,
        status: 'granted' as const,
      })),
      remote: {
        ...base.remote,
        status: 'control' as const,
        input: { status: 'active' as const, leaseId: 'private-lease-id' },
      },
    };
    const publicState = toPublicSession(privateState);
    expect(publicState.phase).toBe('decision');
    expect(publicState.participants).toEqual([]);
    expect(publicState.story.decision).toBeUndefined();
    expect(publicState.permissions.every((item) => item.status === 'idle')).toBe(true);
    expect(publicState.remote.status).toBe('idle');
    expect(publicState.remote.input.leaseId).toBeUndefined();
    expect(publicState.pairingCode).toBe('••••••');
  });

  it('reveals educational state only when reveal begins', () => {
    const base = createInitialSession({ now: 1_000 });
    const state = {
      ...base,
      phase: 'reveal' as const,
      outcome: 'moderate' as const,
      remote: {
        ...base.remote,
        agent: {
          ...base.remote.agent,
          status: 'online' as const,
          deviceId: 'private-device',
          agentId: 'private-agent',
        },
        input: {
          status: 'active' as const,
          leaseId: 'private-lease',
          ownerParticipantId: 'private-owner',
        },
      },
    };
    const publicState = toPublicSession(state);
    expect(publicState.outcome).toBe('moderate');
    expect(publicState.phase).toBe('reveal');
    expect(publicState.remote.agent.agentId).toBeUndefined();
    expect(publicState.remote.agent.deviceId).toBeUndefined();
    expect(publicState.remote.input.leaseId).toBeUndefined();
    expect(publicState.remote.input.ownerParticipantId).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import {
  activateNativeControl,
  beginRemoteMedia,
  denyNativeControl,
  endRemoteMedia,
  grantNativeControl,
  markRemoteAgentOffline,
  markRemoteMediaLive,
  registerRemoteAgent,
  requestNativeControl,
  remoteSessionIsActive,
  revokeNativeControl,
} from '../../src/shared/remote-state.js';
import { createInitialSession, updatePermission } from '../../src/shared/session.js';

const capabilities = {
  nativeBridge: true,
  desktopCapture: true,
  pointer: true,
  keyboard: true,
  wheel: true,
  emergencyHotkey: true,
  displayCount: 1,
  screenWidth: 1920,
  screenHeight: 1080,
  dpiScale: 1,
};

describe('native remote state', () => {
  it('starts with separate offline, media, input, and quality state', () => {
    const session = createInitialSession({ now: 1_000 });
    expect(session.remote.agent.status).toBe('offline');
    expect(session.remote.media.status).toBe('idle');
    expect(session.remote.input.status).toBe('disabled');
    expect(session.remote.quality.width).toBe(0);
  });

  it('requires screen sharing but not prior keyboard permission before control request', () => {
    let session = createInitialSession({ now: 1_000, mode: 'live' });
    session = registerRemoteAgent(
      session,
      {
        sessionId: session.id,
        agentId: 'agent-authorized-0001',
        deviceId: 'hackeado-windows-vm',
        version: '0.2.0',
        participantId: 'victim-01',
        registeredAt: 1_100,
        lastSeenAt: 1_100,
        capabilities,
      },
      1_100,
    );
    expect(() => requestNativeControl(session, 'attacker-01', 1_200)).toThrow(
      'screen_permission_required',
    );
    session = updatePermission(session, 'screen', 'granted', 1_300);
    session = beginRemoteMedia(session, 1_325);
    session = markRemoteMediaLive(session, 1_350);
    expect(requestNativeControl(session, 'attacker-01', 1_400).remote.input.status).toBe(
      'requested',
    );
  });

  it('moves request through grant, activation, and revocation', () => {
    let session = createInitialSession({ now: 1_000 });
    session = updatePermission(session, 'screen', 'granted', 1_100);
    session = registerRemoteAgent(
      session,
      {
        sessionId: session.id,
        agentId: 'agent-authorized-0001',
        deviceId: 'hackeado-windows-vm',
        version: '0.2.0',
        participantId: 'victim-01',
        registeredAt: 1_300,
        lastSeenAt: 1_300,
        capabilities,
      },
      1_300,
    );
    session = beginRemoteMedia(session, 1_350);
    session = markRemoteMediaLive(session, 1_375);
    session = requestNativeControl(session, 'attacker-01', 1_400);
    const lease = {
      leaseId: 'lease-authorized-0001',
      sessionId: session.id,
      ownerParticipantId: 'attacker-01',
      agentParticipantId: 'victim-01',
      issuedAt: 1_500,
      expiresAt: 16_500,
    };
    session = grantNativeControl(session, lease, 'victim-01', 1_500);
    expect(session.remote.input.status).toBe('granted');
    expect(session.permissions.find((permission) => permission.key === 'keyboard')?.status).toBe(
      'granted',
    );
    expect(() => activateNativeControl(session, lease, 4_499)).toThrow('control_activation_delay');
    session = activateNativeControl(session, lease, 4_500);
    expect(session.remote.input.status).toBe('active');
    expect(session.remote.status).toBe('control');
    session = revokeNativeControl(session, 'victim', 4_700);
    expect(session.remote.input.status).toBe('revoked');
    expect(session.remote.input.leaseId).toBeUndefined();
    expect(session.remote.stopReason).toBe('victim');
  });

  it('revokes input when agent heartbeat is lost', () => {
    let session = createInitialSession({ now: 1_000 });
    session = {
      ...session,
      remote: {
        ...session.remote,
        status: 'control',
        agent: { status: 'online', capabilities },
        media: { status: 'live', startedAt: 1_000 },
        input: { status: 'active', leaseId: 'lease-authorized-0001' },
      },
    };
    const stopped = markRemoteAgentOffline(session, 'timeout', 2_000);
    expect(stopped.remote.agent.status).toBe('offline');
    expect(stopped.remote.media.status).toBe('ended');
    expect(stopped.remote.input.status).toBe('revoked');
  });

  it('ends media and input together so a completed reveal can be reset', () => {
    const session = {
      ...createInitialSession({ now: 1_000 }),
      remote: {
        ...createInitialSession({ now: 1_000 }).remote,
        status: 'control' as const,
        media: { status: 'live' as const, startedAt: 1_100 },
        input: { status: 'active' as const, leaseId: 'lease-authorized-0001' },
      },
    };
    const stopped = endRemoteMedia(session, 'attacker', 2_000);
    expect(stopped.remote.status).toBe('ended');
    expect(stopped.remote.media.status).toBe('ended');
    expect(stopped.remote.input.status).toBe('revoked');
    expect(remoteSessionIsActive(stopped)).toBe(false);
  });

  it('keeps screen visible when victim rejects control and requires a new request', () => {
    let session = createInitialSession({ now: 1_000 });
    session = updatePermission(session, 'screen', 'granted', 1_100);
    session = registerRemoteAgent(
      session,
      {
        sessionId: session.id,
        agentId: 'agent-authorized-0001',
        deviceId: 'hackeado-windows-vm',
        version: '0.3.0',
        participantId: 'victim-01',
        registeredAt: 1_200,
        lastSeenAt: 1_200,
        capabilities,
      },
      1_200,
    );
    session = markRemoteMediaLive(beginRemoteMedia(session, 1_300), 1_350);
    session = requestNativeControl(session, 'attacker-01', 1_400);
    session = denyNativeControl(session, 1_500, 'victim-01');
    expect(session.remote.media.status).toBe('live');
    expect(session.remote.input.status).toBe('revoked');
    expect(session.remote.input.revokedByParticipantId).toBe('victim-01');
    expect(() =>
      activateNativeControl(
        session,
        {
          leaseId: 'lease-authorized-0001',
          sessionId: session.id,
          ownerParticipantId: 'attacker-01',
          agentParticipantId: 'victim-01',
          issuedAt: 1_600,
          expiresAt: 16_600,
        },
        5_000,
      ),
    ).toThrow('lease_mismatch');
  });
});

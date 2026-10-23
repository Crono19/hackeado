import type {
  AgentCapabilities,
  DemoSession,
  RemoteControlState,
  RemoteQualityState,
  RemoteStopReason,
  TimelineEvent,
} from './types.js';
import type { ControlLeaseView, RegisteredAgentView } from './remote-protocol.js';

export const emptyAgentCapabilities: AgentCapabilities = {
  nativeBridge: false,
  desktopCapture: false,
  pointer: false,
  keyboard: false,
  wheel: false,
  emergencyHotkey: false,
  displayCount: 0,
  screenWidth: 0,
  screenHeight: 0,
  dpiScale: 1,
};

export const emptyRemoteQuality: RemoteQualityState = {
  width: 0,
  height: 0,
  fps: 0,
  bitrateKbps: 0,
  packetsLost: 0,
  roundTripMs: 0,
};

export function createInitialRemoteControlState(): RemoteControlState {
  return {
    status: 'idle',
    agent: { status: 'offline', capabilities: { ...emptyAgentCapabilities } },
    media: { status: 'idle' },
    input: { status: 'disabled' },
    quality: { ...emptyRemoteQuality },
  };
}

export function registerRemoteAgent(
  session: DemoSession,
  agent: RegisteredAgentView,
  now = Date.now(),
): DemoSession {
  return mutateRemote(
    session,
    {
      ...session.remote,
      agent: {
        status: 'online',
        deviceId: agent.deviceId,
        agentId: agent.agentId,
        version: agent.version,
        lastSeenAt: agent.lastSeenAt,
        capabilities: { ...agent.capabilities },
      },
      stopReason: undefined,
    },
    now,
    'Agente Windows autorizado y conectado',
  );
}

export function markRemoteAgentHeartbeat(session: DemoSession, lastSeenAt: number): DemoSession {
  return {
    ...session,
    remote: {
      ...session.remote,
      agent: { ...session.remote.agent, status: 'online', lastSeenAt },
    },
    updatedAt: lastSeenAt,
  };
}

export function updateRemoteAgentCapabilities(
  session: DemoSession,
  capabilities: AgentCapabilities,
  lastSeenAt: number,
): DemoSession {
  return {
    ...session,
    remote: {
      ...session.remote,
      agent: {
        ...session.remote.agent,
        status: 'online',
        capabilities: { ...capabilities },
        lastSeenAt,
      },
    },
    revision: session.revision + 1,
    updatedAt: lastSeenAt,
  };
}

export function requestNativeControl(
  session: DemoSession,
  requesterParticipantId: string,
  now = Date.now(),
): DemoSession {
  if (session.remote.agent.status !== 'online') throw new Error('agent_offline');
  if (!session.remote.agent.capabilities.nativeBridge) throw new Error('native_bridge_required');
  if (!session.remote.agent.capabilities.pointer) throw new Error('pointer_capability_required');
  if (!session.remote.agent.capabilities.keyboard) throw new Error('keyboard_capability_required');
  const screenGranted = session.permissions.some(
    (permission) => permission.key === 'screen' && permission.status === 'granted',
  );
  if (!screenGranted) throw new Error('screen_permission_required');
  if (!['live', 'degraded'].includes(session.remote.media.status)) {
    throw new Error('desktop_stream_required');
  }
  if (['requested', 'granted', 'active'].includes(session.remote.input.status)) {
    throw new Error('control_request_exists');
  }
  return mutateRemote(
    session,
    {
      ...session.remote,
      status: session.remote.status === 'idle' ? 'ready' : session.remote.status,
      input: {
        status: 'requested',
        requestedByParticipantId: requesterParticipantId,
        requestedAt: now,
      },
      stopReason: undefined,
    },
    now,
    'Atacante solicitó control nativo',
  );
}

export function grantNativeControl(
  session: DemoSession,
  lease: ControlLeaseView,
  consentedByParticipantId: string,
  now = Date.now(),
): DemoSession {
  if (session.remote.input.status !== 'requested') throw new Error('control_not_requested');
  if (session.remote.input.requestedByParticipantId !== lease.ownerParticipantId) {
    throw new Error('control_owner_mismatch');
  }
  if (!session.remote.input.requestedAt || now - session.remote.input.requestedAt > 60_000) {
    throw new Error('control_request_expired');
  }
  const screenGranted = session.permissions.some(
    (permission) => permission.key === 'screen' && permission.status === 'granted',
  );
  if (!screenGranted) throw new Error('screen_permission_required');
  return mutateRemote(
    {
      ...session,
      permissions: session.permissions.map((permission) =>
        permission.key === 'keyboard'
          ? {
              ...permission,
              status: 'granted',
              requestedAt: permission.requestedAt ?? session.remote.input.requestedAt,
              respondedAt: now,
            }
          : permission,
      ),
    },
    {
      ...session.remote,
      status: 'ready',
      input: {
        ...session.remote.input,
        status: 'granted',
        ownerParticipantId: lease.ownerParticipantId,
        leaseId: lease.leaseId,
        consentedAt: now,
        consentedByParticipantId,
        grantedAt: now,
        activationAvailableAt: now + 3_000,
        expiresAt: lease.expiresAt,
      },
    },
    now,
    'Víctima concedió control nativo temporal',
  );
}

export function activateNativeControl(
  session: DemoSession,
  lease: ControlLeaseView,
  now = Date.now(),
): DemoSession {
  if (session.remote.input.leaseId !== lease.leaseId) throw new Error('lease_mismatch');
  if (session.remote.input.status !== 'granted') throw new Error('control_not_granted');
  if (!session.remote.input.consentedAt || now - session.remote.input.consentedAt > 60_000) {
    throw new Error('control_consent_expired');
  }
  if ((session.remote.input.activationAvailableAt ?? 0) > now) {
    throw new Error('control_activation_delay');
  }
  return mutateRemote(
    session,
    {
      ...session.remote,
      status: 'control',
      input: { ...session.remote.input, status: 'active', expiresAt: lease.expiresAt },
      controlConfirmedAt: session.remote.controlConfirmedAt ?? now,
    },
    now,
    'Control nativo activado',
  );
}

export function renewNativeControl(
  session: DemoSession,
  lease: ControlLeaseView,
  now = Date.now(),
): DemoSession {
  if (session.remote.input.leaseId !== lease.leaseId) throw new Error('lease_mismatch');
  return {
    ...session,
    remote: {
      ...session.remote,
      input: { ...session.remote.input, expiresAt: lease.expiresAt },
    },
    updatedAt: now,
  };
}

export function revokeNativeControl(
  session: DemoSession,
  reason: RemoteStopReason,
  now = Date.now(),
  revokedByParticipantId = 'system',
): DemoSession {
  const alreadyStopped =
    session.remote.input.status === 'revoked' && session.remote.status === 'ended';
  if (alreadyStopped) return session;
  return mutateRemote(
    session,
    {
      ...session.remote,
      status: 'ended',
      input: {
        ...session.remote.input,
        status: 'revoked',
        leaseId: undefined,
        activationAvailableAt: undefined,
        expiresAt: undefined,
        revokedAt: now,
        revokedByParticipantId,
      },
      stopReason: reason,
      endedAt: now,
    },
    now,
    `Control nativo revocado: ${reason}`,
  );
}

export function denyNativeControl(
  session: DemoSession,
  now = Date.now(),
  revokedByParticipantId = 'victim',
): DemoSession {
  if (session.remote.input.status !== 'requested') throw new Error('control_not_requested');
  return mutateRemote(
    {
      ...session,
      permissions: session.permissions.map((permission) =>
        permission.key === 'keyboard'
          ? {
              ...permission,
              status: 'denied',
              requestedAt: permission.requestedAt ?? session.remote.input.requestedAt,
              respondedAt: now,
            }
          : permission,
      ),
    },
    {
      ...session.remote,
      status: 'screen',
      input: {
        ...session.remote.input,
        status: 'revoked',
        leaseId: undefined,
        expiresAt: undefined,
        revokedAt: now,
        revokedByParticipantId,
      },
      stopReason: 'victim',
    },
    now,
    'Víctima rechazó control nativo; visualización continúa',
  );
}

export function markRemoteAgentOffline(
  session: DemoSession,
  reason: Extract<RemoteStopReason, 'network' | 'timeout'>,
  now = Date.now(),
): DemoSession {
  const revoked = revokeNativeControl(session, reason, now);
  return {
    ...revoked,
    remote: {
      ...revoked.remote,
      agent: { ...revoked.remote.agent, status: 'offline', lastSeenAt: now },
      media: { ...revoked.remote.media, status: 'ended', endedAt: now },
    },
  };
}

export function updateRemoteQuality(
  session: DemoSession,
  quality: RemoteQualityState,
  now = Date.now(),
): DemoSession {
  if (!['negotiating', 'live', 'degraded'].includes(session.remote.media.status)) {
    throw new Error('media_not_active');
  }
  const degraded = quality.height < 720 || quality.fps < 15 || quality.roundTripMs >= 300;
  return {
    ...session,
    remote: {
      ...session.remote,
      media: {
        ...session.remote.media,
        status: degraded ? 'degraded' : 'live',
        startedAt: session.remote.media.startedAt ?? now,
      },
      status: session.remote.status === 'idle' ? 'screen' : session.remote.status,
      quality: { ...quality },
    },
    updatedAt: now,
  };
}

export function beginRemoteMedia(session: DemoSession, now = Date.now()): DemoSession {
  if (session.remote.agent.status !== 'online' && session.mode === 'live') {
    throw new Error('agent_offline');
  }
  const screenGranted = session.permissions.some(
    (permission) => permission.key === 'screen' && permission.status === 'granted',
  );
  if (!screenGranted && session.mode === 'live') throw new Error('screen_permission_required');
  return mutateRemote(
    session,
    {
      ...session.remote,
      status: 'screen',
      media: { status: 'negotiating', startedAt: now },
      stopReason: undefined,
    },
    now,
    'Víctima inició transmisión del escritorio completo',
  );
}

export function markRemoteMediaLive(session: DemoSession, now = Date.now()): DemoSession {
  if (session.remote.media.status !== 'negotiating') throw new Error('media_not_negotiating');
  return mutateRemote(
    session,
    {
      ...session.remote,
      status: 'screen',
      media: {
        ...session.remote.media,
        status: 'live',
        startedAt: session.remote.media.startedAt ?? now,
      },
    },
    now,
    'Canal WebRTC de escritorio conectado',
  );
}

export function endRemoteMedia(
  session: DemoSession,
  reason: RemoteStopReason,
  now = Date.now(),
): DemoSession {
  const revoked = revokeNativeControl(session, reason, now);
  return {
    ...revoked,
    remote: {
      ...revoked.remote,
      media: { ...revoked.remote.media, status: 'ended', endedAt: now },
      quality: { ...emptyRemoteQuality },
    },
  };
}

export function remoteInputIsActive(session: DemoSession): boolean {
  return session.remote.input.status === 'active' && Boolean(session.remote.input.leaseId);
}

export function remoteSessionIsActive(session: DemoSession): boolean {
  return (
    remoteInputIsActive(session) ||
    ['requested', 'granted'].includes(session.remote.input.status) ||
    ['requesting', 'negotiating', 'live', 'degraded'].includes(session.remote.media.status) ||
    !['idle', 'ended'].includes(session.remote.status)
  );
}

function mutateRemote(
  session: DemoSession,
  remote: RemoteControlState,
  now: number,
  message: string,
): DemoSession {
  return {
    ...session,
    remote,
    timeline: [...session.timeline, remoteEvent(session, now, message)],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

function remoteEvent(session: DemoSession, at: number, message: string): TimelineEvent {
  return {
    id: `event-remote-${session.revision + 1}-${at}`,
    at,
    actor: 'system',
    kind: 'remote',
    nature: 'real',
    message,
  };
}

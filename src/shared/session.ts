import {
  permissionKeys,
  type DemoSession,
  type PermissionKey,
  type PermissionState,
  type PermissionStatus,
  type RemoteControlStatus,
  type SessionMode,
  fictionalProfiles,
  type FictionalProfileId,
  remoteChecklistKeys,
  type RemoteChecklistKey,
} from './types.js';

const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;
const realPermissions = new Set<PermissionKey>(['screen', 'keyboard']);

export interface CreateSessionOptions {
  id?: string;
  pairingCode?: string;
  scenarioId?: string;
  mode?: SessionMode;
  now?: number;
  ttlMs?: number;
}

export function createInitialSession(options: CreateSessionOptions = {}): DemoSession {
  const now = options.now ?? Date.now();
  return {
    id: options.id ?? 'demo-session',
    pairingCode: options.pairingCode ?? '000000',
    scenarioId: options.scenarioId ?? 'support-scam-default',
    phase: 'preparation',
    outcome: 'pending',
    status: 'active',
    mode: options.mode ?? 'rehearsal',
    participants: [],
    permissions: permissionKeys.map((key): PermissionState => ({
      key,
      status: 'idle',
      nature: realPermissions.has(key) ? 'real' : 'simulated',
    })),
    timeline: [],
    risk: { privacy: 0, deviceControl: 0, accounts: 0, files: 0, recoverability: 100 },
    remote: { status: 'idle' },
    timer: {
      durationSeconds: 900,
      remainingSeconds: 900,
      status: 'idle',
      reachedMilestones: [],
      quickClose: false,
      speed: options.mode === 'rehearsal' ? 4 : 1,
    },
    technical: {
      soundReady: false,
      fallbackActive: false,
      remoteChecklist: Object.fromEntries(remoteChecklistKeys.map((key) => [key, false])) as Record<
        RemoteChecklistKey,
        boolean
      >,
    },
    story: { examinedSignals: [] },
    simulation: { queue: [], exposedPercent: 0 },
    recovery: { status: 'idle', orderValidated: false, attempts: [], completedSteps: [] },
    score: 0,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + (options.ttlMs ?? DEFAULT_SESSION_TTL_MS),
  };
}

export function updatePermission(
  session: DemoSession,
  key: PermissionKey,
  status: PermissionStatus,
  now = Date.now(),
): DemoSession {
  return {
    ...session,
    permissions: session.permissions.map((permission) =>
      permission.key === key
        ? {
            ...permission,
            status,
            requestedAt: status === 'requested' ? now : (permission.requestedAt ?? now),
            respondedAt: status === 'granted' || status === 'denied' ? now : undefined,
          }
        : permission,
    ),
    revision: session.revision + 1,
    updatedAt: now,
  };
}

export function updateRemoteStatus(
  session: DemoSession,
  status: RemoteControlStatus,
  now = Date.now(),
): DemoSession {
  if (status === session.remote.status) return session;
  const allowed: Record<RemoteControlStatus, RemoteControlStatus[]> = {
    idle: ['ready'],
    ready: ['screen', 'ending'],
    screen: ['control', 'ending'],
    control: ['ending'],
    ending: ['ended'],
    ended: [],
  };
  if (!allowed[session.remote.status].includes(status))
    throw new Error('remote_transition_invalid');
  if (status === 'ready' && session.mode === 'live' && !remoteSafetyReady(session)) {
    throw new Error('remote_checklist_incomplete');
  }
  if ((status === 'screen' || status === 'control') && !permissionIsGranted(session, 'screen')) {
    throw new Error('screen_permission_required');
  }
  if (status === 'control' && !permissionIsGranted(session, 'keyboard')) {
    throw new Error('keyboard_permission_required');
  }
  return {
    ...session,
    remote: {
      ...session.remote,
      status,
      screenConfirmedAt:
        status === 'screen' || status === 'control'
          ? (session.remote.screenConfirmedAt ?? now)
          : session.remote.screenConfirmedAt,
      controlConfirmedAt:
        status === 'control'
          ? (session.remote.controlConfirmedAt ?? now)
          : session.remote.controlConfirmedAt,
      endedAt: status === 'ended' ? now : session.remote.endedAt,
    },
    revision: session.revision + 1,
    updatedAt: now,
  };
}

export function updateRemoteChecklist(
  session: DemoSession,
  item: RemoteChecklistKey,
  checked: boolean,
  now = Date.now(),
): DemoSession {
  if (session.remote.status !== 'idle') throw new Error('remote_checklist_locked');
  return {
    ...session,
    technical: {
      ...session.technical,
      remoteChecklist: { ...session.technical.remoteChecklist, [item]: checked },
    },
    revision: session.revision + 1,
    updatedAt: now,
  };
}

export function remoteSafetyReady(session: DemoSession): boolean {
  return remoteChecklistKeys.every((key) => session.technical.remoteChecklist[key]);
}

export function permissionIsGranted(session: DemoSession, key: PermissionKey): boolean {
  return session.permissions.some(
    (permission) => permission.key === key && permission.status === 'granted',
  );
}

export function selectVictimProfile(
  session: DemoSession,
  profileId: FictionalProfileId,
  now = Date.now(),
): DemoSession {
  const selected = fictionalProfiles.find((profile) => profile.id === profileId);
  if (!selected) throw new Error('fictional_profile_not_found');
  return {
    ...session,
    previousPhase: session.phase === 'waiting' ? session.phase : session.previousPhase,
    phase: session.phase === 'waiting' ? 'profile' : session.phase,
    victimProfile: {
      profileId: selected.id,
      alias: selected.alias,
      avatarId: selected.avatarId,
      roleTitle: selected.roleTitle,
      startedAt: now,
    },
    timeline: [
      ...session.timeline,
      {
        id: `event-${session.revision + 1}`,
        at: now,
        actor: 'victim',
        kind: 'decision',
        nature: 'educational',
        message: 'Participante inició con identidad ficticia',
      },
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

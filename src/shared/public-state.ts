import type { DemoSession } from './types.js';
import { createInitialRemoteControlState } from './remote-state.js';

const revealPhases = new Set(['reveal', 'containment', 'recovery', 'result', 'emergency']);

export function toPublicSession(session: DemoSession): DemoSession {
  const revealed = revealPhases.has(session.phase);
  return {
    ...session,
    pairingCode: '••••••',
    phase:
      !revealed && ['permissions', 'connecting', 'controlled'].includes(session.phase)
        ? 'decision'
        : session.phase,
    outcome: revealed ? session.outcome : 'pending',
    participants: [],
    technical: {
      soundReady: false,
      fallbackActive: session.technical.fallbackActive,
      remoteChecklist: Object.fromEntries(
        Object.keys(session.technical.remoteChecklist).map((key) => [key, false]),
      ) as DemoSession['technical']['remoteChecklist'],
    },
    story: revealed ? session.story : { examinedSignals: [] },
    permissions: revealed
      ? session.permissions
      : session.permissions.map((permission) => ({
          key: permission.key,
          nature: permission.nature,
          status: 'idle',
        })),
    timeline: revealed ? session.timeline : [],
    risk: revealed
      ? session.risk
      : { privacy: 0, deviceControl: 0, accounts: 0, files: 0, recoverability: 100 },
    remote: revealed
      ? {
          ...session.remote,
          agent: {
            status: session.remote.agent.status,
            capabilities: { ...createInitialRemoteControlState().agent.capabilities },
          },
          input: {
            status: session.remote.input.status,
            grantedAt: session.remote.input.grantedAt,
          },
        }
      : createInitialRemoteControlState(),
    simulation: revealed ? session.simulation : { queue: [], exposedPercent: 0 },
    summary: revealed ? session.summary : undefined,
  };
}

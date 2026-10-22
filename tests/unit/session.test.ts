import { describe, expect, it } from 'vitest';
import {
  createInitialSession,
  updatePermission,
  updateRemoteStatus,
  selectVictimProfile,
} from '../../src/shared/session';

describe('session fixture', () => {
  it('contains no personal data and starts clean', () => {
    const session = createInitialSession({ now: 1000 });
    expect(session.phase).toBe('preparation');
    expect(session.outcome).toBe('pending');
    expect(session.permissions.every((permission) => permission.status === 'idle')).toBe(true);
    expect(session.participants).toEqual([]);
  });

  it('updates permission immutably', () => {
    const session = createInitialSession({ now: 1000 });
    const updated = updatePermission(session, 'screen', 'granted', 2000);
    expect(session.permissions.find((item) => item.key === 'screen')?.status).toBe('idle');
    expect(updated.permissions.find((item) => item.key === 'screen')?.status).toBe('granted');
    expect(updated.revision).toBe(1);
  });

  it('records remote control confirmation', () => {
    let session = createInitialSession({ now: 1000 });
    session = updatePermission(session, 'screen', 'granted', 1200);
    session = updatePermission(session, 'keyboard', 'granted', 1300);
    session = updateRemoteStatus(session, 'ready', 1500);
    session = updateRemoteStatus(session, 'screen', 1800);
    const updated = updateRemoteStatus(session, 'control', 2000);
    expect(updated.remote.status).toBe('control');
    expect(updated.remote.screenConfirmedAt).toBe(1800);
    expect(updated.remote.controlConfirmedAt).toBe(2000);
  });

  it('starts participation with a predefined fictional profile only', () => {
    const session = { ...createInitialSession({ now: 1000 }), phase: 'waiting' as const };
    const updated = selectVictimProfile(session, 'sam', 2000);
    expect(updated.phase).toBe('profile');
    expect(updated.victimProfile?.alias).toBe('Sam Vega');
    expect(updated.victimProfile?.startedAt).toBe(2000);
    expect(updated.timeline.at(-1)?.message).not.toContain('Sam Vega');
  });
});

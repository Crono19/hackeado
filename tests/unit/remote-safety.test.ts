import { describe, expect, it } from 'vitest';
import {
  createInitialSession,
  remoteSafetyReady,
  updatePermission,
  updateRemoteChecklist,
  updateRemoteStatus,
} from '../../src/shared/session';
import { remoteChecklistKeys } from '../../src/shared/types';

describe('operational remote safety gate', () => {
  it('requires every safety item before a live session can become ready', () => {
    let session = createInitialSession({ mode: 'live' });
    expect(() => updateRemoteStatus(session, 'ready')).toThrow('remote_checklist_incomplete');
    for (const item of remoteChecklistKeys) session = updateRemoteChecklist(session, item, true);
    expect(remoteSafetyReady(session)).toBe(true);
    expect(updateRemoteStatus(session, 'ready').remote.status).toBe('ready');
  });

  it('enforces explicit confirmations and an explicit ended state', () => {
    let session = createInitialSession();
    expect(() => updateRemoteStatus(session, 'control')).toThrow('remote_transition_invalid');
    session = updatePermission(session, 'screen', 'granted');
    session = updatePermission(session, 'keyboard', 'granted');
    session = updateRemoteStatus(session, 'ready');
    session = updateRemoteStatus(session, 'screen');
    session = updateRemoteStatus(session, 'control');
    session = updateRemoteStatus(session, 'ending');
    session = updateRemoteStatus(session, 'ended');
    expect(session.remote.status).toBe('ended');
    expect(session.remote.endedAt).toBeTypeOf('number');
  });
});

import { describe, expect, it } from 'vitest';
import {
  executeAttackerAction,
  getAvailableAttackerActions,
} from '../../src/shared/attacker-actions';
import { answerPermission } from '../../src/shared/permissions';
import { createInitialSession } from '../../src/shared/session';
import type { DemoSession } from '../../src/shared/types';

function atPermissions(): DemoSession {
  return { ...createInitialSession({ now: 1_000 }), phase: 'permissions' };
}

describe('attacker action catalog', () => {
  it('only exposes context-valid actions', () => {
    const session = atPermissions();
    expect(getAvailableAttackerActions(session).map((action) => action.id)).toEqual([
      'request_screen',
    ]);
  });

  it('executes request and removes repeated action', () => {
    const requested = executeAttackerAction(atPermissions(), 'request_screen', 1_100);
    expect(requested.permissions.find((item) => item.key === 'screen')?.status).toBe('requested');
    expect(getAvailableAttackerActions(requested)).toHaveLength(0);
    expect(() => executeAttackerAction(requested, 'request_screen', 1_200)).toThrow(
      'attacker_action_not_allowed',
    );
  });

  it('unlocks dependent requests after screen grant', () => {
    let session = executeAttackerAction(atPermissions(), 'request_screen', 1_100);
    session = answerPermission(session, 'screen', 'granted', 1_200);
    const available = getAvailableAttackerActions(session).map((action) => action.id);
    expect(available).toContain('request_keyboard');
    expect(available).toContain('request_files');
    expect(available).not.toContain('request_unattended');
  });
});

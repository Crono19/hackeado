import { describe, expect, it } from 'vitest';
import {
  completeRecovery,
  completeRecoveryStep,
  recoveryOrder,
  requestRemoteStop,
  validateRecoveryOrder,
} from '../../src/shared/recovery';
import {
  createInitialSession,
  updatePermission,
  updateRemoteStatus,
} from '../../src/shared/session';
import type { DemoSession } from '../../src/shared/types';

function recoverySession(): DemoSession {
  let session = {
    ...createInitialSession({ now: 1_000 }),
    phase: 'recovery' as const,
    outcome: 'moderate' as const,
  };
  session = updatePermission(session, 'screen', 'granted', 1_100);
  return session;
}

describe('six-step recovery protocol', () => {
  it('records wrong attempts and validates only the canonical order', () => {
    const wrong = validateRecoveryOrder(recoverySession(), [...recoveryOrder].reverse(), 2_000);
    expect(wrong.recovery.orderValidated).toBe(false);
    expect(wrong.recovery.attempts.at(-1)?.mismatchIndex).toBe(0);
    const correct = validateRecoveryOrder(wrong, recoveryOrder, 2_100);
    expect(correct.recovery.orderValidated).toBe(true);
    expect(correct.recovery.status).toBe('active');
  });

  it('blocks progress until remote access is visibly ended', () => {
    let session = validateRecoveryOrder(recoverySession(), recoveryOrder);
    session = updateRemoteStatus(session, 'ready');
    expect(() => completeRecoveryStep(session, 'disconnect_remote')).toThrow(
      'remote_must_be_ended',
    );
    session = requestRemoteStop(session);
    expect(session.remote.status).toBe('ended');
    expect(completeRecoveryStep(session, 'disconnect_remote').recovery.completedSteps).toEqual([
      'disconnect_remote',
    ]);
  });

  it('requires sequential completion and produces the final educational result', () => {
    let session = validateRecoveryOrder(requestRemoteStop(recoverySession()), recoveryOrder);
    expect(() => completeRecoveryStep(session, 'enable_mfa')).toThrow('recovery_step_out_of_order');
    for (const step of recoveryOrder) session = completeRecoveryStep(session, step);
    expect(session.recovery.status).toBe('complete');
    expect(session.recovery.completedAt).toBeDefined();
    const result = completeRecovery(session);
    expect(result.phase).toBe('result');
    expect(result.recovery.status).toBe('complete');
    expect(result.permissions.find((item) => item.key === 'screen')?.status).toBe('denied');
    expect(result.summary?.prevention).toHaveLength(3);
  });
});

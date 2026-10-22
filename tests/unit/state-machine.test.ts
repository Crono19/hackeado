import { describe, expect, it } from 'vitest';
import {
  createInitialSession,
  updatePermission,
  updateRemoteStatus,
} from '../../src/shared/session';
import {
  emergencyEligiblePhases,
  emergencyStopSession,
  isTransitionAllowed,
  phaseTransitions,
  resetSession,
  transitionSession,
  TransitionError,
} from '../../src/shared/state-machine';
import {
  completeRecovery,
  completeRecoveryStep,
  recoveryOrder,
  requestRemoteStop,
  validateRecoveryOrder,
} from '../../src/shared/recovery';
import { experiencePhases, type DemoSession, type ExperiencePhase } from '../../src/shared/types';

function atPhase(phase: ExperiencePhase): DemoSession {
  return { ...createInitialSession({ now: 1000 }), phase };
}

function confirmRemote(session: DemoSession) {
  return updateRemoteStatus(
    updateRemoteStatus(updateRemoteStatus(session, 'ready'), 'screen'),
    'control',
  );
}

function finishRecovery(session: DemoSession) {
  let next = validateRecoveryOrder(requestRemoteStop(session), recoveryOrder);
  for (const step of recoveryOrder) next = completeRecoveryStep(next, step);
  return completeRecovery(next);
}

describe('phase transition graph', () => {
  it('accepts every declared edge and rejects undeclared edges', () => {
    for (const from of experiencePhases) {
      for (const to of experiencePhases) {
        expect(isTransitionAllowed(from, to)).toBe(phaseTransitions[from].includes(to));
      }
    }
  });

  it('rejects direct access to controlled phase', () => {
    expect(() => transitionSession(atPhase('decision'), 'controlled')).toThrow(TransitionError);
  });

  it('requires granted screen before connecting', () => {
    expect(() => transitionSession(atPhase('permissions'), 'connecting')).toThrow(
      'Screen permission must be granted first',
    );
  });

  it('requires permissions and confirmed remote control before controlled', () => {
    let session = atPhase('connecting');
    session = updatePermission(session, 'screen', 'granted', 1100);
    session = updatePermission(session, 'keyboard', 'granted', 1200);
    expect(() => transitionSession(session, 'controlled')).toThrow('confirmed remote control');
    session = confirmRemote(session);
    const controlled = transitionSession(session, 'controlled', { now: 1400 });
    expect(controlled.phase).toBe('controlled');
    expect(controlled.outcome).toBe('compromised');
  });
});

describe('three experience endings', () => {
  it('supports safe ending from decision', () => {
    const result = transitionSession(atPhase('decision'), 'result', { outcome: 'safe' });
    expect(result.outcome).toBe('safe');
    expect(result.status).toBe('complete');
  });

  it('supports moderate ending after limited permission', () => {
    let session = atPhase('permissions');
    session = updatePermission(session, 'screen', 'granted');
    session = transitionSession(session, 'reveal', { outcome: 'moderate' });
    session = transitionSession(session, 'containment');
    session = transitionSession(session, 'recovery');
    session = finishRecovery(session);
    expect(session.outcome).toBe('moderate');
  });

  it('supports compromised ending through full controlled path', () => {
    let session = atPhase('permissions');
    session = updatePermission(session, 'screen', 'granted');
    session = transitionSession(session, 'connecting');
    session = updatePermission(session, 'keyboard', 'granted');
    session = confirmRemote(session);
    session = transitionSession(session, 'controlled');
    session = transitionSession(session, 'reveal');
    session = transitionSession(session, 'containment');
    session = transitionSession(session, 'recovery');
    session = finishRecovery(session);
    expect(session.outcome).toBe('compromised');
  });
});

describe('safety controls', () => {
  it.each(emergencyEligiblePhases)('supports emergency stop from %s', (phase) => {
    let active = atPhase(phase);
    active = updatePermission(active, 'screen', 'granted', 1500);
    active = updatePermission(active, 'keyboard', 'granted', 1550);
    active = confirmRemote(active);
    const stopped = emergencyStopSession(active, 2000);
    expect(stopped.phase).toBe('emergency');
    expect(stopped.status).toBe('emergency');
    expect(stopped.remote.status).toBe('ended');
    expect(stopped.permissions.find((permission) => permission.key === 'screen')?.status).toBe(
      'denied',
    );
  });

  it.each(experiencePhases)('resets cleanly from %s', (phase) => {
    const reset = resetSession(atPhase(phase), 3000);
    expect(reset.phase).toBe('reset');
    expect(reset.permissions.every((permission) => permission.status === 'idle')).toBe(true);
    expect(reset.participants).toEqual([]);
  });
});

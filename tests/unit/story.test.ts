import { describe, expect, it } from 'vitest';
import { createInitialSession } from '../../src/shared/session';
import { transitionSession } from '../../src/shared/state-machine';
import { examineSignal, openSupportCase, submitDecision } from '../../src/shared/story';

function decisionSession() {
  let session = createInitialSession({ now: 1_000 });
  session = transitionSession(session, 'waiting', { now: 1_100 });
  session = transitionSession(session, 'profile', { now: 1_200 });
  session = transitionSession(session, 'bait', { now: 1_300 });
  return openSupportCase(session, 1_400);
}

describe('social engineering story', () => {
  it('records examined signals once and scores without duplication', () => {
    let session = decisionSession();
    session = examineSignal(session, 'sender', 1_500);
    const duplicate = examineSignal(session, 'sender', 1_600);
    expect(duplicate.score).toBe(10);
    expect(duplicate.story.examinedSignals).toEqual(['sender']);
  });

  it('routes solve into permissions', () => {
    const session = submitDecision(decisionSession(), 'solve', 1_500);
    expect(session.phase).toBe('permissions');
    expect(session.outcome).toBe('pending');
    expect(session.story.decision?.route).toBe('continue');
  });

  it.each(['postpone', 'verify'] as const)('routes %s into safe ending', (choice) => {
    const session = submitDecision(decisionSession(), choice, 1_500);
    expect(session.phase).toBe('result');
    expect(session.outcome).toBe('safe');
    expect(session.status).toBe('complete');
    expect(session.summary?.outcome).toBe('safe');
    expect(session.summary?.keyMoment).toContain(choice === 'verify' ? 'canal oficial' : 'presión');
  });

  it('rejects decisions outside decision phase', () => {
    expect(() => submitDecision(createInitialSession(), 'solve')).toThrow('decision_out_of_phase');
  });
});

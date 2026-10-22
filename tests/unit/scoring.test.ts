import { describe, expect, it } from 'vitest';
import { finalizeSession } from '../../src/shared/scoring.js';
import { createInitialSession } from '../../src/shared/session.js';

describe('educational scoring and summary', () => {
  it('calculates deterministic score and does not duplicate timeline events', () => {
    const base = createInitialSession({ now: 1_000 });
    const session = {
      ...base,
      phase: 'result' as const,
      outcome: 'safe' as const,
      story: {
        examinedSignals: ['sender' as const],
        decision: { choice: 'verify' as const, route: 'safe' as const, submittedAt: 2_000 },
      },
    };
    const first = finalizeSession(session, 3_000);
    const second = finalizeSession(first, 4_000);
    expect(first.score).toBe(30);
    expect(second.score).toBe(first.score);
    expect(second.timeline).toEqual(first.timeline);
    expect(second.summary?.eventCounts).toEqual(first.summary?.eventCounts);
  });

  it('explains achieved and pending recovery actions without shaming', () => {
    const summary = finalizeSession(
      { ...createInitialSession({ now: 1_000 }), outcome: 'compromised' },
      2_000,
    ).summary;
    expect(summary?.headline).toContain('Permisos');
    expect(summary?.feedback).toHaveLength(7);
    expect(summary?.prevention).toHaveLength(3);
  });
});

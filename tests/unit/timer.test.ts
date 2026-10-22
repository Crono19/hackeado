import { describe, expect, it } from 'vitest';
import { createInitialSession } from '../../src/shared/session';
import {
  activateQuickClose,
  pauseTimer,
  resumeTimer,
  startTimer,
  tickTimer,
} from '../../src/shared/timer';

describe('authoritative experience timer', () => {
  it('ticks from server timestamps and emits each milestone once', () => {
    let session = startTimer(createInitialSession({ now: 0 }), 1_000);
    let tick = tickTimer(session, 181_000);
    expect(tick.session.timer.remainingSeconds).toBe(720);
    expect(tick.milestones).toEqual([3]);
    session = tick.session;
    tick = tickTimer(session, 361_000);
    expect(tick.milestones).toEqual([6]);
    expect(tick.session.timer.reachedMilestones).toEqual([3, 6]);
  });

  it('does not lose time while paused and resumes from the same value', () => {
    let session = startTimer(createInitialSession({ now: 0 }), 1_000);
    session = pauseTimer(session, 11_000);
    expect(session.timer.remainingSeconds).toBe(890);
    expect(tickTimer(session, 61_000).session.timer.remainingSeconds).toBe(890);
    session = resumeTimer(session, 61_000);
    expect(tickTimer(session, 66_000).session.timer.remainingSeconds).toBe(885);
  });

  it('finishes at 15 minutes and activates a two-minute quick close', () => {
    let session = startTimer(createInitialSession({ now: 0 }), 1_000);
    const quick = activateQuickClose(session, 2_000);
    expect(quick.phase).toBe('reveal');
    expect(quick.timer.remainingSeconds).toBe(120);
    expect(quick.timer.quickClose).toBe(true);
    session = tickTimer(quick, 122_000).session;
    expect(session.timer.status).toBe('finished');
    expect(session.timer.reachedMilestones).toEqual([3, 6, 10, 14, 15]);
  });
});

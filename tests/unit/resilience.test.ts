import { describe, expect, it } from 'vitest';
import { defaultScenario, getScenario } from '../../src/shared/scenario';
import { createInitialSession } from '../../src/shared/session';
import { startTimer, tickTimer } from '../../src/shared/timer';

describe('resilient demonstration modes', () => {
  it('accelerates rehearsal time by four without changing normal mode', () => {
    const normal = tickTimer(startTimer(createInitialSession({ now: 1_000 }), 1_000), 2_000);
    const rehearsal = tickTimer(
      startTimer(createInitialSession({ mode: 'rehearsal', now: 1_000 }), 1_000),
      2_000,
    );
    expect(normal.session.timer.remainingSeconds).toBe(899);
    expect(rehearsal.session.timer.remainingSeconds).toBe(896);
  });

  it('keeps the scenario template deeply immutable and returns isolated copies', () => {
    expect(Object.isFrozen(defaultScenario)).toBe(true);
    expect(Object.isFrozen(defaultScenario.desktopItems)).toBe(true);
    const first = getScenario(defaultScenario.id)!;
    const second = getScenario(defaultScenario.id)!;
    first.desktopItems[0]!.name = 'Cambio local';
    expect(second.desktopItems[0]!.name).not.toBe('Cambio local');
  });
});

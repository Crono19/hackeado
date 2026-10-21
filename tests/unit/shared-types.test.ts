import { describe, expect, it } from 'vitest';
import { experiencePhases, experienceRoles } from '../../src/shared/types';

describe('shared experience contracts', () => {
  it('defines the four application roles', () => {
    expect(experienceRoles).toEqual(['victim', 'attacker', 'audience', 'coordinator']);
  });

  it('starts with preparation and ends with reset', () => {
    expect(experiencePhases.at(0)).toBe('preparation');
    expect(experiencePhases.at(-1)).toBe('reset');
  });
});


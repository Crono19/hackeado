import { describe, expect, it } from 'vitest';
import {
  experienceOutcomes,
  experiencePhases,
  experienceRoles,
  permissionKeys,
} from '../../src/shared/types';

describe('shared experience contracts', () => {
  it('defines four application roles', () => {
    expect(experienceRoles).toEqual(['victim', 'attacker', 'audience', 'coordinator']);
  });

  it('defines three endings plus pending state', () => {
    expect(experienceOutcomes).toEqual(['pending', 'safe', 'moderate', 'compromised']);
  });

  it('contains explicit emergency and reset phases', () => {
    expect(experiencePhases).toContain('emergency');
    expect(experiencePhases).toContain('reset');
  });

  it('models all seven permission keys from specification', () => {
    expect(permissionKeys).toHaveLength(7);
  });
});

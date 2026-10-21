export const experienceRoles = ['victim', 'attacker', 'audience', 'coordinator'] as const;

export type ExperienceRole = (typeof experienceRoles)[number];

export const experiencePhases = [
  'preparation',
  'waiting',
  'profile',
  'bait',
  'decision',
  'permissions',
  'connecting',
  'controlled',
  'reveal',
  'containment',
  'recovery',
  'result',
  'reset',
] as const;

export type ExperiencePhase = (typeof experiencePhases)[number];

export interface HealthResponse {
  status: 'ok';
  service: 'hackeado-server';
  timestamp: string;
}


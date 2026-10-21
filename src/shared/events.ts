export const socketEvents = {
  connected: 'system:connected',
  joinSession: 'session:join',
  sessionState: 'session:state',
  phaseRequest: 'phase:request',
  emergencyStop: 'experience:emergency-stop',
} as const;


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
  'emergency',
  'reset',
] as const;
export type ExperiencePhase = (typeof experiencePhases)[number];

export const experienceOutcomes = ['pending', 'safe', 'moderate', 'compromised'] as const;
export type ExperienceOutcome = (typeof experienceOutcomes)[number];

export const sessionModes = ['live', 'simulated', 'rehearsal'] as const;
export type SessionMode = (typeof sessionModes)[number];
export type SessionStatus = 'active' | 'complete' | 'emergency' | 'resetting';

export const permissionKeys = [
  'screen',
  'keyboard',
  'files',
  'clipboard',
  'microphone',
  'camera',
  'unattended',
] as const;
export type PermissionKey = (typeof permissionKeys)[number];

export const permissionStatuses = ['idle', 'requested', 'granted', 'denied'] as const;
export type PermissionStatus = (typeof permissionStatuses)[number];

export type DemonstrationNature = 'real' | 'simulated' | 'educational';
export type ParticipantStatus = 'pending' | 'approved' | 'connected' | 'disconnected';
export type JoinRequestStatus = 'waiting' | 'approved' | 'rejected' | 'expired';
export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';
export type RemoteControlStatus = 'idle' | 'ready' | 'screen' | 'control' | 'ending' | 'ended';
export type TimelineActor = ExperienceRole | 'system';

export const remoteAgentStatuses = ['offline', 'online', 'fault'] as const;
export type RemoteAgentStatus = (typeof remoteAgentStatuses)[number];

export const remoteMediaStatuses = [
  'idle',
  'requesting',
  'negotiating',
  'live',
  'degraded',
  'ended',
] as const;
export type RemoteMediaStatus = (typeof remoteMediaStatuses)[number];

export const remoteInputStatuses = [
  'disabled',
  'requested',
  'granted',
  'active',
  'revoked',
] as const;
export type RemoteInputStatus = (typeof remoteInputStatuses)[number];

export const remoteStopReasons = [
  'victim',
  'attacker',
  'coordinator',
  'timeout',
  'network',
  'emergency',
] as const;
export type RemoteStopReason = (typeof remoteStopReasons)[number];

export const decisionChoices = ['solve', 'postpone', 'verify'] as const;
export type DecisionChoice = (typeof decisionChoices)[number];
export type NarrativeRoute = 'continue' | 'safe';

export const storySignalKeys = ['sender', 'domain', 'urgency'] as const;
export type StorySignalKey = (typeof storySignalKeys)[number];

export const attackerActionIds = [
  'scan_case',
  'request_screen',
  'request_keyboard',
  'request_clipboard',
  'request_files',
  'request_microphone',
  'request_camera',
  'request_unattended',
  'mark_remote_ready',
  'confirm_screen',
  'confirm_control',
  'end_remote',
] as const;
export type AttackerActionId = (typeof attackerActionIds)[number];

export const simulationActionIds = [
  'move_cursor',
  'open_folder',
  'open_budget',
  'type_message',
  'copy_clipboard',
  'copy_files',
  'expose_microphone',
  'expose_camera',
  'foreign_login',
] as const;
export type SimulationActionId = (typeof simulationActionIds)[number];
export type SimulationActionStatus = 'queued' | 'running' | 'completed' | 'cancelled';

export const recoveryStepKeys = [
  'disconnect_remote',
  'revoke_permissions',
  'secure_accounts',
  'close_sessions',
  'enable_mfa',
  'review_report',
] as const;
export type RecoveryStepKey = (typeof recoveryStepKeys)[number];

export const remoteChecklistKeys = [
  'fictionalAccount',
  'personalSessionsClosed',
  'unattendedDisabled',
  'fileTransferDisabled',
  'clipboardDisabled',
  'elevationDisabled',
  'stopPathVisible',
] as const;
export type RemoteChecklistKey = (typeof remoteChecklistKeys)[number];

export const fictionalProfiles = [
  { id: 'alex', alias: 'Alex Rivera', avatarId: 'pulse', roleTitle: 'Estudiante de diseño' },
  { id: 'sam', alias: 'Sam Vega', avatarId: 'orbit', roleTitle: 'Estudiante de ingeniería' },
  { id: 'noa', alias: 'Noa Castillo', avatarId: 'prism', roleTitle: 'Estudiante de comunicación' },
] as const;
export type FictionalProfileId = (typeof fictionalProfiles)[number]['id'];

export interface VictimProfile {
  profileId: FictionalProfileId;
  alias: string;
  avatarId: string;
  roleTitle: string;
  startedAt: number;
}

export interface ScenarioDesktopItem {
  id: string;
  name: string;
  kind: 'app' | 'file' | 'folder';
  icon: string;
  summary: string;
  content: string;
}

export interface ScenarioNotification {
  id: string;
  source: string;
  title: string;
  body: string;
  urgency: 'normal' | 'warning';
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  organization: string;
  profiles: readonly (typeof fictionalProfiles)[number][];
  desktopItems: ScenarioDesktopItem[];
  notifications: ScenarioNotification[];
  support: {
    technician: string;
    caseNumber: string;
    sender: string;
    officialDomain: string;
    openingMessage: string;
    followupMessage: string;
    countdownSeconds: number;
  };
}

export interface Participant {
  id: string;
  role: ExperienceRole;
  status: ParticipantStatus;
  joinedAt: number;
  lastSeenAt: number;
}

export interface PermissionState {
  key: PermissionKey;
  status: PermissionStatus;
  nature: DemonstrationNature;
  requestedAt?: number;
  respondedAt?: number;
}

export interface TimelineEvent {
  id: string;
  at: number;
  actor: TimelineActor;
  kind: 'phase' | 'permission' | 'remote' | 'decision' | 'action' | 'system';
  nature: DemonstrationNature;
  message: string;
}

export interface RiskState {
  privacy: number;
  deviceControl: number;
  accounts: number;
  files: number;
  recoverability: number;
}

export interface AgentCapabilities {
  nativeBridge: boolean;
  desktopCapture: boolean;
  pointer: boolean;
  keyboard: boolean;
  wheel: boolean;
  emergencyHotkey: boolean;
  displayCount: number;
  screenWidth: number;
  screenHeight: number;
  dpiScale: number;
}

export interface RemoteAgentState {
  status: RemoteAgentStatus;
  deviceId?: string;
  agentId?: string;
  version?: string;
  lastSeenAt?: number;
  capabilities: AgentCapabilities;
}

export interface RemoteMediaState {
  status: RemoteMediaStatus;
  startedAt?: number;
  endedAt?: number;
}

export interface RemoteInputState {
  status: RemoteInputStatus;
  requestedByParticipantId?: string;
  ownerParticipantId?: string;
  leaseId?: string;
  requestedAt?: number;
  consentedAt?: number;
  consentedByParticipantId?: string;
  revokedAt?: number;
  revokedByParticipantId?: string;
  grantedAt?: number;
  activationAvailableAt?: number;
  expiresAt?: number;
}

export interface RemoteQualityState {
  width: number;
  height: number;
  fps: number;
  bitrateKbps: number;
  packetsLost: number;
  roundTripMs: number;
}

export interface RemoteControlState {
  /** Compatibility projection for the current UI. Remove after Sprint 10 migration. */
  status: RemoteControlStatus;
  agent: RemoteAgentState;
  media: RemoteMediaState;
  input: RemoteInputState;
  quality: RemoteQualityState;
  stopReason?: RemoteStopReason;
  screenConfirmedAt?: number;
  controlConfirmedAt?: number;
  endedAt?: number;
}

export interface TimerState {
  durationSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  startedAt?: number;
  pausedAt?: number;
  lastTickAt?: number;
  reachedMilestones: number[];
  quickClose: boolean;
  speed: 1 | 4;
}

export interface TechnicalState {
  soundReady: boolean;
  fallbackActive: boolean;
  remoteChecklist: Record<RemoteChecklistKey, boolean>;
}

export interface DecisionState {
  choice: DecisionChoice;
  route: NarrativeRoute;
  submittedAt: number;
}

export interface StoryState {
  baitStartedAt?: number;
  baitDeadlineAt?: number;
  supportOpenedAt?: number;
  examinedSignals: StorySignalKey[];
  decision?: DecisionState;
}

export interface AttackerActionDefinition {
  id: AttackerActionId;
  label: string;
  description: string;
  nature: DemonstrationNature;
  highImpact: boolean;
  allowedPhases: ExperiencePhase[];
}

export interface SimulationActionDefinition {
  id: SimulationActionId;
  label: string;
  description: string;
  durationMs: number;
  exposureDelta: number;
  highImpact: boolean;
}

export interface SimulationQueueItem {
  id: string;
  actionId: SimulationActionId;
  status: SimulationActionStatus;
  queuedAt: number;
  startedAt?: number;
  completesAt?: number;
  completedAt?: number;
  cancelledAt?: number;
}

export interface SimulationState {
  queue: SimulationQueueItem[];
  exposedPercent: number;
}

export interface RecoveryAttempt {
  at: number;
  correct: boolean;
  mismatchIndex?: number;
}

export interface RecoveryState {
  status: 'idle' | 'ordering' | 'active' | 'complete';
  orderValidated: boolean;
  attempts: RecoveryAttempt[];
  completedSteps: RecoveryStepKey[];
  stopRequestedAt?: number;
  completedAt?: number;
}

export interface ScoreFeedbackItem {
  id: string;
  label: string;
  points: number;
  achieved: boolean;
  explanation: string;
}

export interface SessionSummary {
  generatedAt: number;
  outcome: Exclude<ExperienceOutcome, 'pending'>;
  score: number;
  maxScore: number;
  headline: string;
  keyMoment: string;
  feedback: ScoreFeedbackItem[];
  prevention: string[];
  eventCounts: Record<DemonstrationNature, number>;
}

export interface DemoSession {
  id: string;
  pairingCode: string;
  scenarioId: string;
  phase: ExperiencePhase;
  previousPhase?: ExperiencePhase;
  outcome: ExperienceOutcome;
  status: SessionStatus;
  mode: SessionMode;
  participants: Participant[];
  permissions: PermissionState[];
  timeline: TimelineEvent[];
  risk: RiskState;
  remote: RemoteControlState;
  timer: TimerState;
  technical: TechnicalState;
  story: StoryState;
  simulation: SimulationState;
  recovery: RecoveryState;
  summary?: SessionSummary;
  victimProfile?: VictimProfile;
  score: number;
  revision: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface HealthResponse {
  status: 'ok';
  service: 'hackeado-server';
  version: string;
  release: string;
  timestamp: string;
}

export interface JoinRequestView {
  id: string;
  sessionId: string;
  role: ExperienceRole;
  status: JoinRequestStatus;
  createdAt: number;
  expiresAt: number;
}

export interface SessionCredentials {
  sessionId: string;
  pairingCode: string;
  role: ExperienceRole;
  token: string;
  expiresAt: number;
}

export interface SocketAck<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
  duplicate?: boolean;
}

export interface ClientPresence {
  participantId: string;
  role: ExperienceRole;
  status: ParticipantStatus;
  lastSeenAt: number;
}

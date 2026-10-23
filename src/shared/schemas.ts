import { z } from 'zod';
import {
  experienceOutcomes,
  experiencePhases,
  experienceRoles,
  fictionalProfiles,
  attackerActionIds,
  decisionChoices,
  permissionKeys,
  permissionStatuses,
  sessionModes,
  simulationActionIds,
  storySignalKeys,
  recoveryStepKeys,
  remoteChecklistKeys,
  remoteStopReasons,
} from './types.js';
import {
  remotePointerButtons,
  remoteProtocolVersion,
  remoteShortcutIds,
} from './remote-protocol.js';

export const experienceRoleSchema = z.enum(experienceRoles);
export const experiencePhaseSchema = z.enum(experiencePhases);
export const experienceOutcomeSchema = z.enum(experienceOutcomes);
export const permissionKeySchema = z.enum(permissionKeys);
export const permissionStatusSchema = z.enum(permissionStatuses);
export const sessionModeSchema = z.enum(sessionModes);

export const phaseTransitionRequestSchema = z.object({
  eventId: z.string().trim().min(8).max(100),
  sessionId: z.string().trim().min(1).max(80),
  target: experiencePhaseSchema,
  outcome: experienceOutcomeSchema.optional(),
  reason: z.string().trim().max(160).optional(),
});

export const createSessionSchema = z.object({
  scenarioId: z.string().trim().min(1).max(80).default('support-scam-default'),
  mode: sessionModeSchema.default('simulated'),
});

export const joinSessionSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  role: experienceRoleSchema.exclude(['coordinator']),
});

export const approveJoinSchema = z.object({
  approved: z.boolean(),
});

export const socketEventBaseSchema = z.object({
  eventId: z.string().trim().min(8).max(100),
  sessionId: z.string().trim().min(1).max(80),
});

export const agentCapabilitiesSchema = z.object({
  nativeBridge: z.boolean(),
  desktopCapture: z.boolean(),
  pointer: z.boolean(),
  keyboard: z.boolean(),
  wheel: z.boolean(),
  emergencyHotkey: z.boolean(),
  displayCount: z.number().int().min(1).max(16),
  screenWidth: z.number().int().min(640).max(16_384),
  screenHeight: z.number().int().min(480).max(16_384),
  dpiScale: z.number().min(0.5).max(4),
});

const deviceIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[A-Za-z0-9._-]+$/);
const agentIdSchema = z.string().trim().min(16).max(100);
const leaseIdSchema = z.string().trim().min(16).max(100);

export const agentRegisterSchema = socketEventBaseSchema.extend({
  deviceId: deviceIdSchema,
  agentKey: z.string().min(16).max(256),
  version: z.string().trim().min(1).max(40),
  capabilities: agentCapabilitiesSchema,
});

export const agentHeartbeatSchema = socketEventBaseSchema.extend({
  agentId: agentIdSchema,
});

export const agentCapabilitiesUpdateSchema = socketEventBaseSchema.extend({
  agentId: agentIdSchema,
  capabilities: agentCapabilitiesSchema,
});

export const controlRequestSchema = socketEventBaseSchema;

export const controlGrantSchema = socketEventBaseSchema.extend({
  approved: z.literal(true),
});

export const controlActivateSchema = socketEventBaseSchema.extend({
  leaseId: leaseIdSchema,
});

export const controlRevokeSchema = socketEventBaseSchema.extend({
  reason: z.enum(remoteStopReasons),
});

export const controlHeartbeatSchema = socketEventBaseSchema.extend({
  leaseId: leaseIdSchema,
});

export const remoteQualitySchema = socketEventBaseSchema.extend({
  width: z.number().int().min(0).max(16_384),
  height: z.number().int().min(0).max(16_384),
  fps: z.number().min(0).max(240),
  bitrateKbps: z.number().min(0).max(100_000),
  packetsLost: z.number().int().min(0),
  roundTripMs: z.number().min(0).max(60_000),
});

const remoteMessageBase = z.object({
  version: z.literal(remoteProtocolVersion),
  sessionId: z.string().trim().min(1).max(80),
  leaseId: leaseIdSchema,
  sequence: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  sentAt: z.number().int().min(0),
});

const normalizedPoint = {
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
};

export const remoteControlMessageSchema = z.discriminatedUnion('type', [
  remoteMessageBase.extend({ type: z.literal('pointer.move'), ...normalizedPoint }),
  remoteMessageBase.extend({
    type: z.literal('pointer.down'),
    ...normalizedPoint,
    button: z.enum(remotePointerButtons),
  }),
  remoteMessageBase.extend({
    type: z.literal('pointer.up'),
    ...normalizedPoint,
    button: z.enum(remotePointerButtons),
  }),
  remoteMessageBase.extend({
    type: z.literal('pointer.wheel'),
    ...normalizedPoint,
    deltaX: z.number().min(-10_000).max(10_000),
    deltaY: z.number().min(-10_000).max(10_000),
  }),
  remoteMessageBase.extend({
    type: z.literal('keyboard.down'),
    code: z.string().trim().min(1).max(64),
    key: z.string().max(32),
    repeat: z.boolean(),
    altKey: z.boolean(),
    ctrlKey: z.boolean(),
    shiftKey: z.boolean(),
    metaKey: z.boolean(),
  }),
  remoteMessageBase.extend({
    type: z.literal('keyboard.up'),
    code: z.string().trim().min(1).max(64),
    key: z.string().max(32),
    repeat: z.boolean(),
    altKey: z.boolean(),
    ctrlKey: z.boolean(),
    shiftKey: z.boolean(),
    metaKey: z.boolean(),
  }),
  remoteMessageBase.extend({ type: z.literal('keyboard.releaseAll') }),
  remoteMessageBase.extend({
    type: z.literal('keyboard.shortcut'),
    shortcut: z.enum(remoteShortcutIds),
    text: z.string().max(500).optional(),
  }),
  remoteMessageBase.extend({ type: z.literal('control.heartbeat') }),
  remoteMessageBase.extend({
    type: z.literal('control.release'),
    reason: z.enum(['attacker', 'victim']),
  }),
]);

export const permissionAnswerSchema = socketEventBaseSchema.extend({
  permission: permissionKeySchema,
  status: z.enum(['granted', 'denied']),
});

export const decisionSubmitSchema = socketEventBaseSchema.extend({
  choice: z.enum(decisionChoices),
});

export const signalExamineSchema = socketEventBaseSchema.extend({
  signal: z.enum(storySignalKeys),
});

export const attackerActionSchema = socketEventBaseSchema.extend({
  action: z.enum(attackerActionIds),
});

export const simulationEnqueueSchema = socketEventBaseSchema.extend({
  action: z.enum(simulationActionIds),
  confirmed: z.literal(true),
});

export const remoteStatusSchema = socketEventBaseSchema.extend({
  status: z.enum(['ready', 'screen', 'control', 'ending', 'ended']),
});

export const sessionEventSchema = socketEventBaseSchema;

export const timerControlSchema = socketEventBaseSchema.extend({
  action: z.enum(['start', 'pause', 'resume']),
});

export const profileSelectSchema = socketEventBaseSchema.extend({
  profileId: z.enum(fictionalProfiles.map((profile) => profile.id) as ['alex', 'sam', 'noa']),
});

export const technicalUpdateSchema = socketEventBaseSchema.extend({
  soundReady: z.boolean(),
});

export const remoteChecklistSchema = socketEventBaseSchema.extend({
  item: z.enum(remoteChecklistKeys),
  checked: z.boolean(),
});

export const recoveryOrderSchema = socketEventBaseSchema.extend({
  order: z.array(z.enum(recoveryStepKeys)).length(recoveryStepKeys.length),
});

export const recoveryStepSchema = socketEventBaseSchema.extend({
  step: z.enum(recoveryStepKeys),
});

const sessionDescriptionSchema = z.object({
  type: z.enum(['offer', 'answer']),
  sdp: z.string().min(1).max(24_000),
});

export const webrtcDescriptionSchema = socketEventBaseSchema.extend({
  description: sessionDescriptionSchema,
});

export const webrtcIceSchema = socketEventBaseSchema.extend({
  candidate: z.object({
    candidate: z.string().max(4_000),
    sdpMid: z.string().max(100).nullable().optional(),
    sdpMLineIndex: z.number().int().min(0).max(100).nullable().optional(),
    usernameFragment: z.string().max(256).nullable().optional(),
  }),
});

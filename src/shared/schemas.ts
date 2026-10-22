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
} from './types.js';

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

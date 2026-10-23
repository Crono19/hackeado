import type { AgentCapabilities, RemoteStopReason } from './types.js';

export const remoteProtocolVersion = 1 as const;

export const remotePointerButtons = ['left', 'middle', 'right', 'back', 'forward'] as const;
export type RemotePointerButton = (typeof remotePointerButtons)[number];

export const remoteShortcutIds = [
  'start',
  'alt-tab',
  'escape',
  'enter',
  'select-all',
  'copy',
  'paste-text',
  'undo',
  'close-window',
  'show-desktop',
] as const;
export type RemoteShortcutId = (typeof remoteShortcutIds)[number];

export const remoteMessageTypes = [
  'pointer.move',
  'pointer.down',
  'pointer.up',
  'pointer.wheel',
  'keyboard.down',
  'keyboard.up',
  'keyboard.releaseAll',
  'keyboard.shortcut',
  'control.heartbeat',
  'control.release',
] as const;
export type RemoteMessageType = (typeof remoteMessageTypes)[number];

export interface RemoteMessageBase {
  version: typeof remoteProtocolVersion;
  sessionId: string;
  leaseId: string;
  sequence: number;
  sentAt: number;
}

export interface PointerMoveMessage extends RemoteMessageBase {
  type: 'pointer.move';
  x: number;
  y: number;
}

export interface PointerButtonMessage extends RemoteMessageBase {
  type: 'pointer.down' | 'pointer.up';
  x: number;
  y: number;
  button: RemotePointerButton;
}

export interface PointerWheelMessage extends RemoteMessageBase {
  type: 'pointer.wheel';
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
}

export interface KeyboardKeyMessage extends RemoteMessageBase {
  type: 'keyboard.down' | 'keyboard.up';
  code: string;
  key: string;
  repeat: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export interface KeyboardReleaseAllMessage extends RemoteMessageBase {
  type: 'keyboard.releaseAll';
}

export interface KeyboardShortcutMessage extends RemoteMessageBase {
  type: 'keyboard.shortcut';
  shortcut: RemoteShortcutId;
  text?: string;
}

export interface ControlHeartbeatMessage extends RemoteMessageBase {
  type: 'control.heartbeat';
}

export interface ControlReleaseMessage extends RemoteMessageBase {
  type: 'control.release';
  reason: Extract<RemoteStopReason, 'attacker' | 'victim'>;
}

export type RemoteControlMessage =
  | PointerMoveMessage
  | PointerButtonMessage
  | PointerWheelMessage
  | KeyboardKeyMessage
  | KeyboardReleaseAllMessage
  | KeyboardShortcutMessage
  | ControlHeartbeatMessage
  | ControlReleaseMessage;

export interface AgentRegistrationInput {
  deviceId: string;
  agentKey: string;
  version: string;
  capabilities: AgentCapabilities;
}

export interface RegisteredAgentView {
  sessionId: string;
  agentId: string;
  deviceId: string;
  version: string;
  participantId: string;
  registeredAt: number;
  lastSeenAt: number;
  capabilities: AgentCapabilities;
}

export interface ControlLeaseView {
  leaseId: string;
  sessionId: string;
  ownerParticipantId: string;
  agentParticipantId: string;
  issuedAt: number;
  expiresAt: number;
}

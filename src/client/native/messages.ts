import type { AgentCapabilities, RemoteStopReason } from '../../shared/types';
import type { RemoteControlMessage } from '../../shared/remote-protocol';

export interface NativeAgentRegistration {
  deviceId: string;
  agentKey: string;
  version: string;
  capabilities: AgentCapabilities;
}

export type WebToNativeMessage =
  | { type: 'bridge.probe'; requestId: string }
  | {
      type: 'control.context';
      sessionId: string;
      leaseId: string;
      expiresAt: number;
      consentGranted: boolean;
      active: boolean;
      operatorName: string;
    }
  | { type: 'control.clear'; reason: RemoteStopReason }
  | { type: 'remote.input'; payload: RemoteControlMessage };

export type NativeToWebMessage =
  | { type: 'native.ready'; registration: NativeAgentRegistration }
  | { type: 'native.input.accepted'; sequence: number }
  | { type: 'native.input.rejected'; sequence?: number; reason: string }
  | { type: 'native.stopped'; reason: RemoteStopReason }
  | { type: 'native.fault'; code: string };

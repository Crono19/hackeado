import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { AgentRegistrationInput, RegisteredAgentView } from '../../shared/remote-protocol.js';

export interface AgentRegistryOptions {
  allowedDeviceId: string;
  agentKey: string;
  heartbeatTimeoutMs: number;
  now?: () => number;
}

interface AgentRecord extends RegisteredAgentView {
  sessionId: string;
}

export class AgentRegistry {
  private readonly agents = new Map<string, AgentRecord>();
  private readonly now: () => number;

  constructor(private readonly options: AgentRegistryOptions) {
    this.now = options.now ?? Date.now;
  }

  register(
    sessionId: string,
    participantId: string,
    input: AgentRegistrationInput,
  ): RegisteredAgentView {
    if (!this.options.allowedDeviceId || !this.options.agentKey) {
      throw new Error('agent_registration_disabled');
    }
    if (input.deviceId !== this.options.allowedDeviceId) throw new Error('device_not_authorized');
    if (!secretMatches(input.agentKey, this.options.agentKey)) throw new Error('agent_key_invalid');
    if (!input.capabilities.nativeBridge) throw new Error('native_bridge_required');

    const current = this.agents.get(sessionId);
    if (current && current.participantId !== participantId && this.isFresh(current)) {
      throw new Error('agent_already_registered');
    }

    const now = this.now();
    const record: AgentRecord = {
      sessionId,
      agentId: randomUUID(),
      deviceId: input.deviceId,
      version: input.version,
      participantId,
      registeredAt: now,
      lastSeenAt: now,
      capabilities: { ...input.capabilities },
    };
    this.agents.set(sessionId, record);
    return view(record);
  }

  heartbeat(sessionId: string, participantId: string, agentId: string): RegisteredAgentView {
    const record = this.requireAgent(sessionId);
    if (record.participantId !== participantId || record.agentId !== agentId) {
      throw new Error('agent_identity_mismatch');
    }
    record.lastSeenAt = this.now();
    return view(record);
  }

  updateCapabilities(
    sessionId: string,
    participantId: string,
    agentId: string,
    capabilities: AgentRegistrationInput['capabilities'],
  ): RegisteredAgentView {
    const record = this.requireAgent(sessionId);
    if (record.participantId !== participantId || record.agentId !== agentId) {
      throw new Error('agent_identity_mismatch');
    }
    if (!capabilities.nativeBridge) throw new Error('native_bridge_required');
    record.capabilities = { ...capabilities };
    record.lastSeenAt = this.now();
    return view(record);
  }

  getOnline(sessionId: string): RegisteredAgentView {
    const record = this.requireAgent(sessionId);
    if (!this.isFresh(record)) throw new Error('agent_offline');
    return view(record);
  }

  assertParticipant(sessionId: string, participantId: string): RegisteredAgentView {
    const record = this.getOnline(sessionId);
    if (record.participantId !== participantId) throw new Error('agent_identity_mismatch');
    return record;
  }

  disconnect(sessionId: string, participantId: string): RegisteredAgentView | undefined {
    const record = this.agents.get(sessionId);
    if (!record || record.participantId !== participantId) return undefined;
    this.agents.delete(sessionId);
    return view(record);
  }

  expireStale(): RegisteredAgentView[] {
    const expired: RegisteredAgentView[] = [];
    for (const [sessionId, record] of this.agents) {
      if (this.isFresh(record)) continue;
      this.agents.delete(sessionId);
      expired.push(view(record));
    }
    return expired;
  }

  clearSession(sessionId: string) {
    this.agents.delete(sessionId);
  }

  private requireAgent(sessionId: string): AgentRecord {
    const record = this.agents.get(sessionId);
    if (!record) throw new Error('agent_offline');
    return record;
  }

  private isFresh(record: AgentRecord): boolean {
    return record.lastSeenAt + this.options.heartbeatTimeoutMs > this.now();
  }
}

function view(record: AgentRecord): RegisteredAgentView {
  return {
    sessionId: record.sessionId,
    agentId: record.agentId,
    deviceId: record.deviceId,
    version: record.version,
    participantId: record.participantId,
    registeredAt: record.registeredAt,
    lastSeenAt: record.lastSeenAt,
    capabilities: { ...record.capabilities },
  };
}

function secretMatches(received: string, expected: string): boolean {
  const receivedHash = createHash('sha256').update(received).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

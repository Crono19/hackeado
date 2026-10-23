import { randomBytes } from 'node:crypto';
import type { ControlLeaseView } from '../../shared/remote-protocol.js';

export interface ControlLeaseManagerOptions {
  ttlMs: number;
  now?: () => number;
}

type ControlLeaseRecord = ControlLeaseView;

export class ControlLeaseManager {
  private readonly leases = new Map<string, ControlLeaseRecord>();
  private readonly now: () => number;

  constructor(private readonly options: ControlLeaseManagerOptions) {
    this.now = options.now ?? Date.now;
  }

  issue(
    sessionId: string,
    ownerParticipantId: string,
    agentParticipantId: string,
  ): ControlLeaseView {
    const current = this.leases.get(sessionId);
    if (current && current.expiresAt > this.now()) {
      if (current.ownerParticipantId !== ownerParticipantId) {
        throw new Error('control_lease_owned');
      }
      throw new Error('control_lease_exists');
    }

    const issuedAt = this.now();
    const lease: ControlLeaseRecord = {
      leaseId: randomBytes(24).toString('base64url'),
      sessionId,
      ownerParticipantId,
      agentParticipantId,
      issuedAt,
      expiresAt: issuedAt + this.options.ttlMs,
    };
    this.leases.set(sessionId, lease);
    return clone(lease);
  }

  validate(sessionId: string, leaseId: string, ownerParticipantId: string): ControlLeaseView {
    const lease = this.requireLease(sessionId);
    if (lease.expiresAt <= this.now()) {
      this.leases.delete(sessionId);
      throw new Error('control_lease_expired');
    }
    if (lease.leaseId !== leaseId || lease.ownerParticipantId !== ownerParticipantId) {
      throw new Error('control_lease_invalid');
    }
    return clone(lease);
  }

  renew(sessionId: string, leaseId: string, ownerParticipantId: string): ControlLeaseView {
    const lease = this.validate(sessionId, leaseId, ownerParticipantId);
    const renewed = { ...lease, expiresAt: this.now() + this.options.ttlMs };
    this.leases.set(sessionId, renewed);
    return clone(renewed);
  }

  revoke(sessionId: string): ControlLeaseView | undefined {
    const lease = this.leases.get(sessionId);
    this.leases.delete(sessionId);
    return lease ? clone(lease) : undefined;
  }

  revokeOwnedBy(sessionId: string, participantId: string): ControlLeaseView | undefined {
    const lease = this.leases.get(sessionId);
    if (!lease || lease.ownerParticipantId !== participantId) return undefined;
    this.leases.delete(sessionId);
    return clone(lease);
  }

  expireStale(): ControlLeaseView[] {
    const expired: ControlLeaseView[] = [];
    for (const [sessionId, lease] of this.leases) {
      if (lease.expiresAt > this.now()) continue;
      this.leases.delete(sessionId);
      expired.push(clone(lease));
    }
    return expired;
  }

  clearSession(sessionId: string) {
    this.leases.delete(sessionId);
  }

  private requireLease(sessionId: string): ControlLeaseRecord {
    const lease = this.leases.get(sessionId);
    if (!lease) throw new Error('control_lease_missing');
    return lease;
  }
}

function clone(lease: ControlLeaseRecord): ControlLeaseView {
  return { ...lease };
}

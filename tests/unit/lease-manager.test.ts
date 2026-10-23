import { describe, expect, it } from 'vitest';
import { ControlLeaseManager } from '../../src/server/control/lease-manager.js';

function setup() {
  let now = 1_000;
  const manager = new ControlLeaseManager({ ttlMs: 15_000, now: () => now });
  return { manager, setNow: (value: number) => (now = value) };
}

describe('control lease manager', () => {
  it('allows one owner and rejects another', () => {
    const { manager } = setup();
    manager.issue('session-01', 'attacker-01', 'victim-01');
    expect(() => manager.issue('session-01', 'attacker-02', 'victim-01')).toThrow(
      'control_lease_owned',
    );
  });

  it('validates and renews only matching owner and token', () => {
    const { manager, setNow } = setup();
    const lease = manager.issue('session-01', 'attacker-01', 'victim-01');
    expect(() => manager.validate('session-01', lease.leaseId, 'attacker-02')).toThrow(
      'control_lease_invalid',
    );
    setNow(5_000);
    const renewed = manager.renew('session-01', lease.leaseId, 'attacker-01');
    expect(renewed.expiresAt).toBe(20_000);
  });

  it('expires and removes stale leases', () => {
    const { manager, setNow } = setup();
    const lease = manager.issue('session-01', 'attacker-01', 'victim-01');
    setNow(16_001);
    expect(manager.expireStale()).toEqual([lease]);
    expect(() => manager.validate('session-01', lease.leaseId, 'attacker-01')).toThrow(
      'control_lease_missing',
    );
  });

  it('revokes on owner disconnect', () => {
    const { manager } = setup();
    manager.issue('session-01', 'attacker-01', 'victim-01');
    expect(manager.revokeOwnedBy('session-01', 'attacker-02')).toBeUndefined();
    expect(manager.revokeOwnedBy('session-01', 'attacker-01')?.ownerParticipantId).toBe(
      'attacker-01',
    );
  });
});

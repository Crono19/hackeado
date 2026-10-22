import { describe, expect, it } from 'vitest';
import {
  attackerActionSchema,
  decisionSubmitSchema,
  phaseTransitionRequestSchema,
  recoveryOrderSchema,
  recoveryStepSchema,
  remoteChecklistSchema,
  simulationEnqueueSchema,
  webrtcDescriptionSchema,
  webrtcIceSchema,
} from '../../src/shared/schemas';

describe('transition request schema', () => {
  it('accepts valid transition request', () => {
    expect(
      phaseTransitionRequestSchema.safeParse({
        eventId: 'event-valid-0001',
        sessionId: 'demo-01',
        target: 'waiting',
        reason: 'Inicio del recorrido',
      }).success,
    ).toBe(true);
  });

  it('rejects unknown phases and oversized reasons', () => {
    expect(
      phaseTransitionRequestSchema.safeParse({
        eventId: 'event-invalid-0001',
        sessionId: 'demo-01',
        target: 'root-shell',
        reason: 'x'.repeat(161),
      }).success,
    ).toBe(false);
  });
});

describe('phase 9–11 event schemas', () => {
  const base = { eventId: 'event-valid-0002', sessionId: 'demo-01' };

  it('accepts known decisions and attacker actions', () => {
    expect(decisionSubmitSchema.safeParse({ ...base, choice: 'verify' }).success).toBe(true);
    expect(attackerActionSchema.safeParse({ ...base, action: 'request_screen' }).success).toBe(
      true,
    );
  });

  it('rejects invented commands', () => {
    expect(attackerActionSchema.safeParse({ ...base, action: 'download_real_files' }).success).toBe(
      false,
    );
  });
});

describe('phase 13 simulation schema', () => {
  const base = { eventId: 'event-valid-0013', sessionId: 'demo-01' };

  it('requires explicit confirmation for a known safe effect', () => {
    expect(
      simulationEnqueueSchema.safeParse({ ...base, action: 'copy_files', confirmed: true }).success,
    ).toBe(true);
    expect(simulationEnqueueSchema.safeParse({ ...base, action: 'copy_files' }).success).toBe(
      false,
    );
  });

  it('rejects arbitrary device actions', () => {
    expect(
      simulationEnqueueSchema.safeParse({
        ...base,
        action: 'read_real_files',
        confirmed: true,
      }).success,
    ).toBe(false);
  });
});

describe('phase 15–17 safety schemas', () => {
  const base = { eventId: 'event-valid-0017', sessionId: 'demo-01' };
  const order = [
    'disconnect_remote',
    'revoke_permissions',
    'secure_accounts',
    'close_sessions',
    'enable_mfa',
    'review_report',
  ];

  it('accepts the complete recovery vocabulary', () => {
    expect(recoveryOrderSchema.safeParse({ ...base, order }).success).toBe(true);
    expect(recoveryStepSchema.safeParse({ ...base, step: 'enable_mfa' }).success).toBe(true);
  });

  it('rejects incomplete orders and invented safety settings', () => {
    expect(recoveryOrderSchema.safeParse({ ...base, order: order.slice(0, 5) }).success).toBe(
      false,
    );
    expect(
      remoteChecklistSchema.safeParse({ ...base, item: 'hidden_access', checked: true }).success,
    ).toBe(false);
  });

  it('accepts only known remote checklist items', () => {
    expect(
      remoteChecklistSchema.safeParse({ ...base, item: 'unattendedDisabled', checked: true })
        .success,
    ).toBe(true);
  });
});

describe('WebRTC signaling schemas', () => {
  const base = { eventId: 'event-webrtc-0001', sessionId: 'demo-01' };

  it('accepts bounded SDP and ICE messages', () => {
    expect(
      webrtcDescriptionSchema.safeParse({
        ...base,
        description: { type: 'offer', sdp: 'v=0\r\n' },
      }).success,
    ).toBe(true);
    expect(
      webrtcIceSchema.safeParse({
        ...base,
        candidate: { candidate: 'candidate:1 1 udp 1 192.168.1.2 9999 typ host' },
      }).success,
    ).toBe(true);
  });

  it('rejects oversized or invented signaling payloads', () => {
    expect(
      webrtcDescriptionSchema.safeParse({
        ...base,
        description: { type: 'offer', sdp: 'x'.repeat(24_001) },
      }).success,
    ).toBe(false);
    expect(
      webrtcDescriptionSchema.safeParse({
        ...base,
        description: { type: 'rollback', sdp: 'v=0' },
      }).success,
    ).toBe(false);
  });
});

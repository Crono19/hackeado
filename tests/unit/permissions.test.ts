import { describe, expect, it } from 'vitest';
import {
  answerPermission,
  canRequestPermission,
  requestPermission,
} from '../../src/shared/permissions';
import { createInitialSession } from '../../src/shared/session';
import type { DemoSession } from '../../src/shared/types';

function permissionSession(): DemoSession {
  return { ...createInitialSession({ now: 1_000 }), phase: 'permissions' };
}

describe('permission engine', () => {
  it('enforces dependency order', () => {
    let session = permissionSession();
    expect(canRequestPermission(session, 'screen')).toBe(true);
    expect(canRequestPermission(session, 'keyboard')).toBe(false);
    expect(() => requestPermission(session, 'keyboard')).toThrow('permission_dependency');
    session = requestPermission(session, 'screen', 1_100);
    session = answerPermission(session, 'screen', 'granted', 1_200);
    expect(canRequestPermission(session, 'keyboard')).toBe(true);
    expect(canRequestPermission(session, 'unattended')).toBe(false);
  });

  it('updates risk immediately after grant', () => {
    let session = requestPermission(permissionSession(), 'screen', 1_100);
    session = answerPermission(session, 'screen', 'granted', 1_200);
    expect(session.risk.privacy).toBeGreaterThan(0);
    expect(session.risk.recoverability).toBeLessThan(100);
  });

  it('supports safe rejection of screen', () => {
    let session = requestPermission(permissionSession(), 'screen', 1_100);
    session = answerPermission(session, 'screen', 'denied', 1_200);
    expect(session.phase).toBe('result');
    expect(session.outcome).toBe('safe');
  });

  it('supports moderate route when control is rejected after screen grant', () => {
    let session = requestPermission(permissionSession(), 'screen', 1_100);
    session = answerPermission(session, 'screen', 'granted', 1_200);
    session = requestPermission(session, 'keyboard', 1_300);
    session = answerPermission(session, 'keyboard', 'denied', 1_400);
    expect(session.phase).toBe('reveal');
    expect(session.outcome).toBe('moderate');
  });

  it('rejects answers outside permissions phase or without a request', () => {
    expect(() => answerPermission(createInitialSession(), 'screen', 'granted')).toThrow(
      'permission_out_of_phase',
    );
    expect(() => answerPermission(permissionSession(), 'screen', 'granted')).toThrow(
      'permission_not_requested',
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  agentCapabilitiesSchema,
  agentRegisterSchema,
  remoteControlMessageSchema,
} from '../../src/shared/schemas.js';

const capabilities = {
  nativeBridge: true,
  desktopCapture: true,
  pointer: true,
  keyboard: true,
  wheel: true,
  emergencyHotkey: true,
  displayCount: 1,
  screenWidth: 1920,
  screenHeight: 1080,
  dpiScale: 1.25,
};

const base = {
  version: 1 as const,
  sessionId: 'session-remote-01',
  leaseId: 'lease-remote-control-0001',
  sequence: 4,
  sentAt: 10_000,
};

describe('native remote protocol', () => {
  it('accepts complete native capabilities', () => {
    expect(agentCapabilitiesSchema.parse(capabilities)).toEqual(capabilities);
  });

  it('requires a native bridge and bounded display metadata at registration', () => {
    const result = agentRegisterSchema.safeParse({
      eventId: 'event-agent-register-01',
      sessionId: base.sessionId,
      deviceId: 'hackeado-windows-vm',
      agentKey: 'a-secure-demo-agent-key',
      version: '0.2.0',
      capabilities,
    });
    expect(result.success).toBe(true);
    expect(
      agentRegisterSchema.safeParse({
        eventId: 'event-agent-register-02',
        sessionId: base.sessionId,
        deviceId: 'invalid device id',
        agentKey: 'short',
        version: '0.2.0',
        capabilities: { ...capabilities, displayCount: 0 },
      }).success,
    ).toBe(false);
  });

  it('accepts pointer, keyboard, heartbeat, and release messages', () => {
    const messages = [
      { ...base, type: 'pointer.move', x: 0.5, y: 0.75 },
      { ...base, type: 'pointer.down', x: 0.5, y: 0.75, button: 'left' },
      { ...base, type: 'pointer.up', x: 0.5, y: 0.75, button: 'left' },
      { ...base, type: 'pointer.wheel', x: 0.5, y: 0.75, deltaX: 0, deltaY: -120 },
      {
        ...base,
        type: 'keyboard.down',
        code: 'KeyH',
        key: 'h',
        repeat: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
      },
      { ...base, type: 'keyboard.releaseAll' },
      { ...base, type: 'keyboard.shortcut', shortcut: 'alt-tab' },
      { ...base, type: 'control.heartbeat' },
      { ...base, type: 'control.release', reason: 'attacker' },
    ];

    expect(messages.every((message) => remoteControlMessageSchema.safeParse(message).success)).toBe(
      true,
    );
  });

  it('rejects unknown types, invalid coordinates, and unsupported protocol versions', () => {
    expect(
      remoteControlMessageSchema.safeParse({ ...base, type: 'pointer.move', x: 1.1, y: 0.5 })
        .success,
    ).toBe(false);
    expect(
      remoteControlMessageSchema.safeParse({ ...base, version: 2, type: 'control.heartbeat' })
        .success,
    ).toBe(false);
    expect(
      remoteControlMessageSchema.safeParse({ ...base, type: 'system.command', command: 'whoami' })
        .success,
    ).toBe(false);
  });
});

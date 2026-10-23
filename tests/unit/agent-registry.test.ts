import { describe, expect, it } from 'vitest';
import { AgentRegistry } from '../../src/server/control/agent-registry.js';

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
  dpiScale: 1,
};

function setup() {
  let now = 1_000;
  const registry = new AgentRegistry({
    allowedDeviceId: 'hackeado-windows-vm',
    agentKey: 'correct-agent-secret-key',
    heartbeatTimeoutMs: 9_000,
    now: () => now,
  });
  return { registry, setNow: (value: number) => (now = value) };
}

describe('agent registry', () => {
  it('registers only configured device and secret', () => {
    const { registry } = setup();
    expect(() =>
      registry.register('session-01', 'victim-01', {
        deviceId: 'other-device',
        agentKey: 'correct-agent-secret-key',
        version: '0.2.0',
        capabilities,
      }),
    ).toThrow('device_not_authorized');
    expect(() =>
      registry.register('session-01', 'victim-01', {
        deviceId: 'hackeado-windows-vm',
        agentKey: 'incorrect-agent-secret',
        version: '0.2.0',
        capabilities,
      }),
    ).toThrow('agent_key_invalid');
  });

  it('registers, heartbeats, and expires an authorized agent', () => {
    const { registry, setNow } = setup();
    const registered = registry.register('session-01', 'victim-01', {
      deviceId: 'hackeado-windows-vm',
      agentKey: 'correct-agent-secret-key',
      version: '0.2.0',
      capabilities,
    });
    expect(registered.agentId).toBeTypeOf('string');
    setNow(5_000);
    expect(registry.heartbeat('session-01', 'victim-01', registered.agentId).lastSeenAt).toBe(
      5_000,
    );
    setNow(14_001);
    expect(registry.expireStale()).toHaveLength(1);
    expect(() => registry.getOnline('session-01')).toThrow('agent_offline');
  });

  it('rejects a second live victim agent in the same session', () => {
    const { registry } = setup();
    registry.register('session-01', 'victim-01', {
      deviceId: 'hackeado-windows-vm',
      agentKey: 'correct-agent-secret-key',
      version: '0.2.0',
      capabilities,
    });
    expect(() =>
      registry.register('session-01', 'victim-02', {
        deviceId: 'hackeado-windows-vm',
        agentKey: 'correct-agent-secret-key',
        version: '0.2.0',
        capabilities,
      }),
    ).toThrow('agent_already_registered');
  });
});

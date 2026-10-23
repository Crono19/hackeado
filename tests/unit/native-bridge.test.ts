import { describe, expect, it } from 'vitest';
import { parseNativeMessage } from '../../src/client/native/bridge';

describe('native WebView bridge messages', () => {
  it('accepts complete native registration', () => {
    const message = parseNativeMessage({
      type: 'native.ready',
      registration: {
        deviceId: 'hackeado-windows-vm',
        agentKey: 'test-agent-key-000000',
        version: '0.3.0',
        capabilities: { nativeBridge: true },
      },
    });
    expect(message?.type).toBe('native.ready');
  });

  it('rejects unknown and incomplete messages', () => {
    expect(parseNativeMessage({ type: 'native.ready' })).toBeNull();
    expect(parseNativeMessage({ type: 'native.magic' })).toBeNull();
    expect(parseNativeMessage('native.ready')).toBeNull();
  });
});

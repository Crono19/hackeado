import type { RemoteControlMessage } from '../../shared/remote-protocol';
import type { RemoteStopReason } from '../../shared/types';
import type { NativeAgentRegistration, NativeToWebMessage, WebToNativeMessage } from './messages';

interface WebViewHost {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<unknown>) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<unknown>) => void): void;
}

declare global {
  interface Window {
    chrome?: { webview?: WebViewHost };
  }
}

export function hasNativeBridge(): boolean {
  return Boolean(window.chrome?.webview?.postMessage);
}

export function postToNative(message: WebToNativeMessage): boolean {
  const webview = window.chrome?.webview;
  if (!webview) return false;
  webview.postMessage(message);
  return true;
}

export function probeNativeBridge(timeoutMs = 1_500): Promise<NativeAgentRegistration | null> {
  const webview = window.chrome?.webview;
  if (!webview) return Promise.resolve(null);
  const host = webview;

  return new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    const onMessage = (event: MessageEvent<unknown>) => {
      const parsed = parseNativeMessage(event.data);
      if (parsed?.type === 'native.ready') finish(parsed.registration);
    };
    function finish(value: NativeAgentRegistration | null) {
      window.clearTimeout(timer);
      host.removeEventListener('message', onMessage);
      resolve(value);
    }
    host.addEventListener('message', onMessage);
    postToNative({ type: 'bridge.probe', requestId });
  });
}

export function setNativeControlContext(context: {
  sessionId: string;
  leaseId: string;
  expiresAt: number;
  consentGranted: boolean;
  active: boolean;
  operatorName: string;
}) {
  return postToNative({ type: 'control.context', ...context });
}

export function clearNativeControl(reason: RemoteStopReason) {
  return postToNative({ type: 'control.clear', reason });
}

export function sendNativeInput(payload: RemoteControlMessage) {
  return postToNative({ type: 'remote.input', payload });
}

export function subscribeNativeMessages(listener: (message: NativeToWebMessage) => void) {
  const webview = window.chrome?.webview;
  if (!webview) return () => undefined;
  const onMessage = (event: MessageEvent<unknown>) => {
    const parsed = parseNativeMessage(event.data);
    if (parsed) listener(parsed);
  };
  webview.addEventListener('message', onMessage);
  return () => webview.removeEventListener('message', onMessage);
}

export function parseNativeMessage(value: unknown): NativeToWebMessage | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.type !== 'string') return null;
  if (candidate.type === 'native.ready') {
    const registration = candidate.registration as Record<string, unknown> | undefined;
    if (
      !registration ||
      typeof registration.deviceId !== 'string' ||
      typeof registration.agentKey !== 'string' ||
      typeof registration.version !== 'string' ||
      !registration.capabilities ||
      typeof registration.capabilities !== 'object'
    )
      return null;
    return candidate as unknown as NativeToWebMessage;
  }
  if (
    ['native.input.accepted', 'native.input.rejected', 'native.stopped', 'native.fault'].includes(
      candidate.type,
    )
  )
    return candidate as unknown as NativeToWebMessage;
  return null;
}

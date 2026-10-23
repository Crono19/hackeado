import type { KeyboardKeyMessage } from '../../shared/remote-protocol';

const namedCodes = new Set([
  'Backspace',
  'Tab',
  'Enter',
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'CapsLock',
  'Escape',
  'Space',
  'PageUp',
  'PageDown',
  'End',
  'Home',
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'Insert',
  'Delete',
  'Semicolon',
  'Equal',
  'Comma',
  'Minus',
  'Period',
  'Slash',
  'Backquote',
  'BracketLeft',
  'Backslash',
  'BracketRight',
  'Quote',
  'IntlBackslash',
  'IntlRo',
  'IntlYen',
]);

export const localKeyboardReleaseLabel = 'Ctrl + Shift + \\';

export function isAllowedRemoteCode(code: string) {
  if (namedCodes.has(code)) return true;
  if (/^Key[A-Z]$/.test(code) || /^Digit[0-9]$/.test(code)) return true;
  if (/^Numpad[A-Za-z0-9]+$/.test(code)) return true;
  return /^F(?:[1-9]|1[01])$/.test(code);
}

export function isLocalReleaseShortcut(
  event: Pick<KeyboardEvent, 'ctrlKey' | 'shiftKey' | 'code'>,
) {
  return event.ctrlKey && event.shiftKey && event.code === 'Backslash';
}

export function toRemoteKeyPayload(
  event: Pick<
    KeyboardEvent,
    'code' | 'key' | 'repeat' | 'altKey' | 'ctrlKey' | 'shiftKey' | 'metaKey'
  >,
): Omit<
  KeyboardKeyMessage,
  'version' | 'type' | 'sessionId' | 'leaseId' | 'sequence' | 'sentAt'
> | null {
  if (!isAllowedRemoteCode(event.code) || event.metaKey) return null;
  if (event.ctrlKey && event.altKey && ['Delete', 'Escape'].includes(event.code)) return null;
  if (event.ctrlKey && event.shiftKey && event.code === 'Escape') return null;
  if (event.altKey && event.code === 'F4') return null;
  return {
    code: event.code,
    key: event.key.slice(0, 32),
    repeat: event.repeat,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    metaKey: false,
  };
}

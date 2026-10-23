import { describe, expect, it } from 'vitest';
import {
  isAllowedRemoteCode,
  isLocalReleaseShortcut,
  toRemoteKeyPayload,
} from '../../src/client/webrtc/keyboard.js';

const key = (overrides: Partial<KeyboardEvent> = {}) =>
  ({
    code: 'KeyA',
    key: 'a',
    repeat: false,
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    ...overrides,
  }) as KeyboardEvent;

describe('remote keyboard guard', () => {
  it('accepts letters, digits, symbols, arrows and F1-F11', () => {
    for (const code of ['KeyZ', 'Digit7', 'Semicolon', 'ArrowLeft', 'Numpad5', 'F11'])
      expect(isAllowedRemoteCode(code)).toBe(true);
  });

  it('blocks Meta, F12 and dangerous raw combinations', () => {
    expect(toRemoteKeyPayload(key({ metaKey: true }))).toBeNull();
    expect(toRemoteKeyPayload(key({ code: 'F12', key: 'F12' }))).toBeNull();
    expect(
      toRemoteKeyPayload(key({ code: 'Delete', key: 'Delete', ctrlKey: true, altKey: true })),
    ).toBeNull();
    expect(
      toRemoteKeyPayload(key({ code: 'Escape', key: 'Escape', ctrlKey: true, shiftKey: true })),
    ).toBeNull();
    expect(toRemoteKeyPayload(key({ code: 'F4', key: 'F4', altKey: true }))).toBeNull();
  });

  it('preserves uppercase, symbols, modifiers and key repeat', () => {
    expect(toRemoteKeyPayload(key({ key: 'A', shiftKey: true, repeat: true }))).toMatchObject({
      code: 'KeyA',
      key: 'A',
      shiftKey: true,
      repeat: true,
    });
    expect(toRemoteKeyPayload(key({ code: 'Semicolon', key: ':', shiftKey: true }))?.key).toBe(':');
  });

  it('reserves Ctrl+Shift+Backslash as local release', () => {
    expect(isLocalReleaseShortcut(key({ code: 'Backslash', ctrlKey: true, shiftKey: true }))).toBe(
      true,
    );
  });
});

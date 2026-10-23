import { describe, expect, it } from 'vitest';
import { bitrateKbps, classifyQuality } from '../../src/client/webrtc/quality';

describe('WebRTC quality', () => {
  it('classifies objective quality levels', () => {
    expect(
      classifyQuality({
        width: 1920,
        height: 1080,
        fps: 30,
        bitrateKbps: 6000,
        packetsLost: 0,
        roundTripMs: 40,
      }),
    ).toBe('optimal');
    expect(
      classifyQuality({
        width: 1280,
        height: 720,
        fps: 20,
        bitrateKbps: 2500,
        packetsLost: 2,
        roundTripMs: 180,
      }),
    ).toBe('adapted');
    expect(
      classifyQuality({
        width: 640,
        height: 480,
        fps: 8,
        bitrateKbps: 500,
        packetsLost: 40,
        roundTripMs: 500,
      }),
    ).toBe('degraded');
    expect(
      classifyQuality({
        width: 0,
        height: 0,
        fps: 0,
        bitrateKbps: 0,
        packetsLost: 0,
        roundTripMs: 0,
      }),
    ).toBe('offline');
  });

  it('calculates bitrate from RTC byte counters', () => {
    expect(bitrateKbps({ at: 1_000, bytes: 1_000 }, 2_000, 751_000)).toBe(6_000);
  });
});

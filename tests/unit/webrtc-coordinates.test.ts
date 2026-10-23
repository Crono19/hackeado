import { describe, expect, it } from 'vitest';
import { mapClientPointToVideo } from '../../src/client/webrtc/coordinates';

describe('WebRTC video coordinates', () => {
  it('maps center and edges for equal aspect ratio', () => {
    const rect = { left: 100, top: 50, width: 1600, height: 900 };
    expect(mapClientPointToVideo(900, 500, rect, { width: 1920, height: 1080 })).toEqual({
      x: 0.5,
      y: 0.5,
      inside: true,
    });
    expect(mapClientPointToVideo(100, 50, rect, { width: 1920, height: 1080 })).toEqual({
      x: 0,
      y: 0,
      inside: true,
    });
  });

  it('rejects clicks in letterbox while preserving clamped coordinates', () => {
    const point = mapClientPointToVideo(
      10,
      450,
      { left: 0, top: 0, width: 1600, height: 900 },
      {
        width: 1024,
        height: 768,
      },
    );
    expect(point.inside).toBe(false);
    expect(point.x).toBe(0);
    expect(point.y).toBe(0.5);
  });

  it('maps a 16:9 source inside portrait container', () => {
    const point = mapClientPointToVideo(
      450,
      800,
      { left: 0, top: 0, width: 900, height: 1600 },
      {
        width: 1920,
        height: 1080,
      },
    );
    expect(point).toEqual({ x: 0.5, y: 0.5, inside: true });
  });
});

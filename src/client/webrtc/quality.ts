export interface QualitySnapshot {
  bitrateKbps: number;
  fps: number;
  packetsLost: number;
  roundTripMs: number;
  width: number;
  height: number;
}

export type QualityLevel = 'optimal' | 'adapted' | 'degraded' | 'offline';

export const emptyQuality: QualitySnapshot = {
  bitrateKbps: 0,
  fps: 0,
  packetsLost: 0,
  roundTripMs: 0,
  width: 0,
  height: 0,
};

export function classifyQuality(quality: QualitySnapshot): QualityLevel {
  if (!quality.width || !quality.height || !quality.fps) return 'offline';
  if (quality.height >= 900 && quality.fps >= 24 && quality.roundTripMs < 150) return 'optimal';
  if (quality.height >= 720 && quality.fps >= 15 && quality.roundTripMs < 300) return 'adapted';
  return 'degraded';
}

export function bitrateKbps(previous: { at: number; bytes: number }, at: number, bytes: number) {
  const elapsed = at - previous.at;
  return elapsed > 0 ? Math.max(0, Math.round(((bytes - previous.bytes) * 8) / elapsed)) : 0;
}

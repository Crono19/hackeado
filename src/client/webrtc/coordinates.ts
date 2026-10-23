export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VideoSize {
  width: number;
  height: number;
}

export interface NormalizedPoint {
  x: number;
  y: number;
  inside: boolean;
}

export function mapClientPointToVideo(
  clientX: number,
  clientY: number,
  rect: RectLike,
  source: VideoSize,
): NormalizedPoint {
  const sourceRatio = source.width > 0 && source.height > 0 ? source.width / source.height : 16 / 9;
  const frameRatio = rect.width / rect.height;
  const renderedWidth = frameRatio > sourceRatio ? rect.height * sourceRatio : rect.width;
  const renderedHeight = frameRatio > sourceRatio ? rect.height : rect.width / sourceRatio;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;
  const rawX = (clientX - rect.left - offsetX) / renderedWidth;
  const rawY = (clientY - rect.top - offsetY) / renderedHeight;
  return {
    x: Math.min(1, Math.max(0, rawX)),
    y: Math.min(1, Math.max(0, rawY)),
    inside: rawX >= 0 && rawX <= 1 && rawY >= 0 && rawY <= 1,
  };
}

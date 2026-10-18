export const MAX_PARALLAX_PX = 40;

export function parallaxOffset(
  elementCenterY: number,
  scrollY: number,
  viewportH: number,
  speed: number,
  maxPx = MAX_PARALLAX_PX,
): number {
  const raw = speed * (scrollY + viewportH / 2 - elementCenterY);
  if (!Number.isFinite(raw) || maxPx <= 0) return 0;
  // tanh eases into the limit, so far-off layers keep drifting instead of freezing at a hard clamp.
  return maxPx * Math.tanh(raw / maxPx) || 0;
}

export function quantise(px: number): number {
  return Math.round(px * 2) / 2 || 0;
}

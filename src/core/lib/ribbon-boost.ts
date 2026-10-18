const MAX_RATE = 7;
const MAX_SKEW_DEG = 3;
const RATE_PER_PX_S = 1 / 220;
const SKEW_PER_PX_S = 1 / 500;

export function ribbonPlaybackRate(velocity: number): number {
  if (!Number.isFinite(velocity)) return 1;
  return Math.min(MAX_RATE, 1 + Math.abs(velocity) * RATE_PER_PX_S);
}

export function ribbonSkew(velocity: number): number {
  if (!Number.isFinite(velocity)) return 0;
  return Math.min(MAX_SKEW_DEG, Math.max(-MAX_SKEW_DEG, velocity * SKEW_PER_PX_S));
}

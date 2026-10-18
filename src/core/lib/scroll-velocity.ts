const TAU_MS = 100;
const REST_BELOW = 5;

export function smoothVelocity(previous: number, instant: number, dtMs: number): number {
  if (!(dtMs > 0) || !Number.isFinite(instant)) return previous;
  const next = previous + (instant - previous) * (1 - Math.exp(-dtMs / TAU_MS));
  return Math.abs(next) < REST_BELOW && instant === 0 ? 0 : next;
}

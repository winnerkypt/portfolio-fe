export type Vec3 = readonly [number, number, number];

export interface RopeState {
  readonly positions: readonly Vec3[];
  readonly previous: readonly Vec3[];
}

export interface RopeOptions {
  readonly anchor: Vec3;
  readonly segment: number;
  readonly gravity: number;
  readonly damping: number;
  readonly iterations: number;
  readonly wind: number;
  readonly tipPinned: boolean;
}

const MAX_DT = 1 / 30;
const TIP_WEIGHT = 1.4;
const DEPTH_DAMPING = 0.9;
const REST_STRETCH = 0.96;

export function createRope(anchor: Vec3, count: number, segment: number): RopeState {
  const positions = Array.from(
    { length: count },
    (_, i): Vec3 => [anchor[0], anchor[1] - i * segment * REST_STRETCH, anchor[2]],
  );
  return { positions, previous: positions };
}

export function pinTip(state: RopeState, target: Vec3): RopeState {
  const last = state.positions.length - 1;
  return {
    positions: state.positions.map((p, i) => (i === last ? target : p)),
    previous: state.previous.map((p, i) => (i === last ? state.positions[last] : p)),
  };
}

export function ropeEnergy(state: RopeState): number {
  return state.positions.reduce((sum, p, i) => {
    const q = state.previous[i];
    return sum + (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
  }, 0);
}

function integrate(state: RopeState, dt: number, o: RopeOptions): RopeState {
  const last = state.positions.length - 1;
  const positions = state.positions.map((p, i): Vec3 => {
    if (i === 0) return o.anchor;
    if (o.tipPinned && i === last) return p;
    const q = state.previous[i];
    const g = o.gravity * dt * dt * (i === last ? TIP_WEIGHT : 1);
    return [
      p[0] + (p[0] - q[0]) * o.damping + o.wind * dt * dt,
      p[1] + (p[1] - q[1]) * o.damping + g,
      (p[2] + (p[2] - q[2]) * o.damping) * DEPTH_DAMPING,
    ];
  });
  const previous = state.positions.map((p, i) => {
    if (i === 0) return o.anchor;
    return o.tipPinned && i === last ? state.previous[i] : p;
  });
  return { positions, previous };
}

function segmentWeights(i: number, last: number, tipPinned: boolean): readonly [number, number] {
  const isLastSegment = i + 1 === last;
  if (isLastSegment && tipPinned) return i === 0 ? [0, 1] : [1, 0];
  if (isLastSegment) return i === 0 ? [0, 0.2] : [0.8, 0.2];
  return i === 0 ? [0, 1] : [0.5, 0.5];
}

function relax(points: Vec3[], o: RopeOptions): void {
  const last = points.length - 1;
  for (let i = 0; i < last; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const d = Math.hypot(dx, dy, dz) || 1e-6;
    const k = (d - o.segment) / d;
    const [wa, wb] = segmentWeights(i, last, o.tipPinned);
    points[i] = [a[0] + dx * k * wa, a[1] + dy * k * wa, a[2] + dz * k * wa];
    points[i + 1] = [b[0] - dx * k * wb, b[1] - dy * k * wb, b[2] - dz * k * wb];
  }
}

export function stepRope(state: RopeState, rawDt: number, o: RopeOptions): RopeState {
  const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
  const moved = integrate(state, dt, o);
  // Local scratch array: relaxation reads the points it just rewrote, so it works on a private copy.
  const points = [...moved.positions];
  for (let k = 0; k < o.iterations; k++) relax(points, o);
  points[0] = o.anchor;
  return { positions: points, previous: moved.previous };
}

export function clampReach(anchor: Vec3, target: Vec3, maxDistance: number): Vec3 {
  const dx = target[0] - anchor[0];
  const dy = target[1] - anchor[1];
  const dz = target[2] - anchor[2];
  const distance = Math.hypot(dx, dy, dz);
  if (distance <= maxDistance) return target;
  const k = maxDistance / distance;
  return [anchor[0] + dx * k, anchor[1] + dy * k, anchor[2] + dz * k];
}

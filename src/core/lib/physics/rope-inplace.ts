import type { RopeOptions, RopeState, Vec3 } from "./rope";

// Per-frame GC: the scene steps the rope 3x per frame, so these typed arrays are mutated in place
// instead of allocating fresh tuples like the pure rope.ts API (which stays as the reference for tests).
export interface RopeBuffers {
  readonly count: number;
  readonly positions: Float64Array;
  readonly previous: Float64Array;
}

const MAX_DT = 1 / 30;
const TIP_WEIGHT = 1.4;
const DEPTH_DAMPING = 0.9;
const REST_STRETCH = 0.96;

export function createRopeBuffers(anchor: Vec3, count: number, segment: number): RopeBuffers {
  const positions = new Float64Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = anchor[0];
    positions[i * 3 + 1] = anchor[1] - i * segment * REST_STRETCH;
    positions[i * 3 + 2] = anchor[2];
  }
  return { count, positions, previous: positions.slice() };
}

export function buffersFromState(state: RopeState): RopeBuffers {
  const count = state.positions.length;
  const positions = new Float64Array(state.positions.flat());
  return { count, positions, previous: new Float64Array(state.previous.flat()) };
}

export function stateFromBuffers(buffers: RopeBuffers): RopeState {
  const read = (source: Float64Array): Vec3[] =>
    Array.from({ length: buffers.count }, (_, i): Vec3 => [source[i * 3], source[i * 3 + 1], source[i * 3 + 2]]);
  return { positions: read(buffers.positions), previous: read(buffers.previous) };
}

export function pinTipInPlace(buffers: RopeBuffers, target: Vec3): void {
  const o = (buffers.count - 1) * 3;
  const { positions, previous } = buffers;
  previous[o] = positions[o];
  previous[o + 1] = positions[o + 1];
  previous[o + 2] = positions[o + 2];
  positions[o] = target[0];
  positions[o + 1] = target[1];
  positions[o + 2] = target[2];
}

function integrate(buffers: RopeBuffers, dt: number, o: RopeOptions): void {
  const { positions: p, previous: q, count } = buffers;
  const last = count - 1;
  for (let i = 0; i < count; i++) {
    const k = i * 3;
    if (i === 0) {
      p[k] = o.anchor[0];
      p[k + 1] = o.anchor[1];
      p[k + 2] = o.anchor[2];
      q[k] = o.anchor[0];
      q[k + 1] = o.anchor[1];
      q[k + 2] = o.anchor[2];
      continue;
    }
    if (o.tipPinned && i === last) continue;
    const x = p[k];
    const y = p[k + 1];
    const z = p[k + 2];
    const g = o.gravity * dt * dt * (i === last ? TIP_WEIGHT : 1);
    p[k] = x + (x - q[k]) * o.damping + o.wind * dt * dt;
    p[k + 1] = y + (y - q[k + 1]) * o.damping + g;
    p[k + 2] = (z + (z - q[k + 2]) * o.damping) * DEPTH_DAMPING;
    q[k] = x;
    q[k + 1] = y;
    q[k + 2] = z;
  }
}

function segmentWeights(i: number, last: number, tipPinned: boolean): readonly [number, number] {
  const isLastSegment = i + 1 === last;
  if (isLastSegment && tipPinned) return i === 0 ? [0, 1] : [1, 0];
  if (isLastSegment) return i === 0 ? [0, 0.2] : [0.8, 0.2];
  return i === 0 ? [0, 1] : [0.5, 0.5];
}

function relax(p: Float64Array, count: number, o: RopeOptions): void {
  const last = count - 1;
  for (let i = 0; i < last; i++) {
    const a = i * 3;
    const b = a + 3;
    const dx = p[b] - p[a];
    const dy = p[b + 1] - p[a + 1];
    const dz = p[b + 2] - p[a + 2];
    const d = Math.hypot(dx, dy, dz) || 1e-6;
    const k = (d - o.segment) / d;
    const [wa, wb] = segmentWeights(i, last, o.tipPinned);
    const ax = p[a] + dx * k * wa;
    const ay = p[a + 1] + dy * k * wa;
    const az = p[a + 2] + dz * k * wa;
    p[b] = p[b] - dx * k * wb;
    p[b + 1] = p[b + 1] - dy * k * wb;
    p[b + 2] = p[b + 2] - dz * k * wb;
    p[a] = ax;
    p[a + 1] = ay;
    p[a + 2] = az;
  }
}

export function stepRopeInPlace(buffers: RopeBuffers, rawDt: number, o: RopeOptions): void {
  const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
  integrate(buffers, dt, o);
  for (let k = 0; k < o.iterations; k++) relax(buffers.positions, buffers.count, o);
  buffers.positions[0] = o.anchor[0];
  buffers.positions[1] = o.anchor[1];
  buffers.positions[2] = o.anchor[2];
}

// Mutates the shared rope buffers on purpose: it runs every frame and must not allocate.
export function kickInPlace(buffers: RopeBuffers, vx: number, vy: number): void {
  const { previous, count } = buffers;
  const last = count - 1;
  for (let i = 1; i < count; i++) {
    const weight = (i / last) ** 2;
    previous[i * 3] -= vx * weight;
    previous[i * 3 + 1] -= vy * weight;
  }
}

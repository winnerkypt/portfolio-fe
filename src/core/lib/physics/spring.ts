export interface SpringState {
  readonly value: number;
  readonly velocity: number;
}

export interface SpringConfig {
  readonly stiffness: number;
  readonly damping: number;
}

export interface MutableSpring {
  value: number;
  velocity: number;
}

const MAX_DT = 1 / 30;

function clampDt(dt: number): number {
  return Math.min(Math.max(dt, 0), MAX_DT);
}

export function stepSpring(state: SpringState, target: number, config: SpringConfig, rawDt: number): SpringState {
  const dt = clampDt(rawDt);
  const velocity = state.velocity + ((target - state.value) * config.stiffness - state.velocity * config.damping) * dt;
  return { value: state.value + velocity * dt, velocity };
}

// Per-frame GC: the drawer advances 5 springs for each folder every frame, so it mutates in place.
export function advanceSpring(state: MutableSpring, target: number, config: SpringConfig, rawDt: number): void {
  const dt = clampDt(rawDt);
  state.velocity += ((target - state.value) * config.stiffness - state.velocity * config.damping) * dt;
  state.value += state.velocity * dt;
}

const SETTLE_EPSILON = 0.001;

export function isSpringSettled(state: SpringState, target: number): boolean {
  return Math.abs(target - state.value) < SETTLE_EPSILON && Math.abs(state.velocity) < SETTLE_EPSILON;
}

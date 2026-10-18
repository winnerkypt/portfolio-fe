import { badgePose, flip, initialSpin, stepSpin, type Pose, type SpinState } from "./badge-pose";
import type { RopeOptions, Vec3 } from "./rope";
import { clampReach } from "./rope";
import { createRopeBuffers, kickInPlace, pinTipInPlace, stepRopeInPlace, type RopeBuffers } from "./rope-inplace";

export const ROPE_POINTS = 12;
export const SEGMENT = 0.045;
export const MAX_REACH = (ROPE_POINTS - 1) * SEGMENT * 0.98;
const SUBSTEPS = 3;
const MAX_SCROLL_SPEED = 2400;
const REFERENCE_DT = 1 / 60;
const SWAY_KICK = 0.0012;
const LAG_KICK = 0.0008;

export interface RopeSim {
  readonly buffers: RopeBuffers;
  setAnchor(anchor: Vec3): void;
  advance(dt: number, time: number): void;
  tip(): Vec3;
  pose(offsets: { clip: number; card: number }): Pose;
  spinAngle(): number;
  grab(): void;
  drag(target: Vec3): void;
  release(tapped: boolean): void;
  applyScrollImpulse(velocityPxPerSec: number, dt?: number): void;
}

function readVec(positions: ArrayLike<number>, offset: number): Vec3 {
  return [positions[offset], positions[offset + 1], positions[offset + 2]];
}

function ropeOptions(anchor: Vec3, time: number, held: boolean, reducedMotion: boolean): RopeOptions {
  return {
    anchor,
    segment: SEGMENT,
    gravity: -16,
    damping: 0.975,
    iterations: 16,
    wind: reducedMotion ? 0 : Math.sin(time * 0.7) * 0.25,
    tipPinned: held,
  };
}

function isFlipped(spin: SpinState): boolean {
  return Math.round(spin.target / Math.PI) % 2 !== 0;
}

interface SimState {
  anchor: Vec3;
  buffers: RopeBuffers;
  spin: SpinState;
  held: boolean;
  moved: boolean;
  dragDx: number;
  anchored: boolean;
}

const TIP_OFFSET = (ROPE_POINTS - 1) * 3;

function advanceState(state: SimState, dt: number, time: number, reducedMotion: boolean): void {
  const { buffers } = state;
  if (state.held && !state.moved) pinTipInPlace(buffers, readVec(buffers.positions, TIP_OFFSET));
  const ropeVx = buffers.positions[TIP_OFFSET] - buffers.previous[TIP_OFFSET];
  const swingVx = state.held ? state.dragDx : ropeVx;
  state.moved = false;
  state.dragDx = 0;
  const options = ropeOptions(state.anchor, time, state.held, reducedMotion);
  for (let i = 0; i < SUBSTEPS; i++) stepRopeInPlace(buffers, dt / SUBSTEPS, options);
  state.spin = stepSpin(state.spin, swingVx, dt, reducedMotion);
}

function dragState(state: SimState, target: Vec3): void {
  const reachable = clampReach(state.anchor, target, MAX_REACH);
  state.dragDx += reachable[0] - state.buffers.positions[TIP_OFFSET];
  pinTipInPlace(state.buffers, reachable);
  state.moved = true;
}

export function createRopeSim(reducedMotion: boolean, onFlip?: (flipped: boolean) => void): RopeSim {
  const anchor: Vec3 = [0, 0, 0];
  const state: SimState = {
    anchor,
    buffers: createRopeBuffers(anchor, ROPE_POINTS, SEGMENT),
    spin: initialSpin(reducedMotion),
    held: false,
    moved: false,
    dragDx: 0,
    anchored: false,
  };
  const tip = (): Vec3 => readVec(state.buffers.positions, TIP_OFFSET);

  return {
    get buffers() {
      return state.buffers;
    },
    setAnchor(next) {
      state.anchor = next;
      if (state.anchored) return;
      state.anchored = true;
      state.buffers = createRopeBuffers(next, ROPE_POINTS, SEGMENT);
    },
    advance: (dt, time) => advanceState(state, dt, time, reducedMotion),
    tip,
    pose: (offsets) => badgePose(tip(), readVec(state.buffers.positions, (ROPE_POINTS - 2) * 3), offsets),
    spinAngle: () => state.spin.angle,
    grab() {
      state.held = true;
    },
    drag: (target) => dragState(state, target),
    applyScrollImpulse(velocity, dt = REFERENCE_DT) {
      if (reducedMotion || state.held || !Number.isFinite(velocity) || !(dt > 0)) return;
      const speed = Math.min(1, Math.max(-1, velocity / MAX_SCROLL_SPEED));
      const scale = Math.min(2, dt / REFERENCE_DT);
      kickInPlace(state.buffers, -speed * SWAY_KICK * scale, -speed * LAG_KICK * scale);
    },
    release(tapped) {
      state.held = false;
      if (!tapped) return;
      state.spin = flip(state.spin);
      onFlip?.(isFlipped(state.spin));
    },
  };
}

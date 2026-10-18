import type { Vec3 } from "./rope";

export interface SpinState {
  readonly angle: number;
  readonly velocity: number;
  readonly target: number;
}

export interface PressPoint {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}

export interface Pose {
  readonly angleZ: number;
  readonly clip: Vec3;
  readonly card: Vec3;
}

const REFERENCE_FPS = 60;
const SWING_TO_SPIN = 0.25;
const SPRING = 0.02;
const FRICTION = 0.94;
const TAP_DISTANCE = 6;
const TAP_MS = 350;

export function initialSpin(reducedMotion: boolean): SpinState {
  return { angle: 0, velocity: reducedMotion ? 0 : 0.015, target: 0 };
}

export function flip(spin: SpinState): SpinState {
  return { ...spin, target: spin.target + Math.PI };
}

export function stepSpin(spin: SpinState, tipVelocityX: number, dt: number, reducedMotion: boolean): SpinState {
  const frames = Math.max(0, dt) * REFERENCE_FPS;
  const swing = reducedMotion ? 0 : tipVelocityX * SWING_TO_SPIN;
  const accelerated = spin.velocity + swing + (spin.target - spin.angle) * SPRING * frames;
  const velocity = accelerated * FRICTION ** frames;
  return { angle: spin.angle + velocity * frames, velocity, target: spin.target };
}

export function isTap(down: PressPoint, up: PressPoint): boolean {
  return Math.hypot(up.x - down.x, up.y - down.y) < TAP_DISTANCE && up.t - down.t < TAP_MS;
}

export function badgePose(tip: Vec3, beforeTip: Vec3, offsets: { clip: number; card: number }): Pose {
  const dx = tip[0] - beforeTip[0];
  const dy = tip[1] - beforeTip[1];
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const at = (distance: number): Vec3 => [tip[0] + ux * distance, tip[1] + uy * distance, tip[2]];
  return { angleZ: Math.atan2(ux, -uy), clip: at(offsets.clip), card: at(offsets.card) };
}

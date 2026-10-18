import type { SpringConfig } from "./physics/spring";

export const FOLDER_STEP = 2.5;
export const VISIBLE_FOLDERS = 5;
export const DRAWER_FOV = 30;

const NARROW_ASPECT = 1.5;
const NARROW_HALF_WIDTH = 2.6;
const TAN_HALF_FOV = Math.tan((DRAWER_FOV / 2) * (Math.PI / 180));
const FAN = 0.13;
const MAX_FAN_OFFSET = 3;
const DEPTH_PER_SLOT = 0.45;
const SHEET_REST_Y = 0.8;
const FOLDER_BODY_Y = 0.65;

export const CAMERA_HEIGHT = 1.9;
export const CAMERA_PARALLAX = 0.5;
export const LOOK_AT: Triple = [0, 1.15, 0.4];

export type Triple = readonly [number, number, number];
type MutableTriple = [number, number, number];

export interface Slot {
  readonly x: number;
  readonly rz: number;
}

export interface DrawerLayout {
  readonly narrow: boolean;
  readonly distance: number;
}

export interface SpringValues {
  readonly lift: number;
  readonly fwd: number;
  readonly open: number;
  readonly rise: number;
  readonly ry: number;
}

export type SpringKey = keyof SpringValues;

export const SPRING_KEYS: readonly SpringKey[] = ["lift", "fwd", "open", "rise", "ry"];

export const DRAWER_SPRINGS: Readonly<Record<SpringKey, SpringConfig>> = {
  lift: { stiffness: 170, damping: 13 },
  fwd: { stiffness: 90, damping: 12 },
  open: { stiffness: 120, damping: 11 },
  rise: { stiffness: 110, damping: 10 },
  ry: { stiffness: 80, damping: 12 },
};

export interface FolderPose {
  readonly position: Triple;
  readonly rotation: Triple;
  readonly scale: number;
  readonly hingeX: number;
  readonly sheetY: number;
  readonly sheetRz: number;
}

export interface PoseInput {
  readonly index: number;
  readonly base: Slot;
  readonly rowX: number;
  readonly springs: SpringValues;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly pointerX: number;
  readonly time: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const side = (index: number): number => (index % 2 ? 1 : -1);

export function baseSlot(index: number, count: number): Slot {
  return { x: (index - (count - 1) / 2) * FOLDER_STEP, rz: side(index) * 0.015 };
}

export function drawerLayout(count: number, aspect: number): DrawerLayout {
  const narrow = aspect < NARROW_ASPECT;
  const halfWidth = narrow ? NARROW_HALF_WIDTH : (Math.min(count, VISIBLE_FOLDERS) * FOLDER_STEP) / 2 - 0.2;
  return { narrow, distance: Math.max(narrow ? 6.2 : 7.4, halfWidth / (TAN_HALF_FOV * aspect)) };
}

export function rowTarget(selected: number, count: number, narrow: boolean): number {
  const middle = (count - 1) / 2;
  const reach = (VISIBLE_FOLDERS - 1) / 2;
  const centre = narrow ? selected : count > VISIBLE_FOLDERS ? clamp(selected, reach, count - 1 - reach) : middle;
  return (middle - centre) * FOLDER_STEP;
}

export function isFolderVisible(offset: number, narrow: boolean): boolean {
  return Math.abs(offset) < (narrow ? 3 : VISIBLE_FOLDERS / 2 + 1.5);
}

export function springTargetsInto(out: { -readonly [K in SpringKey]: number }, selected: boolean, hovered: boolean, offset: number): void {
  const peek = hovered && !selected;
  out.lift = selected ? 0.1 : peek ? 0.22 : 0;
  out.fwd = selected ? 1.2 : 0;
  out.open = selected ? 1.25 : peek ? 0.3 : 0;
  out.rise = selected ? 0.85 : peek ? 0.2 : 0;
  out.ry = selected ? 0 : 0 - clamp(offset, -MAX_FAN_OFFSET, MAX_FAN_OFFSET) * FAN;
}

export function springTargets(selected: boolean, hovered: boolean, offset: number): SpringValues {
  const out = { lift: 0, fwd: 0, open: 0, rise: 0, ry: 0 };
  springTargetsInto(out, selected, hovered, offset);
  return out;
}

export interface MutablePose {
  readonly position: MutableTriple;
  readonly rotation: MutableTriple;
  scale: number;
  hingeX: number;
  sheetY: number;
  sheetRz: number;
}

export interface MutablePoseInput {
  index: number;
  base: Slot;
  rowX: number;
  readonly springs: { -readonly [K in SpringKey]: number };
  selected: boolean;
  hovered: boolean;
  pointerX: number;
  time: number;
}

export function createPose(): MutablePose {
  return { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, hingeX: 0, sheetY: 0, sheetRz: 0 };
}

export function createPoseInput(): MutablePoseInput {
  return {
    index: 0,
    base: { x: 0, rz: 0 },
    rowX: 0,
    springs: { lift: 0, fwd: 0, open: 0, rise: 0, ry: 0 },
    selected: false,
    hovered: false,
    pointerX: 0,
    time: 0,
  };
}

export function folderPoseInto(out: MutablePose, input: PoseInput): void {
  const { index, base, rowX, springs, selected, pointerX, time } = input;
  const hovered = input.hovered && !selected;
  const shifted = base.x + rowX;
  const offset = shifted / FOLDER_STEP;
  const breathe = Math.sin(time * 1.3 + index * 1.7);
  const sway = Math.sin(time * 0.9 + index * 2.3);
  const depth = -Math.min(Math.abs(offset), MAX_FAN_OFFSET) * DEPTH_PER_SLOT;
  out.position[0] = base.x - shifted * springs.fwd * 0.3;
  out.position[1] = springs.lift + breathe * 0.025;
  out.position[2] = depth + springs.fwd;
  out.rotation[0] = sway * 0.012;
  out.rotation[1] = springs.ry + (hovered ? pointerX * 0.08 : 0);
  out.rotation[2] = (selected ? 0 : base.rz) + sway * 0.012 - (hovered ? 0.03 : 0);
  out.scale = 1 + springs.fwd * 0.05;
  out.hingeX = springs.open + (selected ? Math.sin(time * 1.6) * 0.04 : 0);
  out.sheetY = SHEET_REST_Y + springs.rise + (selected ? breathe * 0.03 : 0);
  out.sheetRz = side(index) * springs.rise * 0.05 + (selected ? sway * 0.015 : 0);
}

export function folderPose(input: PoseInput): FolderPose {
  const out = createPose();
  folderPoseInto(out, input);
  return out;
}

export function folderRestPoint(index: number, selected: number, count: number, narrow: boolean): Triple {
  const x = baseSlot(index, count).x + rowTarget(selected, count, narrow);
  const depth = -Math.min(Math.abs(x / FOLDER_STEP), MAX_FAN_OFFSET) * DEPTH_PER_SLOT;
  return [x, FOLDER_BODY_Y, depth];
}

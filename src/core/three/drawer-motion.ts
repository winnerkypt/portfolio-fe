import { PerspectiveCamera, Vector3, type Group } from "three";
import {
  CAMERA_HEIGHT,
  CAMERA_PARALLAX,
  DRAWER_SPRINGS,
  FOLDER_STEP,
  LOOK_AT,
  SPRING_KEYS,
  baseSlot,
  createPose,
  createPoseInput,
  drawerLayout,
  folderPoseInto,
  isFolderVisible,
  rowTarget,
  springTargetsInto,
  type DrawerLayout,
  type MutablePose,
  type MutablePoseInput,
  type Slot,
  type SpringKey,
} from "@/core/lib/drawer-layout";
import { advanceSpring, isSpringSettled, type MutableSpring } from "@/core/lib/physics/spring";
import type { Folder } from "./folder-mesh";

export interface DrawerMotion {
  setSelected(index: number): void;
  setHover(index: number): void;
  setPointerX(x: number): void;
  resize(aspect: number): void;
  step(dt: number, seconds: number): void;
  isIdle(): boolean;
}

type FolderSprings = Record<SpringKey, MutableSpring>;
type Targets = { -readonly [K in SpringKey]: number };

// Mutable on purpose: stepped every frame, so nothing here may be reallocated while animating.
interface Rig {
  readonly folders: readonly Folder[];
  readonly slots: readonly Slot[];
  readonly springs: readonly FolderSprings[];
  readonly input: MutablePoseInput;
  readonly pose: MutablePose;
  readonly targets: Targets;
  selected: number;
  hovered: number;
  pointerX: number;
  rowX: number;
  layout: DrawerLayout;
  snap: boolean;
  settled: boolean;
}

const LOOK_AT_POINT = new Vector3(...LOOK_AT);
const ROW_EASE = 0.0015;

function rest(): MutableSpring {
  return { value: 0, velocity: 0 };
}

function restingSprings(): FolderSprings {
  return { lift: rest(), fwd: rest(), open: rest(), rise: rest(), ry: rest() };
}

function createRig(folders: readonly Folder[], initial: number): Rig {
  const count = folders.length;
  return {
    folders,
    slots: folders.map((_, i) => baseSlot(i, count)),
    springs: folders.map(restingSprings),
    input: createPoseInput(),
    pose: createPose(),
    targets: { lift: 0, fwd: 0, open: 0, rise: 0, ry: 0 },
    selected: initial,
    hovered: -1,
    pointerX: 0,
    rowX: 0,
    layout: drawerLayout(count, 4),
    snap: true,
    settled: false,
  };
}

function offsetOf(rig: Rig, index: number): number {
  return (rig.slots[index].x + rig.rowX) / FOLDER_STEP;
}

function drive(rig: Rig, index: number, dt: number): void {
  springTargetsInto(rig.targets, index === rig.selected, index === rig.hovered, offsetOf(rig, index));
  for (const key of SPRING_KEYS) {
    const spring = rig.springs[index][key];
    if (rig.snap) {
      spring.value = rig.targets[key];
      spring.velocity = 0;
    } else {
      advanceSpring(spring, rig.targets[key], DRAWER_SPRINGS[key], dt);
    }
    if (!isSpringSettled(spring, rig.targets[key])) rig.settled = false;
  }
}

function fillInput(rig: Rig, index: number, seconds: number): void {
  const { input } = rig;
  const values = rig.springs[index];
  input.index = index;
  input.base = rig.slots[index];
  input.rowX = rig.rowX;
  input.selected = index === rig.selected;
  input.hovered = index === rig.hovered;
  input.pointerX = rig.pointerX;
  input.time = seconds;
  for (const key of SPRING_KEYS) input.springs[key] = values[key].value;
}

function place(rig: Rig, index: number, seconds: number): void {
  const { group, hinge, sheet } = rig.folders[index];
  const { pose } = rig;
  fillInput(rig, index, seconds);
  folderPoseInto(pose, rig.input);
  group.visible = isFolderVisible(offsetOf(rig, index), rig.layout.narrow);
  group.position.set(pose.position[0], pose.position[1], pose.position[2]);
  group.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
  group.scale.setScalar(pose.scale);
  hinge.rotation.x = pose.hingeX;
  sheet.position.y = pose.sheetY;
  sheet.rotation.z = pose.sheetRz;
}

function advanceRow(rig: Rig, dt: number): void {
  const target = rowTarget(rig.selected, rig.folders.length, rig.layout.narrow);
  rig.rowX = rig.snap ? target : rig.rowX + (target - rig.rowX) * (1 - Math.pow(ROW_EASE, dt));
  if (Math.abs(target - rig.rowX) >= 0.001) rig.settled = false;
}

function stepRig(rig: Rig, row: Group, camera: PerspectiveCamera, dt: number, seconds: number): void {
  rig.settled = true;
  advanceRow(rig, dt);
  for (let i = 0; i < rig.folders.length; i++) {
    drive(rig, i, dt);
    place(rig, i, seconds);
  }
  rig.snap = false;
  row.position.x = rig.rowX;
  camera.position.set(rig.pointerX * CAMERA_PARALLAX, CAMERA_HEIGHT, rig.layout.distance);
  camera.lookAt(LOOK_AT_POINT);
}

export function createDrawerMotion(folders: readonly Folder[], row: Group, camera: PerspectiveCamera, initial: number): DrawerMotion {
  const rig = createRig(folders, initial);
  return {
    setSelected: (index) => {
      rig.selected = index;
      rig.settled = false;
    },
    setHover: (index) => {
      rig.hovered = index;
      rig.settled = false;
    },
    setPointerX: (x) => {
      rig.pointerX = x;
    },
    resize: (aspect) => {
      rig.layout = drawerLayout(folders.length, aspect);
    },
    step: (dt, seconds) => stepRig(rig, row, camera, dt, seconds),
    isIdle: () => rig.settled && rig.hovered < 0 && rig.pointerX === 0,
  };
}

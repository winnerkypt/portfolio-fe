import { describe, expect, it } from "vitest";
import { Group, Mesh, PerspectiveCamera } from "three";
import { baseSlot, createPose, createPoseInput, folderPoseInto } from "@/core/lib/drawer-layout";
import { createDrawerMotion } from "./drawer-motion";
import type { Folder } from "./folder-mesh";

function stubFolder(): Folder {
  return { group: new Group(), hinge: new Group(), sheet: new Mesh(), pickables: [], redraw: () => undefined };
}

function setup(count = 5, initial = 0) {
  const folders = Array.from({ length: count }, stubFolder);
  const row = new Group();
  const camera = new PerspectiveCamera(30, 3.7, 0.1, 100);
  const motion = createDrawerMotion(folders, row, camera, initial);
  motion.resize(3.7);
  return { folders, row, camera, motion };
}

function settle(motion: ReturnType<typeof setup>["motion"], seconds = 6): void {
  for (let t = 0; t < seconds * 60; t++) motion.step(1 / 60, 10 + t / 60);
}

describe("createDrawerMotion", () => {
  it("is idle after the first snap frame", () => {
    const { motion } = setup();

    motion.step(0, 0);

    expect(motion.isIdle()).toBe(true);
  });

  it("is active while a folder is hovered or the pointer is over the stage", () => {
    const { motion } = setup();
    motion.step(0, 0);

    motion.setHover(1);
    expect(motion.isIdle()).toBe(false);
    motion.setHover(-1);
    motion.setPointerX(0.3);
    expect(motion.isIdle()).toBe(false);
  });

  it("is active while springs travel to a new selection and idle once they settle", () => {
    const { motion } = setup();
    motion.step(0, 0);

    motion.setSelected(3);
    motion.step(1 / 60, 0.1);
    expect(motion.isIdle()).toBe(false);

    settle(motion);
    expect(motion.isIdle()).toBe(true);
  });

  it("returns to idle after hover ends and the peek spring settles", () => {
    const { motion } = setup();
    motion.step(0, 0);
    motion.setHover(2);
    settle(motion, 1);
    motion.setHover(-1);
    motion.step(1 / 60, 20);
    expect(motion.isIdle()).toBe(false);

    settle(motion);

    expect(motion.isIdle()).toBe(true);
  });

  it("writes the pose from the pure layout into each folder", () => {
    const { motion, folders } = setup();

    motion.step(0, 1.25);

    const expected = createPose();
    const input = createPoseInput();
    Object.assign(input, { index: 0, base: baseSlot(0, 5), selected: true, time: 1.25 });
    Object.assign(input.springs, { lift: 0.1, fwd: 1.2, open: 1.25, rise: 0.85, ry: 0 });
    folderPoseInto(expected, input);
    const { group } = folders[0];
    expect(group.position.x).toBeCloseTo(expected.position[0], 5);
    expect(group.position.y).toBeCloseTo(expected.position[1], 5);
    expect(group.position.z).toBeCloseTo(expected.position[2], 5);
    expect(group.scale.x).toBeCloseTo(expected.scale, 5);
    expect(folders[0].hinge.rotation.x).toBeCloseTo(expected.hingeX, 5);
  });

  it("hides folders far from the middle of a long row", () => {
    const { motion, folders } = setup(9, 0);

    motion.step(0, 0);

    expect(folders[0].group.visible).toBe(true);
    expect(folders[8].group.visible).toBe(false);
  });
});

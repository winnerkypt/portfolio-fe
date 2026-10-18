import { describe, expect, it } from "vitest";
import {
  FOLDER_STEP,
  baseSlot,
  drawerLayout,
  createPose,
  createPoseInput,
  folderPose,
  folderPoseInto,
  folderRestPoint,
  isFolderVisible,
  rowTarget,
  springTargets,
  springTargetsInto,
  type SpringValues,
} from "./drawer-layout";

const rest: SpringValues = { lift: 0, fwd: 0, open: 0, rise: 0, ry: 0 };

describe("baseSlot", () => {
  it("spreads folders symmetrically around the middle", () => {
    const slots = [0, 1, 2, 3, 4].map((i) => baseSlot(i, 5));

    expect(slots[2].x).toBe(0);
    expect(slots[0].x).toBe(-2 * FOLDER_STEP);
    expect(slots[4].x).toBe(2 * FOLDER_STEP);
  });

  it("alternates the resting tilt", () => {
    expect(Math.sign(baseSlot(0, 5).rz)).toBe(-Math.sign(baseSlot(1, 5).rz));
  });
});

describe("drawerLayout", () => {
  it("is wide on desktop aspects and narrow on tall ones", () => {
    expect(drawerLayout(5, 3.7).narrow).toBe(false);
    expect(drawerLayout(5, 1.1).narrow).toBe(true);
  });

  it("backs the camera off for narrower stages but never closer than the minimum", () => {
    expect(drawerLayout(5, 3.7).distance).toBeCloseTo(7.4, 5);
    expect(drawerLayout(5, 1.6).distance).toBeGreaterThan(drawerLayout(5, 3.7).distance);
    expect(drawerLayout(5, 1.1).distance).toBeGreaterThanOrEqual(6.2);
  });
});

describe("rowTarget", () => {
  it("keeps a short row centred whatever is selected", () => {
    expect(rowTarget(0, 5, false)).toBe(0);
    expect(rowTarget(4, 5, false)).toBe(0);
  });

  it("brings the selected folder to the middle on narrow stages", () => {
    expect(rowTarget(0, 5, true)).toBe(2 * FOLDER_STEP);
    expect(rowTarget(3, 5, true)).toBe(-FOLDER_STEP);
  });

  it("scrolls long rows and clamps at the ends", () => {
    expect(rowTarget(0, 9, false)).toBe(-rowTarget(8, 9, false));
    expect(rowTarget(4, 9, false)).toBe(0);
    expect(rowTarget(0, 9, false)).toBe(2 * FOLDER_STEP);
  });
});

describe("isFolderVisible", () => {
  it("hides folders far from the middle, fewer on narrow stages", () => {
    expect(isFolderVisible(2, false)).toBe(true);
    expect(isFolderVisible(4.2, false)).toBe(false);
    expect(isFolderVisible(2, true)).toBe(true);
    expect(isFolderVisible(3.2, true)).toBe(false);
  });
});

describe("springTargets", () => {
  it("rests when idle and fans away from the middle", () => {
    expect(springTargets(false, false, 0)).toEqual({ lift: 0, fwd: 0, open: 0, rise: 0, ry: 0 });
    expect(springTargets(false, false, 2).ry).toBeLessThan(0);
    expect(springTargets(false, false, -2).ry).toBeGreaterThan(0);
  });

  it("lifts, opens and raises the sheet for the selected folder", () => {
    const t = springTargets(true, false, 0);

    expect(t).toMatchObject({ lift: 0.1, fwd: 1.2, open: 1.25, rise: 0.85 });
  });

  it("peeks for a hovered folder, less than selected", () => {
    const t = springTargets(false, true, 1);

    expect(t.open).toBeGreaterThan(0);
    expect(t.open).toBeLessThan(springTargets(true, false, 0).open);
  });

  it("clamps the fan angle", () => {
    expect(springTargets(false, false, 10).ry).toBe(springTargets(false, false, 3).ry);
  });
});

describe("folderPose", () => {
  const input = { index: 2, base: baseSlot(2, 5), rowX: 0, springs: rest, selected: false, hovered: false, pointerX: 0, time: 0 };

  it("places an idle middle folder at its slot", () => {
    const pose = folderPose(input);

    expect(pose.position[0]).toBeCloseTo(0);
    expect(pose.scale).toBe(1);
  });

  it("pushes the selected folder forward and grows it", () => {
    const pose = folderPose({ ...input, selected: true, springs: { ...rest, fwd: 1.2, open: 1.25, rise: 0.85 } });

    expect(pose.position[2]).toBeGreaterThan(1);
    expect(pose.scale).toBeCloseTo(1.06);
    expect(pose.hingeX).toBeCloseTo(1.25, 1);
    expect(pose.sheetY).toBeGreaterThan(1.5);
  });

  it("recedes folders that are off to the side", () => {
    const near = folderPose({ ...input, base: baseSlot(2, 5) });
    const far = folderPose({ ...input, index: 0, base: baseSlot(0, 5) });

    expect(far.position[2]).toBeLessThan(near.position[2]);
  });

  it("leans a hovered folder toward the pointer", () => {
    const pose = folderPose({ ...input, hovered: true, pointerX: 1 });

    expect(pose.rotation[1]).toBeCloseTo(0.08);
  });
});

describe("folderPoseInto", () => {
  const cases = [
    { index: 0, selected: false, hovered: false, pointerX: 0, time: 0, rowX: 0 },
    { index: 1, selected: true, hovered: false, pointerX: 0.4, time: 3.7, rowX: 2.5 },
    { index: 3, selected: false, hovered: true, pointerX: -0.8, time: 12.2, rowX: -5 },
    { index: 4, selected: true, hovered: true, pointerX: 1, time: 0.3, rowX: 1.1 },
  ];

  it.each(cases)("matches the pure folderPose for %j", (c) => {
    const springs = { lift: 0.1, fwd: 0.7, open: 0.4, rise: 0.3, ry: -0.2 };
    const pure = folderPose({ ...c, base: baseSlot(c.index, 5), springs });
    const input = createPoseInput();
    const out = createPose();
    Object.assign(input, { ...c, base: baseSlot(c.index, 5) });
    Object.assign(input.springs, springs);

    folderPoseInto(out, input);

    expect(out).toEqual(pure);
  });

  it("overwrites a previously used output completely", () => {
    const input = createPoseInput();
    const out = createPose();
    Object.assign(input, { index: 2, base: baseSlot(2, 5) });
    folderPoseInto(out, input);
    const first = structuredClone(out);
    Object.assign(input, { index: 0, base: baseSlot(0, 5), selected: true });
    folderPoseInto(out, input);

    expect(out).not.toEqual(first);
    expect(out).toEqual(folderPose({ ...input, springs: { ...input.springs } }));
  });

  it("reuses the same position and rotation arrays", () => {
    const input = createPoseInput();
    const out = createPose();
    const { position, rotation } = out;
    folderPoseInto(out, input);

    expect(out.position).toBe(position);
    expect(out.rotation).toBe(rotation);
  });
});

describe("springTargetsInto", () => {
  it.each([
    [true, false, 0],
    [false, true, 1],
    [false, false, -4],
    [true, true, 2],
  ])("matches springTargets(%s, %s, %s)", (selected, hovered, offset) => {
    const out = { lift: 9, fwd: 9, open: 9, rise: 9, ry: 9 };

    springTargetsInto(out, selected, hovered, offset);

    expect(out).toEqual(springTargets(selected, hovered, offset));
  });
});

describe("folderRestPoint", () => {
  it("puts the selected-row middle folder at the centre of the row", () => {
    expect(folderRestPoint(2, 0, 5, false)[0]).toBeCloseTo(0);
  });

  it("shifts with the row on narrow stages and recedes with distance from the middle", () => {
    const [x] = folderRestPoint(3, 3, 5, true);
    const [, , farZ] = folderRestPoint(0, 3, 5, true);
    const [, , nearZ] = folderRestPoint(3, 3, 5, true);

    expect(x).toBeCloseTo(0);
    expect(farZ).toBeLessThan(nearZ);
  });
});

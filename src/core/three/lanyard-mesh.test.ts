import { describe, expect, it } from "vitest";
import { Texture } from "three";
import { createLanyard } from "./lanyard-mesh";

function rope(sway: number): Float64Array {
  const out = new Float64Array(12 * 3);
  for (let i = 0; i < 12; i++) {
    out[i * 3] = Math.sin(i * 0.3) * sway;
    out[i * 3 + 1] = 2 - i * 0.045;
  }
  return out;
}

describe("createLanyard", () => {
  it("writes a ribbon of constant width along the rope", () => {
    const lanyard = createLanyard(new Texture());

    lanyard.update(0, 2.02, rope(0.1));

    const position = lanyard.mesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i += 2) {
      const dx = position.getX(i + 1) - position.getX(i);
      const dy = position.getY(i + 1) - position.getY(i);
      expect(Math.hypot(dx, dy)).toBeCloseTo(0.17, 3);
    }
  });

  it("reuses its buffers and curve across updates", () => {
    const lanyard = createLanyard(new Texture());
    const geometry = lanyard.mesh.geometry;
    const array = geometry.attributes.position.array;
    lanyard.update(0, 2.02, rope(0.1));
    const first = Array.from(array.slice(0, 12));

    lanyard.update(0, 2.02, rope(0.4));

    expect(geometry.attributes.position.array).toBe(array);
    expect(Array.from(array.slice(0, 12))).not.toEqual(first);
    expect(Array.from(array).every(Number.isFinite)).toBe(true);
  });

  it("uses a constant facing normal and increasing uvs", () => {
    const lanyard = createLanyard(new Texture());
    lanyard.update(0, 2.02, rope(0.1));

    const { normal, uv } = lanyard.mesh.geometry.attributes;

    expect(normal.getZ(0)).toBe(1);
    expect(uv.getX(uv.count - 1)).toBeGreaterThan(uv.getX(0));
  });
});

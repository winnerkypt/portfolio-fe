import { afterEach, describe, expect, it, vi } from "vitest";
import type { MeshBasicMaterial } from "three";
import { createSheet } from "./sheet-mesh";

const fonts = { body: "Body", display: "Display" };
const project = { link: "https://example.com" } as Parameters<typeof createSheet>[0];

afterEach(() => vi.unstubAllGlobals());

function textureSize(coarse: boolean): { width: number; height: number } {
  vi.stubGlobal("matchMedia", () => ({ matches: coarse }));
  const sheet = createSheet(project, null, fonts, 1);
  const image = (sheet.mesh.material as MeshBasicMaterial).map?.image as HTMLCanvasElement;
  return { width: image.width, height: image.height };
}

describe("createSheet", () => {
  it("paints a full-size canvas on fine pointers", () => {
    expect(textureSize(false)).toEqual({ width: 1280, height: 800 });
  });

  it("paints a half-size canvas on coarse pointers", () => {
    expect(textureSize(true)).toEqual({ width: 640, height: 400 });
  });
});

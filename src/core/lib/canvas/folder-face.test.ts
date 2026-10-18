import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasFonts } from "./fonts";
import {
  BACK_SIZE,
  FRONT_SIZE,
  TAB_SIZE,
  drawFolderBack,
  drawFolderFront,
  drawFolderTab,
  folderLook,
  FOLDER_LOOKS,
} from "./folder-face";
import { palette } from "./primitives";

const fonts: CanvasFonts = { body: "TestBody", display: "TestDisplay" };

function context(size: { width: number; height: number }): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  return canvas.getContext("2d") as CanvasRenderingContext2D;
}

function spyText(ctx: CanvasRenderingContext2D): { text: string; font: string; fill: string }[] {
  const calls: { text: string; font: string; fill: string }[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((text: string) => {
    calls.push({ text, font: ctx.font, fill: String(ctx.fillStyle) });
  });
  return calls;
}

describe("folderLook", () => {
  it("cycles the palette for any index and uses site colours", () => {
    expect(folderLook(0)).toBe(FOLDER_LOOKS[0]);
    expect(folderLook(FOLDER_LOOKS.length)).toBe(FOLDER_LOOKS[0]);
    expect(folderLook(0).color).toBe(palette.brown);
    expect(folderLook(1).color).toBe(palette.pink);
  });
});

describe("drawFolderFront", () => {
  let ctx: CanvasRenderingContext2D;
  let texts: ReturnType<typeof spyText>;

  beforeEach(() => {
    ctx = context(FRONT_SIZE);
    texts = spyText(ctx);
  });

  it("prints the padded case label in the display font", () => {
    drawFolderFront(ctx, FRONT_SIZE, folderLook(2), 2, 5, fonts);

    expect(texts).toHaveLength(1);
    expect(texts[0].text).toBe("03 / 05");
    expect(texts[0].font).toContain("TestDisplay");
  });

  it("colours the label with the look ink, falling back to the body colour", () => {
    drawFolderFront(ctx, FRONT_SIZE, folderLook(1), 1, 5, fonts);
    drawFolderFront(ctx, FRONT_SIZE, folderLook(2), 2, 5, fonts);

    expect(texts[0].fill).toBe(palette.rose);
    expect(texts[1].fill).toBe(palette.moss);
  });

  it("fills the body with the look colour", () => {
    const fills: string[] = [];
    vi.spyOn(ctx, "fillRect").mockImplementation(() => {
      fills.push(String(ctx.fillStyle));
    });

    drawFolderFront(ctx, FRONT_SIZE, folderLook(0), 0, 5, fonts);

    expect(fills[0]).toBe(palette.brown);
  });
});

describe("drawFolderBack", () => {
  it("draws only the shaded body, no text", () => {
    const ctx = context(BACK_SIZE);
    const texts = spyText(ctx);
    const shades: string[] = [];
    vi.spyOn(ctx, "fillRect").mockImplementation(() => {
      shades.push(String(ctx.fillStyle));
    });

    drawFolderBack(ctx, BACK_SIZE, folderLook(0));

    expect(texts).toEqual([]);
    expect(shades).toContain("rgba(0, 0, 0, 0.12)");
  });
});

describe("drawFolderTab", () => {
  it("prints the project tab text in bold body font", () => {
    const ctx = context(TAB_SIZE);
    const texts = spyText(ctx);

    drawFolderTab(ctx, TAB_SIZE, folderLook(3), "Systems", fonts);

    expect(texts).toHaveLength(1);
    expect(texts[0].text).toBe("Systems");
    expect(texts[0].font).toContain("700");
    expect(texts[0].font).toContain("TestBody");
    expect(texts[0].fill).toBe(palette.ink);
  });
});

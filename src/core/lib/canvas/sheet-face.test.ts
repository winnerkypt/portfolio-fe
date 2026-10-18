import { describe, expect, it, vi } from "vitest";
import type { CanvasFonts } from "./fonts";
import { SHEET_SIZE, drawSheet } from "./sheet-face";

const fonts: CanvasFonts = { body: "TestBody", display: "TestDisplay" };

function context(): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = SHEET_SIZE.width;
  canvas.height = SHEET_SIZE.height;
  return canvas.getContext("2d") as CanvasRenderingContext2D;
}

function image(width: number, height: number): HTMLImageElement {
  const img = document.createElement("img");
  Object.defineProperty(img, "width", { value: width });
  Object.defineProperty(img, "height", { value: height });
  return img;
}

describe("drawSheet", () => {
  it("prints the site host in the browser bar", () => {
    const ctx = context();
    const spy = vi.spyOn(ctx, "fillText");

    drawSheet(ctx, "https://www.edu.chula.ac.th/th", null, fonts);

    expect(spy).toHaveBeenCalledWith("edu.chula.ac.th", expect.any(Number), expect.any(Number));
  });

  it("draws the screenshot cropped to the content area", () => {
    const ctx = context();
    const spy = vi.spyOn(ctx, "drawImage");
    const shot = image(2880, 1800);

    drawSheet(ctx, "https://example.com", shot, fonts);

    expect(spy).toHaveBeenCalledTimes(1);
    const [img, sx, sy, sw, sh] = spy.mock.calls[0] as unknown as number[];
    expect(img).toBe(shot);
    expect(sx).toBeGreaterThanOrEqual(0);
    expect(sy).toBe(0);
    expect(sx + sw).toBeLessThanOrEqual(2880);
    expect(sh).toBeLessThanOrEqual(1800);
  });

  it("still draws a frame without a screenshot", () => {
    const ctx = context();
    const spy = vi.spyOn(ctx, "drawImage");

    expect(() => drawSheet(ctx, "not a url", null, fonts)).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });

  it("scales the 1280x800 layout down to a smaller canvas and restores the transform", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const scale = vi.spyOn(ctx, "scale");
    const restore = vi.spyOn(ctx, "restore");

    drawSheet(ctx, "https://example.com", null, fonts);

    expect(scale).toHaveBeenCalledWith(0.5, 0.5);
    expect(restore.mock.calls.length).toBeGreaterThan(0);
  });

  it("does not rescale a full-size canvas", () => {
    const ctx = context();
    const scale = vi.spyOn(ctx, "scale");

    drawSheet(ctx, "https://example.com", null, fonts);

    expect(scale).not.toHaveBeenCalled();
  });
});

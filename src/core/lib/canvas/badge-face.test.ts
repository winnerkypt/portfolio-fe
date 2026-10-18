import { beforeEach, describe, expect, it, vi } from "vitest";
import { contactLines } from "@/core/data/contacts";
import { profile } from "@/core/data/profile";
import { createBadgeData } from "./badge-data";
import { drawBadgeBack, drawBadgeFront } from "./badge-face";
import type { CanvasFonts } from "./fonts";

const fonts: CanvasFonts = { body: "TestBody", display: "TestDisplay" };
const data = createBadgeData(profile, contactLines);

interface TextCall {
  text: string;
  font: string;
}

function makeCtx(): { ctx: CanvasRenderingContext2D; texts: TextCall[] } {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 760;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const texts: TextCall[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((text: string) => {
    texts.push({ text, font: ctx.font });
  });
  return { ctx, texts };
}

describe("drawBadgeFront", () => {
  let ctx: CanvasRenderingContext2D;
  let texts: TextCall[];

  beforeEach(() => {
    ({ ctx, texts } = makeCtx());
  });

  it("draws the name and role lines with the given font families", () => {
    drawBadgeFront(ctx, data, fonts, { photo: null });

    const name = texts.find((t) => t.text === profile.fullName);
    const title = texts.find((t) => t.text === "SOFTWARE");
    expect(name?.font).toContain("TestBody");
    expect(title?.font).toContain("TestDisplay");
    expect(texts.map((t) => t.text)).toEqual(
      expect.arrayContaining(["ENGINEER", "PORTFOLIO", "Bangkok, TH", "Open to work", "github.com/winnerkypt"]),
    );
  });

  it("does not throw without a photo and fills a placeholder instead", () => {
    const draw = vi.spyOn(ctx, "drawImage");

    expect(() => drawBadgeFront(ctx, data, fonts, { photo: null })).not.toThrow();
    expect(draw).not.toHaveBeenCalled();
  });

  it("draws the photo when one is supplied", () => {
    const photo = Object.assign(document.createElement("canvas"), { naturalWidth: 560, naturalHeight: 499 }) as unknown as HTMLImageElement;
    const draw = vi.spyOn(ctx, "drawImage");

    drawBadgeFront(ctx, data, fonts, { photo });

    expect(draw).toHaveBeenCalledTimes(1);
  });

  it("crops the photo proportionally so any source resolution frames the same area", () => {
    const small = Object.assign(document.createElement("canvas"), { naturalWidth: 560, naturalHeight: 499 }) as unknown as HTMLImageElement;
    const large = Object.assign(document.createElement("canvas"), { naturalWidth: 2520, naturalHeight: 2248 }) as unknown as HTMLImageElement;
    const draw = vi.spyOn(ctx, "drawImage");

    drawBadgeFront(ctx, data, fonts, { photo: small });
    drawBadgeFront(ctx, data, fonts, { photo: large });

    const [, sx1, sy1, sw1] = draw.mock.calls[0] as unknown as number[];
    const [, sx2, sy2, sw2] = draw.mock.calls[1] as unknown as number[];
    expect(sx1).toBeCloseTo(132);
    expect(sy1).toBeCloseTo(8);
    expect(sw1).toBeCloseTo(397);
    expect(sx2 / 2520).toBeCloseTo(sx1 / 560);
    expect(sy2 / 2248).toBeCloseTo(sy1 / 499, 2);
    expect(sw2 / 2520).toBeCloseTo(sw1 / 560);
  });

  it("clears no state: leaves the context balanced", () => {
    const save = vi.spyOn(ctx, "save");
    const restore = vi.spyOn(ctx, "restore");

    drawBadgeFront(ctx, data, fonts, { photo: null });

    expect(save.mock.calls.length).toBe(restore.mock.calls.length);
  });
});

describe("drawBadgeBack", () => {
  it("draws the looking-for headline, contact lines and stack chips", () => {
    const { ctx, texts } = makeCtx();

    drawBadgeBack(ctx, data, fonts);

    const all = texts.map((t) => t.text);
    expect(all).toEqual(
      expect.arrayContaining(["FULL STACK", "ENGINEER ROLE", "kanyapat.witta@gmail.com", "090-595-3589", "Next.js", "Spring Boot", "THANK", "YOU!"]),
    );
    expect(texts.find((t) => t.text === "FULL STACK")?.font).toContain("TestDisplay");
    expect(texts.find((t) => t.text === "090-595-3589")?.font).toContain("TestBody");
  });

  it("wraps stack chips onto a new row when they overflow the card", () => {
    const { ctx, texts } = makeCtx();
    const long = { ...data, back: { ...data.back, stack: ["Next.js", "Golang", "Laravel", "Spring Boot", "PostgreSQL", "Docker"] } };

    drawBadgeBack(ctx, long, fonts);

    expect(texts.map((t) => t.text)).toContain("Docker");
  });
});

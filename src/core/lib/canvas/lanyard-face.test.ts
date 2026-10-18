import { describe, expect, it, vi } from "vitest";
import { contactLines } from "@/core/data/contacts";
import { profile } from "@/core/data/profile";
import { createBadgeData } from "./badge-data";
import type { CanvasFonts } from "./fonts";
import { drawLanyard } from "./lanyard-face";

const fonts: CanvasFonts = { body: "Body", display: "TestDisplay" };

describe("drawLanyard", () => {
  it("prints both words in the display font", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const calls: { text: string; font: string }[] = [];
    vi.spyOn(ctx, "fillText").mockImplementation((text: string) => {
      calls.push({ text, font: ctx.font });
    });

    drawLanyard(ctx, createBadgeData(profile, contactLines), fonts);

    expect(calls.map((c) => c.text)).toEqual(["KANYAPAT", "PORTFOLIO"]);
    expect(calls.every((c) => c.font.includes("TestDisplay"))).toBe(true);
  });
});

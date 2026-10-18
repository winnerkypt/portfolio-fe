import { describe, expect, it } from "vitest";
import { optimizedSrc } from "./optimized-src";

describe("optimizedSrc", () => {
  it("returns the next/image url sized for a 2x display of the given width", () => {
    const url = optimizedSrc("/images/sample.png", { width: 375, height: 335, quality: 80 });

    expect(url).toBe("/_next/image?url=%2Fimages%2Fsample.png&w=750&q=80");
  });

  it("supports other widths", () => {
    expect(optimizedSrc("/images/projects/educu.png", { width: 600, height: 375, quality: 75 })).toContain("w=1200&q=75");
  });
});

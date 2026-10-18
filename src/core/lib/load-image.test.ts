import { afterEach, describe, expect, it, vi } from "vitest";
import { loadImage } from "./load-image";

type Handler = (() => void) | null;

class FakeImage {
  onload: Handler = null;
  onerror: Handler = null;
  static outcome: "load" | "error" = "load";
  set src(_value: string) {
    queueMicrotask(() => (FakeImage.outcome === "load" ? this.onload?.() : this.onerror?.()));
  }
}

afterEach(() => vi.unstubAllGlobals());

describe("loadImage", () => {
  it("resolves the image once loaded", async () => {
    FakeImage.outcome = "load";
    vi.stubGlobal("Image", FakeImage);

    await expect(loadImage("/a.png")).resolves.toBeInstanceOf(FakeImage);
  });

  it("resolves null when the image fails", async () => {
    FakeImage.outcome = "error";
    vi.stubGlobal("Image", FakeImage);

    await expect(loadImage("/missing.png")).resolves.toBeNull();
  });
});

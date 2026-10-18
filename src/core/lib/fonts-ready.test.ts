import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { awaitFonts } from "./fonts-ready";

const specs = ["84px Ranchers", "700 24px Sans"];

function stubFonts(load: (spec: string) => Promise<unknown>): void {
  Object.defineProperty(document, "fonts", { value: { load }, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(document, "fonts");
  vi.useRealTimers();
});

describe("awaitFonts", () => {
  it("resolves true once every font spec has loaded", async () => {
    const load = vi.fn().mockResolvedValue([]);
    stubFonts(load);

    await expect(awaitFonts(specs)).resolves.toBe(true);

    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenCalledWith("84px Ranchers");
  });

  it("resolves false when a load rejects", async () => {
    stubFonts(() => Promise.reject(new Error("nope")));

    await expect(awaitFonts(specs)).resolves.toBe(false);
  });

  it("resolves false when document.fonts is missing", async () => {
    Reflect.deleteProperty(document, "fonts");

    await expect(awaitFonts(specs)).resolves.toBe(false);
  });

  describe("with fake timers", () => {
    beforeEach(() => vi.useFakeTimers());

    it("resolves false on timeout instead of hanging", async () => {
      stubFonts(() => new Promise(() => undefined));
      const result = awaitFonts(specs, 3000);

      await vi.advanceTimersByTimeAsync(3000);

      await expect(result).resolves.toBe(false);
    });

    it("clears its timer when fonts load first", async () => {
      stubFonts(() => Promise.resolve([]));

      await awaitFonts(specs, 3000);

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

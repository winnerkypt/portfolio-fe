import { afterEach, describe, expect, it, vi } from "vitest";
import { hasWebGL } from "./webgl";

afterEach(() => vi.restoreAllMocks());

function mockContext(impl: (type: string) => unknown): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    ((type: string) => impl(type)) as HTMLCanvasElement["getContext"],
  );
}

const probe = { getExtension: () => null };

describe("hasWebGL", () => {
  it("releases the probe context so it does not count against the browser limit", () => {
    const loseContext = vi.fn();
    mockContext((type) => (type === "webgl2" ? { getExtension: () => ({ loseContext }) } : null));

    expect(hasWebGL()).toBe(true);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it("is true when webgl2 is available", () => {
    mockContext((type) => (type === "webgl2" ? probe : null));

    expect(hasWebGL()).toBe(true);
  });

  it("falls back to webgl1", () => {
    mockContext((type) => (type === "webgl" ? probe : null));

    expect(hasWebGL()).toBe(true);
  });

  it("is false when no context can be created", () => {
    mockContext(() => null);

    expect(hasWebGL()).toBe(false);
  });

  it("is false when context creation throws", () => {
    mockContext(() => {
      throw new Error("blocked");
    });

    expect(hasWebGL()).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import { buildGuarded, createDisposers } from "./disposers";

describe("createDisposers", () => {
  it("runs in reverse order and only once", () => {
    const order: string[] = [];
    const stack = createDisposers();
    stack.add(() => order.push("a"));
    stack.add(() => order.push("b"));

    stack.run();
    stack.run();

    expect(order).toEqual(["b", "a"]);
  });

  it("keeps running after one disposer throws, then reports it", () => {
    const last = vi.fn();
    const stack = createDisposers();
    stack.add(last);
    stack.add(() => {
      throw new Error("boom");
    });

    expect(() => stack.run()).toThrow("boom");
    expect(last).toHaveBeenCalled();
  });
});

describe("buildGuarded", () => {
  it("returns the built value without cleaning up", () => {
    const cleanup = vi.fn();

    const value = buildGuarded((d) => {
      d.add(cleanup);
      return 42;
    });

    expect(value).toBe(42);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("unwinds created resources in reverse and rethrows the original error", () => {
    const order: string[] = [];
    const failure = new Error("step 3 failed");

    expect(() =>
      buildGuarded((d) => {
        d.add(() => order.push("first"));
        d.add(() => order.push("second"));
        throw failure;
      }),
    ).toThrow(failure);

    expect(order).toEqual(["second", "first"]);
  });
});

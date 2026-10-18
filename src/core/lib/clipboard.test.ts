import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

describe("copyText", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns copied when the clipboard resolves", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const select = vi.fn();

    await expect(copyText("a@b.c", { clipboard: { writeText }, select })).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("a@b.c");
    expect(select).not.toHaveBeenCalled();
  });

  it("selects and warns when the clipboard rejects", async () => {
    const error = new Error("denied");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const select = vi.fn();

    await expect(copyText("x", { clipboard: { writeText: vi.fn().mockRejectedValue(error) }, select })).resolves.toBe(
      "selected",
    );
    expect(select).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("clipboard"), error);
  });

  it("selects when the clipboard is unavailable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const select = vi.fn();

    await expect(copyText("x", { clipboard: undefined, select })).resolves.toBe("selected");
    expect(select).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
  });

  it("selects when writeText throws synchronously", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const select = vi.fn();
    const writeText = vi.fn(() => {
      throw new Error("sync");
    });

    await expect(copyText("x", { clipboard: { writeText }, select })).resolves.toBe("selected");
  });
});

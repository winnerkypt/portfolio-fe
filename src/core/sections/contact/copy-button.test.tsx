import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

const EMAIL = "kanyapat.witta@gmail.com";

function renderRow() {
  return render(
    <li>
      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <CopyButton text={EMAIL} />
    </li>,
  );
}

function stubClipboard(writeText: () => Promise<void>): void {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

async function click(): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByRole("button"));
  });
}

describe("CopyButton", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "clipboard");
    window.getSelection()?.removeAllRanges();
  });

  it("is a live Copy button without aria-disabled", () => {
    renderRow();

    expect(screen.getByRole("button", { name: "Copy email address" })).not.toHaveAttribute("aria-disabled");
  });

  it("announces the result in a separate status region, not on the button", async () => {
    stubClipboard(() => Promise.resolve());
    renderRow();

    await click();

    expect(screen.getByRole("status")).toHaveTextContent("Email address copied");
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-live");
  });

  it("writes the text and shows Copied for 1.6s before resetting", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderRow();

    await click();
    expect(writeText).toHaveBeenCalledWith(EMAIL);
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
    act(() => {
      vi.advanceTimersByTime(1599);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copy");
    expect(screen.getByRole("button")).not.toHaveTextContent("Copied");
  });

  it("selects the email text and shows Selected when the clipboard rejects", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    renderRow();

    await click();
    expect(screen.getByRole("button")).toHaveTextContent("Selected");
    expect(window.getSelection()?.toString()).toBe(EMAIL);
  });

  it("falls back to selection when the clipboard API is unavailable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderRow();

    await click();
    expect(screen.getByRole("button")).toHaveTextContent("Selected");
    expect(warn).toHaveBeenCalled();
  });

  it("restarts the reset timer on a second click", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    renderRow();

    await click();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    await click();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
  });
});

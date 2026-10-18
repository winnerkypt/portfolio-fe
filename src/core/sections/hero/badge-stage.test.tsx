import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useLazyScene: vi.fn(),
  loadImage: vi.fn(),
  createBadgeScene: vi.fn(),
}));

vi.mock("@/core/hooks/useLazyScene", () => ({ useLazyScene: mocks.useLazyScene }));
vi.mock("@/core/lib/load-image", () => ({ loadImage: mocks.loadImage }));
vi.mock("@/core/three/badge-scene", () => ({ createBadgeScene: mocks.createBadgeScene }));

import { BadgeStage } from "./badge-stage";

type Options = { onReady: () => void; onLost: () => void };
type Loader = () => Promise<(container: HTMLElement, hooks: { onLost: () => void }) => unknown>;

function lastCall(): { loader: Loader; options: Options } {
  const call = mocks.useLazyScene.mock.calls.at(-1);
  return { loader: call?.[1], options: call?.[2] };
}

function stage(): HTMLElement {
  return screen.getByRole("img");
}

beforeEach(() => {
  mocks.useLazyScene.mockReset();
  mocks.loadImage.mockReset().mockResolvedValue({ tag: "photo" });
  mocks.createBadgeScene.mockReset().mockReturnValue({ dispose: vi.fn(), redraw: vi.fn() });
});

describe("BadgeStage", () => {
  it("starts with the fallback showing and the badge face up", () => {
    render(<BadgeStage label="badge">fallback</BadgeStage>);

    expect(stage()).toHaveAttribute("data-ready", "false");
    expect(stage()).toHaveAttribute("data-flipped", "false");
    expect(stage()).toHaveTextContent("fallback");
  });

  it("flips ready on when the scene is ready and back off when the context is lost", () => {
    render(<BadgeStage label="badge">x</BadgeStage>);

    act(() => lastCall().options.onReady());
    expect(stage()).toHaveAttribute("data-ready", "true");

    act(() => lastCall().options.onLost());
    expect(stage()).toHaveAttribute("data-ready", "false");
  });

  it("loads the optimised profile photo and wires flip and lost into the scene", async () => {
    render(<BadgeStage label="badge">x</BadgeStage>);
    const { loader } = lastCall();
    const onLost = vi.fn();

    const factory = await loader();
    factory(document.createElement("div"), { onLost });

    expect(mocks.loadImage).toHaveBeenCalledWith("/_next/image?url=%2Fimages%2Fprofile.jpg&w=750&q=80");
    const sceneOptions = mocks.createBadgeScene.mock.calls[0][1];
    expect(sceneOptions.onLost).toBe(onLost);
    expect(sceneOptions.images).toEqual({ photo: { tag: "photo" } });

    act(() => sceneOptions.onFlip(true));
    expect(stage()).toHaveAttribute("data-flipped", "true");
  });

  it("returns to face-up when the context is lost while flipped", async () => {
    render(<BadgeStage label="badge">x</BadgeStage>);
    const factory = await lastCall().loader();
    factory(document.createElement("div"), { onLost: vi.fn() });
    act(() => mocks.createBadgeScene.mock.calls[0][1].onFlip(true));
    expect(stage()).toHaveAttribute("data-flipped", "true");

    act(() => lastCall().options.onLost());

    expect(stage()).toHaveAttribute("data-flipped", "false");
  });
});

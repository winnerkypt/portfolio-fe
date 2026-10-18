import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useLazyScene: vi.fn(),
  loadImage: vi.fn(),
  createDrawerScene: vi.fn(),
}));

vi.mock("@/core/hooks/useLazyScene", () => ({ useLazyScene: mocks.useLazyScene }));
vi.mock("@/core/lib/load-image", () => ({ loadImage: mocks.loadImage }));
vi.mock("@/core/three/drawer-scene", () => ({ createDrawerScene: mocks.createDrawerScene }));

import { projects } from "@/core/data/projects";
import { CaseSelectionContext } from "./case-selection";
import { DrawerStage } from "./drawer-stage";

type Options = { onReady: () => void; onLost: () => void };
type Factory = (container: HTMLElement, hooks: { onLost: () => void }) => { dispose(): void; redraw(): void };

const select = vi.fn();
const scene = { setIndex: vi.fn(), redraw: vi.fn(), dispose: vi.fn() };

function ui(index: number): ReactNode {
  return (
    <CaseSelectionContext.Provider value={{ index, select }}>
      <DrawerStage label="folders">
        <span data-testid="fallback" />
      </DrawerStage>
    </CaseSelectionContext.Provider>
  );
}

function lastCall(): { load: () => Promise<Factory>; options: Options } {
  const call = mocks.useLazyScene.mock.calls.at(-1);
  return { load: call?.[1], options: call?.[2] };
}

async function mountScene(): Promise<{ onLost: () => void }> {
  const factory = await lastCall().load();
  const onLost = vi.fn();
  factory(document.createElement("div"), { onLost });
  return { onLost };
}

beforeEach(() => {
  select.mockReset();
  Object.values(scene).forEach((fn) => fn.mockReset());
  mocks.useLazyScene.mockReset();
  mocks.loadImage.mockReset().mockImplementation(async (src: string) => ({ src }));
  mocks.createDrawerScene.mockReset().mockReturnValue(scene);
});

describe("DrawerStage", () => {
  it("keeps the fallback and exposes the scene hooks", () => {
    render(ui(0));
    const stage = screen.getByRole("img", { name: "folders" });

    expect(stage).toHaveAttribute("data-scene", "drawer");
    expect(stage).toHaveAttribute("data-ready", "false");
    expect(stage).toHaveAttribute("data-index", "0");
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  it("marks ready when the scene is up and not ready again when the context is lost", () => {
    render(ui(0));
    const stage = screen.getByRole("img", { name: "folders" });

    act(() => lastCall().options.onReady());
    expect(stage).toHaveAttribute("data-ready", "true");

    act(() => lastCall().options.onLost());
    expect(stage).toHaveAttribute("data-ready", "false");
  });

  it("loads an optimised screenshot per project and creates the scene at the current index", async () => {
    render(ui(3));

    await mountScene();

    expect(mocks.loadImage).toHaveBeenCalledTimes(projects.length);
    expect(mocks.loadImage.mock.calls[0][0]).toContain("/_next/image?url=%2Fimages%2Fprojects%2Feducu.png&w=1200");
    const sceneOptions = mocks.createDrawerScene.mock.calls[0][1];
    expect(sceneOptions.initialIndex).toBe(3);
    expect(sceneOptions.projects).toBe(projects);
    expect(sceneOptions.images).toHaveLength(projects.length);
  });

  it("selects the case when a folder is clicked in the scene", async () => {
    render(ui(0));
    await mountScene();

    mocks.createDrawerScene.mock.calls[0][1].onSelect(2);

    expect(select).toHaveBeenCalledWith(2);
  });

  it("forwards context loss from the scene to the hook", async () => {
    render(ui(0));
    const { onLost } = await mountScene();

    mocks.createDrawerScene.mock.calls[0][1].onLost();

    expect(onLost).toHaveBeenCalledTimes(1);
  });

  it("animates the scene when the selected index changes from outside", async () => {
    const view = render(ui(0));
    await mountScene();
    scene.setIndex.mockClear();

    view.rerender(ui(3));

    expect(scene.setIndex).toHaveBeenCalledWith(3);
    expect(screen.getByRole("img", { name: "folders" })).toHaveAttribute("data-index", "3");
  });

  it("stops driving the scene once it is disposed", async () => {
    const view = render(ui(0));
    const factory = await lastCall().load();
    const handle = factory(document.createElement("div"), { onLost: vi.fn() });
    scene.setIndex.mockClear();

    handle.dispose();
    view.rerender(ui(2));

    expect(scene.dispose).toHaveBeenCalledTimes(1);
    expect(scene.setIndex).not.toHaveBeenCalled();
  });

  it("mirrors the scene's own index on the stage without going through React state", async () => {
    const view = render(ui(0));
    await mountScene();
    const stage = screen.getByRole("img", { name: "folders" });
    const { onIndexChange } = mocks.createDrawerScene.mock.calls[0][1];

    onIndexChange(2);
    expect(stage).toHaveAttribute("data-scene-index", "2");

    view.rerender(ui(4));
    expect(stage).toHaveAttribute("data-scene-index", "2");
    onIndexChange(4);
    expect(stage).toHaveAttribute("data-scene-index", "4");
  });

  it("drops the scene index when the scene is disposed or lost", async () => {
    render(ui(0));
    const factory = await lastCall().load();
    const handle = factory(document.createElement("div"), { onLost: vi.fn() });
    const stage = screen.getByRole("img", { name: "folders" });
    mocks.createDrawerScene.mock.calls[0][1].onIndexChange(1);

    handle.dispose();

    expect(stage).not.toHaveAttribute("data-scene-index");
  });
});

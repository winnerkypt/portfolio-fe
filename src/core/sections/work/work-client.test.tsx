import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { projects } from "@/core/data/projects";
import { useCaseSelection } from "./case-selection";
import { WorkClient } from "./work-client";

const scrollIntoView = vi.fn();

function mockSpreadRect(top: number, bottom: number): void {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top, bottom } as DOMRect);
}

function tab(name: string): HTMLElement {
  return within(screen.getByRole("list", { name: /projects/i })).getByRole("button", { name });
}

function settle(): void {
  act(() => {
    vi.advanceTimersByTime(220);
  });
}

describe("WorkClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = scrollIntoView;
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    mockSpreadRect(100, 700);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    scrollIntoView.mockClear();
  });

  it("starts on the first project with its tab pressed", () => {
    render(<WorkClient projects={projects} />);

    expect(screen.getByRole("heading", { level: 3, name: projects[0].name })).toBeInTheDocument();
    expect(tab("EDU CU")).toHaveAttribute("aria-pressed", "true");
  });

  it("buttons no longer carry aria-disabled", () => {
    render(<WorkClient projects={projects} />);

    for (const button of screen.getAllByRole("button")) expect(button).not.toHaveAttribute("aria-disabled");
  });

  it("clicking a tab moves aria-pressed immediately and swaps the spread after 220ms", () => {
    render(<WorkClient projects={projects} />);

    fireEvent.click(tab("Troika"));
    expect(tab("Troika")).toHaveAttribute("aria-pressed", "true");
    expect(tab("EDU CU")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(projects[0].name);

    settle();
    expect(screen.getByRole("heading", { level: 3, name: "Troika Syndicate" })).toBeInTheDocument();
    expect(screen.getByText("03 / 05")).toBeInTheDocument();
    expect(screen.getByText("troikasyndicate.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Visit live site/ })).toHaveAttribute("href", projects[2].link);
  });

  it("fades the spread out during the swap and back in after", () => {
    const { container } = render(<WorkClient projects={projects} />);
    const spread = container.querySelector(".case-spread") as HTMLElement;

    expect(spread).toHaveAttribute("data-phase", "in");
    fireEvent.click(tab("Systems"));
    expect(spread).toHaveAttribute("data-phase", "out");
    settle();
    expect(spread).toHaveAttribute("data-phase", "in");
  });

  it("pings the spread on every change, restarting the animation", () => {
    const { container } = render(<WorkClient projects={projects} />);

    expect(container.querySelector(".cs-ping")).toBeNull();
    fireEvent.click(tab("Reborna"));
    const first = container.querySelector(".cs-ping");
    expect(first).not.toBeNull();
    settle();
    fireEvent.click(tab("Troika"));
    expect(container.querySelector(".cs-ping")).not.toBe(first);
  });

  it("next wraps from the last project to the first", () => {
    render(<WorkClient projects={projects} />);

    fireEvent.click(tab("KSec"));
    settle();
    fireEvent.click(screen.getByRole("button", { name: "Next project" }));
    settle();
    expect(tab("EDU CU")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { level: 3, name: projects[0].name })).toBeInTheDocument();
  });

  it("previous wraps from the first project to the last", () => {
    render(<WorkClient projects={projects} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous project" }));
    settle();
    expect(tab("KSec")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("05 / 05")).toBeInTheDocument();
  });

  it("swaps instantly under reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    render(<WorkClient projects={projects} />);

    fireEvent.click(tab("Troika"));
    expect(screen.getByRole("heading", { level: 3, name: "Troika Syndicate" })).toBeInTheDocument();
  });

  it("scrolls the spread into view smoothly when it is below the fold", () => {
    mockSpreadRect(790, 1400);
    render(<WorkClient projects={projects} />);

    fireEvent.click(tab("Troika"));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
  });

  it("scrolls instantly under reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    mockSpreadRect(790, 1400);
    render(<WorkClient projects={projects} />);

    fireEvent.click(tab("Troika"));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "nearest" });
  });

  it("does not scroll when the spread is already visible", () => {
    render(<WorkClient projects={projects} />);

    fireEvent.click(tab("Troika"));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does not scroll on first render", () => {
    mockSpreadRect(790, 1400);
    render(<WorkClient projects={projects} />);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("exposes select and the current index to nested client components", () => {
    function Probe() {
      const { index, select } = useCaseSelection();
      return (
        <button type="button" onClick={() => select(3)}>
          probe {index}
        </button>
      );
    }
    render(
      <WorkClient projects={projects}>
        <Probe />
      </WorkClient>,
    );

    fireEvent.click(screen.getByRole("button", { name: "probe 0" }));
    expect(screen.getByRole("button", { name: "probe 3" })).toBeInTheDocument();
    expect(tab("Systems")).toHaveAttribute("aria-pressed", "true");
  });

  it("throws when the selection hook is used outside WorkClient", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Orphan() {
      useCaseSelection();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/WorkClient/);
  });
  it("announces the newly selected case to screen readers", () => {
    render(<WorkClient projects={projects} />);

    fireEvent.click(tab("Troika"));
    settle();

    expect(screen.getByRole("status")).toHaveTextContent("Case 03 of 05: Troika Syndicate");
  });
});

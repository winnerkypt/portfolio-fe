import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Project } from "@/core/data/types/project";
import { FileIndex } from "./file-index";

const projects = [{ id: "a", tab: "Alpha" }, { id: "b", tab: "Beta" }] as unknown as readonly Project[];

function mockGeometry(list: HTMLElement, scrollWidth: number, clientWidth: number): void {
  Object.defineProperty(list, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(list, "clientWidth", { configurable: true, value: clientWidth });
}

describe("FileIndex edge fade", () => {
  it("marks only the end edge when tabs overflow and the strip is at its start", () => {
    const { getByRole } = render(<FileIndex projects={projects} activeIndex={0} onSelect={() => {}} />);
    const list = getByRole("list");
    mockGeometry(list, 500, 300);

    fireEvent.scroll(list);

    expect(list).toHaveAttribute("data-fade-end");
    expect(list).not.toHaveAttribute("data-fade-start");
  });

  it("marks the start edge after scrolling and clears the end edge at the far end", () => {
    const { getByRole } = render(<FileIndex projects={projects} activeIndex={0} onSelect={() => {}} />);
    const list = getByRole("list");
    mockGeometry(list, 500, 300);
    list.scrollLeft = 200;

    fireEvent.scroll(list);

    expect(list).toHaveAttribute("data-fade-start");
    expect(list).not.toHaveAttribute("data-fade-end");
  });

  it("marks nothing when the tabs fit", () => {
    const { getByRole } = render(<FileIndex projects={projects} activeIndex={0} onSelect={() => {}} />);
    const list = getByRole("list");
    mockGeometry(list, 300, 300);

    fireEvent.scroll(list);

    expect(list).not.toHaveAttribute("data-fade-start");
    expect(list).not.toHaveAttribute("data-fade-end");
  });
});

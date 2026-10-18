import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { projects } from "@/core/data/projects";
import { CaseSpread } from "./case-spread";
import { Work } from "./work";

describe("Work", () => {
  it("is the #projects landmark with the drawer scene mount", () => {
    const { container } = render(<Work />);

    expect(container.querySelector("section#projects")).not.toBeNull();
    expect(container.querySelector('[data-scene="drawer"] img')).toHaveAttribute(
      "src",
      expect.stringContaining("folders.webp"),
    );
  });

  it("tells every visitor how to open a case, not only those who see the 3D drawer", () => {
    render(<Work />);

    expect(screen.getByText(/Pick a folder or a tab to open it\./)).toBeInTheDocument();
    expect(screen.queryByText(/Click any folder/)).toBeNull();
  });

  it("renders a tab button per project with the first one pressed", () => {
    render(<Work />);

    const index = screen.getByRole("list", { name: /projects/i });
    const buttons = within(index).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(projects.map((p) => p.tab));
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("renders step buttons with accessible names", () => {
    render(<Work />);

    expect(screen.getByRole("button", { name: "Previous project" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next project" })).toBeInTheDocument();
  });

  it("shows the first project in the case spread", () => {
    render(<Work />);

    expect(screen.getByRole("heading", { level: 3, name: projects[0].name })).toBeInTheDocument();
    expect(screen.getByText("01 / 05")).toBeInTheDocument();
  });
});

describe("CaseSpread", () => {
  const project = projects[2];

  it("renders screenshot, host label and notes for the given project", () => {
    const { container } = render(<CaseSpread project={project} index={2} total={5} />);

    expect(container.querySelector("figure.cs-print img")).toHaveAttribute(
      "src",
      expect.stringContaining("troika.png"),
    );
    expect(screen.getByText("troikasyndicate.com")).toBeInTheDocument();
    expect(screen.getByText("03 / 05")).toBeInTheDocument();
    expect(screen.getByText(String(project.year))).toBeInTheDocument();
    expect(screen.getByText(project.desc)).toBeInTheDocument();
    for (const tag of project.tags) expect(screen.getByText(tag)).toBeInTheDocument();
  });

  it("opens the live site safely in a new tab", () => {
    render(<CaseSpread project={project} index={2} total={5} />);

    const link = screen.getByRole("link", { name: /Visit live site/ });
    expect(link).toHaveAttribute("href", project.link);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("offsets the print and the notes card, never the spread itself", () => {
    const { container } = render(<CaseSpread project={projects[0]} index={0} total={projects.length} />);

    expect(container.querySelector(".cs-print")?.getAttribute("data-parallax")).toBe("0.05");
    expect(container.querySelector(".cs-notes")?.getAttribute("data-parallax")).toBe("-0.03");
    expect(container.querySelector(".case-spread")).not.toHaveAttribute("data-parallax");
  });
});

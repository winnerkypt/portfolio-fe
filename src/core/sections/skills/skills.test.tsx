import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { skillGroups, toolbox } from "@/core/data/skills";
import { Skills } from "./skills";

describe("Skills", () => {
  it("is the #skills landmark", () => {
    const { container } = render(<Skills />);

    expect(container.querySelector("section#skills")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("What I build with");
  });

  it("renders a card per group with every chip from data", () => {
    render(<Skills />);

    for (const group of skillGroups) {
      const card = screen.getByRole("heading", { name: group.title }).closest("article");
      expect(card).not.toBeNull();
      for (const chip of group.chips) {
        expect(within(card as HTMLElement).getByText(chip)).toBeInTheDocument();
      }
    }
  });

  it("renders the toolbox row and no main focus stamp", () => {
    render(<Skills />);

    expect(screen.getByText(toolbox.title)).toBeInTheDocument();
    for (const item of toolbox.items) expect(screen.getByText(item)).toBeInTheDocument();
    expect(screen.queryByText(/main focus/i)).not.toBeInTheDocument();
  });

  it("marks tape and stickers as decorative", () => {
    const { container } = render(<Skills />);

    const decorations = container.querySelectorAll(".tape, .sticker");
    expect(decorations.length).toBeGreaterThan(0);
    decorations.forEach((el) => expect(el).toHaveAttribute("aria-hidden", "true"));
  });

  it("drifts the heading and each card at its own parallax speed", () => {
    const { container } = render(<Skills />);

    const speed = (selector: string) => Number(container.querySelector(selector)?.getAttribute("data-parallax"));
    expect(speed(".sec-head-slot")).toBe(0.03);
    expect(speed(".stack-slot:nth-child(1)")).toBe(0.04);
    expect(speed(".stack-slot:nth-child(2)")).toBe(0.07);
    expect(container.querySelectorAll(".stack-card [data-parallax]").length).toBeGreaterThan(1);
  });
});

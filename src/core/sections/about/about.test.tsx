import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { profile } from "@/core/data/profile";
import { About } from "./about";

describe("About", () => {
  it("is the #about landmark with a heading", () => {
    const { container } = render(<About />);

    expect(container.querySelector("section#about")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "A full-stack engineer who ships the whole thing.",
    );
  });

  it("renders the portrait with alt text and a decorative tape", () => {
    const { container } = render(<About />);

    expect(screen.getByRole("img", { name: /Kanyapat/ })).toHaveAttribute(
      "src",
      expect.stringContaining("profile.jpg"),
    );
    expect(container.querySelector(".tape")).toHaveAttribute("aria-hidden", "true");
  });

  it("lists every fact in a description list", () => {
    const { container } = render(<About />);

    const facts = container.querySelector("dl.facts") as HTMLElement;
    for (const fact of profile.about.facts) {
      expect(within(facts).getByText(fact.term)).toBeInTheDocument();
      expect(within(facts).getByText(fact.detail)).toBeInTheDocument();
    }
  });

  it("layers the portrait, circle and tape at different parallax speeds", () => {
    const { container } = render(<About />);

    const speed = (selector: string) => Number(container.querySelector(selector)?.getAttribute("data-parallax"));
    expect(speed(".portrait")).toBeGreaterThan(0);
    expect(speed(".portrait-circle")).toBeGreaterThan(speed(".portrait"));
    expect(speed(".tape")).toBeLessThan(speed(".portrait"));
    expect(container.querySelector(".portrait-circle")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".about-text [data-parallax]")).toBeNull();
  });
});

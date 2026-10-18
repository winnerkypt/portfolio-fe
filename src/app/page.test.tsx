import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders a single h1 and all four section landmarks", () => {
    const { container } = render(<Home />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const id of ["about", "skills", "projects", "contact"]) {
      expect(container.querySelector(`section#${id}`)).not.toBeNull();
    }
  });

  it("offers a skip link to the main content", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#top");
  });
});
